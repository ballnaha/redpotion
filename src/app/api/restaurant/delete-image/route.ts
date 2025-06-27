import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' }, { status: 403 });
    }

    // Get request body
    const { imageUrl, category, updateDatabase = true } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ message: 'ไม่พบ URL รูปภาพ' }, { status: 400 });
    }

    // Get restaurant data
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id
      }
    });

    if (!restaurant) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลร้าน' }, { status: 404 });
    }

    // Extract file path from URL (remove /uploads/ prefix)
    const relativePath = imageUrl.replace('/uploads/', '');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);

    // Delete file from filesystem
    try {
      await unlink(fullPath);
      console.log('✅ File deleted successfully:', fullPath);
    } catch (fileError) {
      console.warn('⚠️ File not found or already deleted:', fullPath);
      // Continue even if file doesn't exist
    }

    // Update database only if requested
    let updatedRestaurant = null;
    
    if (updateDatabase) {
      let updateData: any = {};
      
      if (category === 'banner' || imageUrl.includes('/banner/')) {
        updateData.imageUrl = null;
      }
      // Add more categories as needed in the future
      
      updatedRestaurant = await prisma.restaurant.update({
        where: {
          ownerId: session.user.id
        },
        data: updateData,
        include: {
          _count: {
            select: {
              categories: true,
              menuItems: true,
              orders: true
            }
          }
        }
      });

      console.log('✅ Database updated successfully:', {
        restaurantId: restaurant.id,
        deletedImageUrl: imageUrl,
        category: category
      });
    } else {
      console.log('✅ File deleted, database update skipped');
    }

    return NextResponse.json({
      success: true,
      message: 'ลบรูปภาพสำเร็จ',
      restaurant: updatedRestaurant
    });

  } catch (error) {
    console.error('❌ Delete image error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการลบรูปภาพ' },
      { status: 500 }
    );
  }
} 