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

    // อัปเดต menu item ด้วย raw SQL เพื่อรองรับ originalPrice
    await prisma.$executeRaw`
      UPDATE "MenuItem" SET
        name = ${name.trim()},
        description = ${description?.trim() || null},
        price = ${Number(price)},
        "originalPrice" = ${originalPrice ? Number(originalPrice) : null},
        "imageUrl" = ${imageUrl || null},
        "isAvailable" = ${isAvailable ?? menuItem.isAvailable},
        calories = ${calories > 0 ? Number(calories) : null},
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

    // ดึงข้อมูลเมนูที่อัปเดตแล้วพร้อม category
    const updatedMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: true
      }
    });

    return NextResponse.json(updatedMenuItem);
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