import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const slip = formData.get('slip') as File;
    const orderId = formData.get('orderId') as string;
    const orderNumber = formData.get('orderNumber') as string;
    const transferAmount = formData.get('transferAmount') as string;
    const transferDate = formData.get('transferDate') as string;
    const transferTime = formData.get('transferTime') as string;
    const transferRef = formData.get('transferRef') as string;
    const accountName = formData.get('accountName') as string;

    // Validate required fields
    if (!slip || !orderId || !transferAmount || !transferDate || !transferTime || !accountName) {
      return NextResponse.json({ 
        success: false, 
        error: 'ข้อมูลไม่ครบถ้วน' 
      }, { status: 400 });
    }

    // Validate file type
    if (!slip.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น' 
      }, { status: 400 });
    }

    // Validate file size (5MB)
    if (slip.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' 
      }, { status: 400 });
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'ไม่พบออเดอร์นี้' 
      }, { status: 404 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-slips');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = slip.name.split('.').pop();
    const filename = `slip_${orderNumber}_${timestamp}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    const buffer = Buffer.from(await slip.arrayBuffer());
    await writeFile(filepath, buffer);

    // Create database record for payment slip
    const paymentSlip = await (prisma as any).paymentSlip.create({
      data: {
        orderId: orderId,
        slipImageUrl: `/uploads/payment-slips/${filename}`,
        transferAmount: parseFloat(transferAmount),
        transferDate: new Date(`${transferDate}T${transferTime}`),
        transferReference: transferRef || undefined,
        accountName: accountName,
        status: 'PENDING'
      }
    });

    // Log the activity
    console.log(`💳 Payment slip uploaded for order ${orderNumber}:`, {
      orderId,
      filename,
      transferAmount,
      transferDate,
      transferTime,
      accountName,
      transferRef
    });

    return NextResponse.json({
      success: true,
      message: 'อัปโหลดสลิปการโอนเงินเรียบร้อยแล้ว',
      paymentSlip: {
        id: paymentSlip.id,
        slipImageUrl: paymentSlip.slipImageUrl,
        status: paymentSlip.status
      }
    });

  } catch (error) {
    console.error('Upload payment slip error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' 
    }, { status: 500 });
  }
} 