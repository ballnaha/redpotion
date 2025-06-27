import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { deleteImageFromFileSystem, deleteMultipleImages } from '@/lib/deleteImage';

// PUT - แก้ไข category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const categoryId = resolvedParams.categoryId;

    // ตรวจสอบว่า category นี้เป็นของ restaurant owner คนนี้
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

    const body = await request.json();
    const { name, description, imageUrl, isActive } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    // ตรวจสอบชื่อหมวดหมู่ซ้ำ (ยกเว้นตัวเอง)
    const existingCategory = await prisma.category.findFirst({
      where: {
        restaurantId: category.restaurantId,
        name: name.trim(),
        id: {
          not: categoryId
        }
      }
    });

    if (existingCategory) {
      return NextResponse.json({ message: 'Category name already exists' }, { status: 400 });
    }

    // ลบรูปเก่าถ้ามีรูปใหม่และรูปเก่าไม่เหมือนรูปใหม่
    if (imageUrl && category.imageUrl && category.imageUrl !== imageUrl) {
      try {
        await deleteImageFromFileSystem(category.imageUrl);
        console.log(`🗑️ Deleted old category image: ${category.imageUrl}`);
      } catch (deleteError) {
        console.warn('⚠️ Could not delete old category image:', deleteError);
        // ไม่หยุดการอัปเดตถ้าลบรูปเก่าไม่ได้
      }
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id: categoryId
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl || null,
        isActive: isActive ?? category.isActive
      },
      include: {
        _count: {
          select: {
            menuItems: true
          }
        }
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - ลบ category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const categoryId = resolvedParams.categoryId;

    // ตรวจสอบว่า category นี้เป็นของ restaurant owner คนนี้
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

    // ดึงข้อมูล menu items ด้วย raw query
    let menuItems: Array<{id: string, imageUrl: string | null}> = [];
    let totalMenuItems = 0;
    
    try {
      menuItems = await prisma.$queryRaw<Array<{id: string, imageUrl: string | null}>>`
        SELECT id, "imageUrl" FROM "MenuItem" WHERE "categoryId" = ${categoryId}
      `;
      totalMenuItems = menuItems.length;
      console.log(`🗑️ Found ${totalMenuItems} menu items to delete with category`);
    } catch (queryError) {
      console.warn('Could not query menu items, proceeding with category delete only:', queryError);
    }

    // เก็บ imageUrl ก่อนลบ
    const categoryImageUrl = category.imageUrl;
    const menuItemImages = menuItems.map(item => item.imageUrl).filter(Boolean);

    console.log(`🗑️ Preparing to delete category "${category.name}" with ${totalMenuItems} menu items...`);

    // ลบ category จาก database (cascade จะลบ menu items ด้วย)
    await prisma.category.delete({
      where: {
        id: categoryId
      }
    });

    console.log(`✅ Category deleted from database successfully`);

    // ลบรูปภาพ category และ menu items จาก filesystem
    const imagesToDelete = [categoryImageUrl, ...menuItemImages];
    
    try {
      await deleteMultipleImages(imagesToDelete);
      console.log(`✅ Deleted ${imagesToDelete.filter(Boolean).length} image files`);
    } catch (imageError) {
      console.warn('Some images could not be deleted:', imageError);
    }

    const deletedImageCount = imagesToDelete.filter(Boolean).length;
    
    console.log(`✅ Deleted category with ${totalMenuItems} menu items and ${deletedImageCount} images`);

    return NextResponse.json({ 
      message: 'Category and all menu items deleted successfully',
      deletedMenuItems: totalMenuItems,
      deletedImages: deletedImageCount
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 