import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - ดึงรายการ addons ของ menu item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ menuItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const menuItemId = resolvedParams.menuItemId;

    // ตรวจสอบว่า menu item นี้เป็นของ restaurant owner คนนี้
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurant: {
          ownerId: session.user.id
        }
      }
    });

    if (!menuItem) {
      return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
    }

    // ดึง addons ด้วย raw SQL
    try {
      const addons = await prisma.$queryRaw<Array<{
        id: string;
        name: string;
        price: number;
        isAvailable: boolean;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
      }>>`
        SELECT id, name, price, "isAvailable", "sortOrder", "createdAt", "updatedAt"
        FROM "Addon" 
        WHERE "menuItemId" = ${menuItemId}
        ORDER BY "sortOrder" ASC
      `;
      
      return NextResponse.json(addons);
    } catch (sqlError) {
      console.error('Error fetching addons with raw SQL:', sqlError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - เพิ่ม addon ใหม่
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ menuItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const menuItemId = resolvedParams.menuItemId;

    // ตรวจสอบว่า menu item นี้เป็นของ restaurant owner คนนี้
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurant: {
          ownerId: session.user.id
        }
      }
    });

    if (!menuItem) {
      return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, price, isAvailable = true } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ message: 'Addon name is required' }, { status: 400 });
    }

    if (!price || price <= 0) {
      return NextResponse.json({ message: 'Valid price is required' }, { status: 400 });
    }

    // หา sortOrder ถัดไปด้วย raw SQL
    const lastAddonResult = await prisma.$queryRaw<Array<{ sortOrder: number }>>`
      SELECT "sortOrder" 
      FROM "Addon" 
      WHERE "menuItemId" = ${menuItemId}
      ORDER BY "sortOrder" DESC 
      LIMIT 1
    `;
    
    const nextSortOrder = (lastAddonResult[0]?.sortOrder || 0) + 1;
    const addonId = `caddon_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // สร้าง addon ด้วย raw SQL
    await prisma.$executeRaw`
      INSERT INTO "Addon" (
        id, name, price, "isAvailable", "sortOrder", "menuItemId", 
        "createdAt", "updatedAt"
      ) VALUES (
        ${addonId}, ${name.trim()}, ${parseFloat(price)}, 
        ${Boolean(isAvailable)}, ${nextSortOrder}, ${menuItemId}, 
        NOW(), NOW()
      )
    `;

    // ดึงข้อมูล addon ที่สร้างแล้ว
    const createdAddon = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      price: number;
      isAvailable: boolean;
      sortOrder: number;
      menuItemId: string;
      createdAt: Date;
      updatedAt: Date;
    }>>`
      SELECT id, name, price, "isAvailable", "sortOrder", "menuItemId", "createdAt", "updatedAt"
      FROM "Addon" 
      WHERE id = ${addonId}
    `;

    return NextResponse.json(createdAddon[0], { status: 201 });
  } catch (error) {
    console.error('Error creating addon:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - ลบ addon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ menuItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const menuItemId = resolvedParams.menuItemId;
    const url = new URL(request.url);
    const addonId = url.searchParams.get('addonId');

    if (!addonId) {
      return NextResponse.json({ message: 'Addon ID is required' }, { status: 400 });
    }

    // ตรวจสอบว่า addon นี้เป็นของ restaurant owner คนนี้
    const addon = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT a.id 
      FROM "Addon" a
      JOIN "MenuItem" m ON a."menuItemId" = m.id
      JOIN "Restaurant" r ON m."restaurantId" = r.id
      WHERE a.id = ${addonId} 
        AND a."menuItemId" = ${menuItemId}
        AND r."ownerId" = ${session.user.id}
    `;

    if (addon.length === 0) {
      return NextResponse.json({ message: 'Addon not found' }, { status: 404 });
    }

    // ลบ addon
    await prisma.$executeRaw`
      DELETE FROM "Addon" 
      WHERE id = ${addonId} AND "menuItemId" = ${menuItemId}
    `;

    return NextResponse.json({ message: 'Addon deleted successfully' });
  } catch (error) {
    console.error('Error deleting addon:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 