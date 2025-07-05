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

// GET - ดึงข้อมูล customer profile
export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบ LINE session
    const sessionToken = req.cookies.get('line-session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let decoded: LineSessionData;
    try {
      decoded = jwt.verify(sessionToken, jwtSecret) as LineSessionData;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ใช้ camelCase ตาม Prisma convention
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: userId },
      include: {
        addresses: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!profile) {
      // สร้าง profile ใหม่ถ้าไม่มี
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

      return NextResponse.json(newProfile);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูล customer profile
export async function PUT(request: NextRequest) {
  try {
    // ตรวจสอบ LINE session
    const sessionToken = request.cookies.get('line-session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let decoded: LineSessionData;
    try {
      decoded = jwt.verify(sessionToken, jwtSecret) as LineSessionData;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      riderNote,
      selectedAddressType,
      addresses,
      currentLatitude,
      currentLongitude,
      currentAddress
    } = body;

    // อัปเดต profile
    const updatedProfile = await prisma.customerProfile.upsert({
      where: { userId: userId },
      update: {
        firstName,
        lastName,
        phone,
        riderNote,
        selectedAddressType,
        currentLatitude,
        currentLongitude,
        currentAddress,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        firstName,
        lastName,
        phone,
        riderNote,
        selectedAddressType,
        currentLatitude,
        currentLongitude,
        currentAddress
      }
    });

    // อัปเดต addresses ถ้ามีส่งมา
    if (addresses && Array.isArray(addresses)) {
      // ลบ addresses เก่าทั้งหมด
      await prisma.deliveryAddress.deleteMany({
        where: { customerProfileId: updatedProfile.id }
      });

      // สร้าง addresses ใหม่
      await prisma.deliveryAddress.createMany({
        data: addresses.map((addr: any) => ({
          customerProfileId: updatedProfile.id,
          label: addr.label,
          address: addr.address,
          latitude: addr.latitude,
          longitude: addr.longitude,
          locationAddress: addr.locationAddress,
          isDefault: addr.isDefault,
          type: addr.type
        }))
      });
    }

    // ดึงข้อมูลใหม่พร้อม addresses
    const finalProfile = await prisma.customerProfile.findUnique({
      where: { id: updatedProfile.id },
      include: {
        addresses: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(finalProfile);
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 