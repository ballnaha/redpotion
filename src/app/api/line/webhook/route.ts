import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// LINE Channel Secret จาก environment variables
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

// ฟังก์ชันสำหรับ verify signature จาก LINE
function verifySignature(body: string, signature: string): boolean {
  if (!CHANNEL_SECRET) {
    console.error('LINE_CHANNEL_SECRET not found');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return signature === `sha256=${expectedSignature}`;
}

// ฟังก์ชันสำหรับดึง LINE User Profile
async function getLineUserProfile(userId: string) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN not found');
  }

  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching LINE user profile:', error);
    return null;
  }
}

// ฟังก์ชันสำหรับประมวลผล LINE events
async function processLineEvent(event: any) {
  try {
    const { type, source, timestamp, replyToken } = event;
    const lineUserId = source?.userId;

    if (!lineUserId) {
      console.log('No user ID in event:', event);
      return;
    }

    // แปลง timestamp จาก milliseconds เป็น Date
    const eventDate = new Date(timestamp);

    // กำหนดประเภท event และ message
    let eventType = 'OTHER';
    let messageType = null;
    let messageText = null;
    let messageId = null;

    switch (type) {
      case 'message':
        eventType = 'MESSAGE';
        messageType = event.message?.type?.toUpperCase() || 'OTHER';
        messageText = event.message?.text || null;
        messageId = event.message?.id || null;
        break;
      case 'follow':
        eventType = 'FOLLOW';
        break;
      case 'unfollow':
        eventType = 'UNFOLLOW';
        break;
      case 'join':
        eventType = 'JOIN';
        break;
      case 'leave':
        eventType = 'LEAVE';
        break;
      case 'postback':
        eventType = 'POSTBACK';
        break;
      case 'beacon':
        eventType = 'BEACON';
        break;
      case 'accountLink':
        eventType = 'ACCOUNT_LINK';
        break;
      case 'things':
        eventType = 'THINGS';
        break;
      default:
        eventType = 'OTHER';
    }

    // บันทึก webhook event
    const webhookEvent = await prisma.lineWebhookEvent.create({
      data: {
        eventType: eventType as any,
        lineUserId,
        replyToken,
        messageType: messageType as any,
        messageText,
        messageId,
        timestamp: eventDate,
        rawData: event,
        isProcessed: false,
      },
    });

    // ตรวจสอบว่ามี LineUserProfile อยู่แล้วหรือไม่
    let userProfile = await prisma.lineUserProfile.findUnique({
      where: { lineUserId },
    });

    // ถ้าไม่มี หรือเป็น event follow/message ให้ดึงข้อมูลจาก LINE API
    if (!userProfile || eventType === 'FOLLOW' || eventType === 'MESSAGE') {
      const lineProfile = await getLineUserProfile(lineUserId);
      
      if (lineProfile) {
        // อัพเดทหรือสร้าง LineUserProfile
        userProfile = await prisma.lineUserProfile.upsert({
          where: { lineUserId },
          update: {
            displayName: lineProfile.displayName,
            pictureUrl: lineProfile.pictureUrl,
            statusMessage: lineProfile.statusMessage,
            language: lineProfile.language,
            isFollowing: eventType !== 'UNFOLLOW',
            lastActiveAt: eventDate,
            ...(eventType === 'FOLLOW' && { followedAt: eventDate }),
            ...(eventType === 'UNFOLLOW' && { unfollowedAt: eventDate }),
          },
          create: {
            lineUserId,
            displayName: lineProfile.displayName,
            pictureUrl: lineProfile.pictureUrl,
            statusMessage: lineProfile.statusMessage,
            language: lineProfile.language,
            isFollowing: eventType !== 'UNFOLLOW',
            lastActiveAt: eventDate,
            followedAt: eventType === 'FOLLOW' ? eventDate : undefined,
            unfollowedAt: eventType === 'UNFOLLOW' ? eventDate : undefined,
          },
        });
      }
    } else {
      // อัพเดทเฉพาะ lastActiveAt และสถานะการติดตาม
      await prisma.lineUserProfile.update({
        where: { lineUserId },
        data: {
          lastActiveAt: eventDate,
          isFollowing: eventType !== 'UNFOLLOW',
          ...(eventType === 'UNFOLLOW' && { unfollowedAt: eventDate }),
        },
      });
    }

    // อัพเดทสถานะการประมวลผล
    await prisma.lineWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        isProcessed: true,
        processedAt: new Date(),
      },
    });

    console.log(`Processed LINE event: ${eventType} from user ${lineUserId}`);
  } catch (error) {
    console.error('Error processing LINE event:', error);
    
    // บันทึก error ลงฐานข้อมูล
    if (event.source?.userId) {
      await prisma.lineWebhookEvent.create({
        data: {
          eventType: 'OTHER',
          lineUserId: event.source.userId,
          timestamp: new Date(event.timestamp || Date.now()),
          rawData: event,
          isProcessed: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ Content-Type
    const contentType = request.headers.get('content-type');
    if (contentType !== 'application/json') {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // อ่าน body
    const body = await request.text();
    
    // ตรวจสอบ signature
    const signature = request.headers.get('x-line-signature');
    if (!signature || !verifySignature(body, signature)) {
      console.error('Invalid LINE signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Parse JSON
    const webhookBody = JSON.parse(body);
    
    // ตรวจสอบ structure ของ webhook
    if (!webhookBody.events || !Array.isArray(webhookBody.events)) {
      return NextResponse.json(
        { error: 'Invalid webhook structure' },
        { status: 400 }
      );
    }

    // ประมวลผล events ทั้งหมด
    const promises = webhookBody.events.map(processLineEvent);
    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 