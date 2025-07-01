import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // หาร้านอาหารที่ ACTIVE และเรียงตาม created date เพื่อเอาร้านแรก
    const defaultRestaurant = await prisma.restaurant.findFirst({
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        createdAt: 'asc' // เอาร้านที่สร้างก่อนหน้า
      },
      select: {
        id: true,
        name: true,
        status: true,
        liffId: true
      }
    });

    if (!defaultRestaurant) {
      return NextResponse.json({ 
        error: 'No active restaurant found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      restaurantId: defaultRestaurant.id,
      restaurantName: defaultRestaurant.name,
      status: defaultRestaurant.status,
      liffId: defaultRestaurant.liffId,
      liffUrl: defaultRestaurant.liffId ? 
        `https://liff.line.me/${defaultRestaurant.liffId}?restaurant=${defaultRestaurant.id}` : 
        null
    });

  } catch (error) {
    console.error('Error fetching default restaurant:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 