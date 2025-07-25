import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { deleteImageFromFileSystem } from '@/lib/deleteImage';

// PUT - แก้ไข menu item
export async function PUT(
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
    const {
      name,
      description,
      price,
      originalPrice,
      imageUrl,
      isAvailable,
      calories,
      tags = [],
      categoryId,
      addons = []
    } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ message: 'Menu item name is required' }, { status: 400 });
    }

    if (!price || price <= 0) {
      return NextResponse.json({ message: 'Valid price is required' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 });
    }

    // ตรวจสอบว่า category มีอยู่และเป็นของ restaurant นี้
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        restaurant: {
          ownerId: session.user.id
        }
      }
    });

    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // ลบรูปเก่าถ้ามีรูปใหม่และรูปเก่าไม่เหมือนรูปใหม่
    if (imageUrl && menuItem.imageUrl && menuItem.imageUrl !== imageUrl) {
      try {
        await deleteImageFromFileSystem(menuItem.imageUrl);
        console.log(`🗑️ Deleted old menu item image: ${menuItem.imageUrl}`);
      } catch (deleteError) {
        console.warn('⚠️ Could not delete old menu item image:', deleteError);
        // ไม่หยุดการอัปเดตถ้าลบรูปเก่าไม่ได้
      }
    }

    // อัปเดต menu item ด้วย raw SQL เพื่อรองรับ originalPrice และ tags
    await prisma.$executeRaw`
      UPDATE "MenuItem" SET
        name = ${name.trim()},
        description = ${description?.trim() || null},
        price = ${Number(price)},
        "originalPrice" = ${originalPrice ? Number(originalPrice) : null},
        "imageUrl" = ${imageUrl || null},
        "isAvailable" = ${isAvailable ?? menuItem.isAvailable},
        calories = ${calories > 0 ? Number(calories) : null},
        tags = ${tags}::text[],
        "categoryId" = ${categoryId},
        "updatedAt" = NOW()
      WHERE id = ${menuItemId}
    `;

    // ลบ addons เดิมทั้งหมด
    await prisma.$executeRaw`
      DELETE FROM "Addon" WHERE "menuItemId" = ${menuItemId}
    `;

    // สร้าง addons ใหม่
    if (addons && addons.length > 0) {
      console.log('Updating addons:', addons);
      
      for (let i = 0; i < addons.length; i++) {
        const addon = addons[i];
        const addonId = `caddon_${Date.now()}_${i}_${Math.random().toString(36).substring(2)}`;
        
        try {
          await prisma.$executeRaw`
            INSERT INTO "Addon" (
              id, name, price, "isAvailable", "sortOrder", "menuItemId", 
              "createdAt", "updatedAt"
            ) VALUES (
              ${addonId}, ${addon.name.trim()}, ${parseFloat(addon.price)}, 
              ${Boolean(addon.isAvailable)}, ${i}, ${menuItemId}, 
              NOW(), NOW()
            )
          `;
          console.log(`✅ Updated addon: ${addon.name} - ฿${addon.price}`);
        } catch (addonError) {
          console.error(`❌ Failed to update addon: ${addon.name}`, addonError);
        }
      }
    }

    // ดึงข้อมูลเมนูที่อัปเดตแล้วพร้อม category ด้วย raw query
    const updatedMenuItemResult = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      originalPrice: number | null;
      imageUrl: string | null;
      isAvailable: boolean;
      calories: number | null;
      tags: string[];
      sortOrder: number;
      categoryId: string;
      createdAt: Date;
      updatedAt: Date;
      categoryName: string;
    }>>`
      SELECT 
        m.id, m.name, m.description, m.price, m."originalPrice", m."imageUrl",
        m."isAvailable", m.calories, m.tags, m."sortOrder", m."categoryId",
        m."createdAt", m."updatedAt",
        c.name as "categoryName"
      FROM "MenuItem" m
      JOIN "Category" c ON m."categoryId" = c.id
      WHERE m.id = ${menuItemId}
    `;

    const updatedMenuItem = updatedMenuItemResult[0];

    return NextResponse.json({
      ...updatedMenuItem,
      category: {
        id: updatedMenuItem.categoryId,
        name: updatedMenuItem.categoryName
      }
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - ลบ menu item
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

    // นับจำนวน addons ก่อนลบ (ใช้ raw query เนื่องจาก Prisma client ยังไม่อัปเดต)
    const addonCountResult = await prisma.$queryRaw<[{count: BigInt}]>`
      SELECT COUNT(*) as count FROM "Addon" WHERE "menuItemId" = ${menuItemId}
    `;
    const addonCount = Number(addonCountResult[0].count);

    // เก็บ imageUrl ก่อนลบ
    const menuItemImageUrl = menuItem.imageUrl;

    // ลบ menu item และ addons จาก database (cascade delete)
    await prisma.menuItem.delete({
      where: {
        id: menuItemId
      }
    });

    // ลบรูปภาพ menu item จาก filesystem (ถ้ามี)
    if (menuItemImageUrl) {
      await deleteImageFromFileSystem(menuItemImageUrl);
      console.log(`🗑️ Deleted menu item image: ${menuItemImageUrl}`);
    }

    return NextResponse.json({ 
      message: 'Menu item deleted successfully',
      deletedImages: menuItemImageUrl ? 1 : 0,
      deletedAddons: addonCount
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ menuItemId: string }> }
) {
  try {
    const { menuItemId } = await params;

    // ดึงข้อมูล menu item ด้วย raw query เพื่อรองรับ tags field
    const menuItemResult = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      originalPrice: number | null;
      imageUrl: string | null;
      isAvailable: boolean;
      calories: number | null;
      tags: string[];
      sortOrder: number;
      categoryId: string;
      createdAt: Date;
      updatedAt: Date;
      categoryName: string;
      categoryIsActive: boolean;
      restaurantId: string;
      restaurantName: string;
      restaurantStatus: string;
    }>>`
      SELECT 
        m.id, m.name, m.description, m.price, m."originalPrice", m."imageUrl",
        m."isAvailable", m.calories, m.tags, m."sortOrder", m."categoryId",
        m."createdAt", m."updatedAt",
        c.name as "categoryName", c."isActive" as "categoryIsActive",
        r.id as "restaurantId", r.name as "restaurantName", r.status as "restaurantStatus"
      FROM "MenuItem" m
      JOIN "Category" c ON m."categoryId" = c.id
      JOIN "Restaurant" r ON c."restaurantId" = r.id
      WHERE m.id = ${menuItemId}
    `;

    if (menuItemResult.length === 0) {
      return NextResponse.json(
        { message: 'ไม่พบเมนูนี้' },
        { status: 404 }
      );
    }

    const menuItem = menuItemResult[0];

    // ตรวจสอบว่าร้านอาหารได้รับการอนุมัติแล้ว
    if (menuItem.restaurantStatus !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'ร้านอาหารนี้ยังไม่พร้อมให้บริการ' },
        { status: 403 }
      );
    }

    // ตรวจสอบว่า category ยังใช้งานอยู่
    if (!menuItem.categoryIsActive) {
      return NextResponse.json(
        { message: 'หมวดหมู่นี้ไม่พร้อมให้บริการ' },
        { status: 403 }
      );
    }

    // ดึงข้อมูล addons
    const addons = await prisma.addon.findMany({
      where: {
        menuItemId: menuItemId,
        isAvailable: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        price: true,
        isAvailable: true,
        sortOrder: true,
      },
    });

    // จัดรูปแบบข้อมูลให้ตรงกับที่ front-end ต้องการ
    const formattedMenuItem = {
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      originalPrice: menuItem.originalPrice,
      imageUrl: menuItem.imageUrl,
      isAvailable: menuItem.isAvailable,
      calories: menuItem.calories,
      tags: menuItem.tags || [],
      sortOrder: menuItem.sortOrder,
      category: {
        id: menuItem.categoryId,
        name: menuItem.categoryName,
      },
      restaurant: {
        id: menuItem.restaurantId,
        name: menuItem.restaurantName,
      },
      addons: addons.map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        isAvailable: addon.isAvailable,
        sortOrder: addon.sortOrder,
      })),
      createdAt: menuItem.createdAt,
      updatedAt: menuItem.updatedAt,
    };

    return NextResponse.json(formattedMenuItem);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเมนู' },
      { status: 500 }
    );
  }
} 