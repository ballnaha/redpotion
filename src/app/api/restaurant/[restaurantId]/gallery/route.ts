import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params;
    
    console.log('🔍 Gallery API called for restaurant:', restaurantId);

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // ไม่ใช้ mock data แล้ว - แสดงเฉพาะข้อมูลจริงจากฐานข้อมูลเท่านั้น

    try {
      // ลองดึงข้อมูลจากฐานข้อมูล
      console.log('🗄️ Attempting to fetch from database...');
      
      const restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantId }
      });

      if (restaurant) {
        console.log('✅ Restaurant found:', restaurant.name);
        
        const galleryItems = await prisma.gallery.findMany({
          where: {
            restaurantId: restaurantId,
            isActive: true
          },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            isActive: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'desc' }
          ]
        });

        console.log('📸 Gallery items from DB:', galleryItems.length);
        
        if (galleryItems.length > 0) {
          console.log('✅ Returning database gallery data');
          return NextResponse.json(galleryItems);
        }
      }
    } catch (dbError) {
      console.error('🚨 Database error:', dbError);
    }

    // ไม่มีข้อมูล gallery - ส่งกลับ array ว่าง
    console.log('📷 No gallery data found, returning empty array');
    return NextResponse.json([]);

  } catch (error) {
    console.error('💥 Error in gallery API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 