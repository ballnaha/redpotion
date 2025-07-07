import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface LineSessionData {
  userId: string;
  lineUserId: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  restaurantId?: string;
}

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug: Customer profile API called');
    
    // ตรวจสอบ cookies
    const cookies = req.cookies.getAll();
    console.log('🍪 Available cookies:', cookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    // ตรวจสอบ LINE session
    const sessionToken = req.cookies.get('line-session-token')?.value;
    console.log('🔐 Session token exists:', !!sessionToken);
    
    if (!sessionToken) {
      console.log('❌ No session token found');
      return NextResponse.json({ 
        error: 'No session token',
        debug: {
          cookies: cookies.map(c => c.name),
          hasSessionToken: false
        }
      }, { status: 401 });
    }

    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.log('❌ JWT secret not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let decoded: LineSessionData;
    try {
      decoded = jwt.verify(sessionToken, jwtSecret) as LineSessionData;
      console.log('✅ JWT decoded successfully:', { userId: decoded.userId, name: decoded.name });
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError);
      return NextResponse.json({ 
        error: 'Invalid session token',
        debug: {
          jwtError: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
        }
      }, { status: 401 });
    }

    const userId = decoded.userId;
    if (!userId) {
      console.log('❌ No userId in token');
      return NextResponse.json({ error: 'No userId in token' }, { status: 401 });
    }

    console.log('🔍 Looking for user:', userId);

    // ตรวจสอบ user ในฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('👤 User found:', !!user);

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ 
        error: 'User not found',
        debug: {
          userId: userId,
          userExists: false
        }
      }, { status: 404 });
    }

    // ตรวจสอบ customer profile
    console.log('🔍 Looking for customer profile...');
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: userId },
      include: {
        addresses: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log('📋 Profile found:', !!profile);

    if (!profile) {
      console.log('📝 Creating new profile for user:', userId);
      // สร้าง profile ใหม่
      const newProfile = await prisma.customerProfile.create({
        data: {
          userId: userId,
          firstName: '',
          lastName: '',
          phone: '',
          riderNote: '',
          selectedAddressType: 'HOME',
          addresses: {
            create: [
              {
                label: 'บ้าน',
                address: 'ยังไม่ได้ตั้งค่า',
                type: 'HOME',
                isDefault: true
              },
              {
                label: 'ที่ทำงาน',
                address: 'ยังไม่ได้ตั้งค่า',
                type: 'WORK',
                isDefault: false
              }
            ]
          }
        },
        include: {
          addresses: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      console.log('✅ New profile created:', newProfile.id);
      return NextResponse.json({
        profile: newProfile,
        debug: {
          action: 'created',
          userId: userId,
          profileId: newProfile.id
        }
      });
    }

    console.log('✅ Profile found:', profile.id);
    return NextResponse.json({
      profile: profile,
      debug: {
        action: 'found',
        userId: userId,
        profileId: profile.id,
        addressCount: profile.addresses.length
      }
    });

  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    }, { status: 500 });
  }
} 