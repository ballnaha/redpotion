import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant');
    
    console.log('🔗 LIFF Redirect API called with restaurant:', restaurantId);

    // ถ้าไม่มี restaurantId ให้ redirect ไปหน้าแรก
    if (!restaurantId) {
      console.log('❌ No restaurant ID provided, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    // ตรวจสอบว่าร้านอาหารมีอยู่จริงและ active
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        status: 'ACTIVE'
      }
    });

    if (!restaurant) {
      console.log('❌ Restaurant not found or not active:', restaurantId);
      return NextResponse.redirect(new URL('/not-found', request.url));
    }

    // สร้าง URL สำหรับ menu พร้อม LIFF flag
    const menuUrl = `/menu/${restaurantId}?liff=true`;
    console.log('✅ Redirecting to menu:', menuUrl);
    
    return NextResponse.redirect(new URL(menuUrl, request.url));
    
  } catch (error) {
    console.error('❌ LIFF Redirect API Error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}