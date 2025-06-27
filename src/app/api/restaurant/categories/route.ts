import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - ดึงรายการ categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // ตรวจสอบว่าเป็น restaurant owner
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      }
    });

    if (!restaurant) {
      return NextResponse.json({ message: 'Restaurant not found' }, { status: 404 });
    }

    const categories = await prisma.category.findMany({
      where: {
        restaurantId: restaurant.id
      },
      include: {
        _count: {
          select: {
            menuItems: true
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - เพิ่ม category ใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // ตรวจสอบว่าเป็น restaurant owner
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      }
    });

    if (!restaurant) {
      return NextResponse.json({ message: 'Restaurant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, imageUrl, isActive = true } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    // ตรวจสอบชื่อหมวดหมู่ซ้ำ
    const existingCategory = await prisma.category.findFirst({
      where: {
        restaurantId: restaurant.id,
        name: name.trim()
      }
    });

    if (existingCategory) {
      return NextResponse.json({ message: 'Category name already exists' }, { status: 400 });
    }

    // หา sortOrder ล่าสุด
    const lastCategory = await prisma.category.findFirst({
      where: {
        restaurantId: restaurant.id
      },
      orderBy: {
        sortOrder: 'desc'
      }
    });

    const sortOrder = (lastCategory?.sortOrder || 0) + 1;

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl || null,
        isActive,
        sortOrder,
        restaurantId: restaurant.id
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 