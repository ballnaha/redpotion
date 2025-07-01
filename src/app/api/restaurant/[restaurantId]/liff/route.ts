import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantId } = await params;
    const { liffId } = await request.json();

    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของร้านหรือ Admin
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        OR: [
          { ownerId: session.user.id },
          { owner: { role: 'ADMIN' } }
        ]
      }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found or access denied' }, { status: 404 });
    }

    // อัปเดต LIFF ID
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { liffId }
    });

    return NextResponse.json({
      success: true,
      liffId: updatedRestaurant.liffId,
      liffUrl: liffId ? `https://liff.line.me/${liffId}?restaurant=${restaurantId}` : null
    });

  } catch (error) {
    console.error('Error updating LIFF ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { 
        id: true, 
        name: true, 
        liffId: true,
        status: true
      }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      liffId: restaurant.liffId,
      liffUrl: restaurant.liffId ? `https://liff.line.me/${restaurant.liffId}?restaurant=${restaurantId}` : null,
      status: restaurant.status
    });

  } catch (error) {
    console.error('Error fetching LIFF info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 