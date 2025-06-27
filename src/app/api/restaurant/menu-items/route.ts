import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ดึงร้านของ owner
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    const url = new URL(request.url)
    const categoryId = url.searchParams.get('categoryId')

    // ดึง menu items
    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        ...(categoryId && { categoryId })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // ดึง addons สำหรับแต่ละ menu item ด้วย raw SQL
    const menuItemsWithAddons = await Promise.all(
      menuItems.map(async (item) => {
        try {
          const addons = await prisma.$queryRaw<Array<{
            id: string;
            name: string;
            price: number;
            isAvailable: boolean;
            sortOrder: number;
          }>>`
            SELECT id, name, price, "isAvailable", "sortOrder"
            FROM "Addon" 
            WHERE "menuItemId" = ${item.id}
            ORDER BY "sortOrder" ASC
          `;
          
          return {
            ...item,
            addons: addons || []
          };
        } catch (error) {
          console.error(`Error fetching addons for menu item ${item.id}:`, error);
          return {
            ...item,
            addons: []
          };
        }
      })
    )

    return NextResponse.json(menuItemsWithAddons)

  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ดึงร้านของ owner
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const { 
      name, 
      description, 
      price,
      originalPrice,
      categoryId, 
      imageUrl,
      calories,
      isAvailable = true,
      addons = []
    } = data

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { message: 'Menu item name is required' },
        { status: 400 }
      )
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { message: 'Valid price is required' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { message: 'Category is required' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าหมวดหมู่อยู่ในร้านนี้หรือไม่
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        restaurantId: restaurant.id
      }
    })

    if (!category) {
      return NextResponse.json(
        { message: 'ไม่พบหมวดหมู่ที่เลือก' },
        { status: 400 }
      )
    }

    // หา sortOrder ถัดไป
    const lastMenuItem = await prisma.menuItem.findFirst({
      where: {
        categoryId: categoryId
      },
      orderBy: {
        sortOrder: 'desc'
      }
    })

    const sortOrder = (lastMenuItem?.sortOrder || 0) + 1

    // สร้างเมนูใหม่ด้วย raw SQL เพื่อรองรับ originalPrice
    const menuItemId = `cmenu_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    await prisma.$executeRaw`
      INSERT INTO "MenuItem" (
        id, name, description, price, "originalPrice", "imageUrl", 
        calories, "isAvailable", "sortOrder", "restaurantId", "categoryId", 
        "createdAt", "updatedAt"
      ) VALUES (
        ${menuItemId}, ${name.trim()}, ${description?.trim()}, ${parseFloat(price)}, 
        ${originalPrice ? parseFloat(originalPrice) : null}, ${imageUrl}, 
        ${calories > 0 ? parseInt(calories) : null}, ${Boolean(isAvailable)}, 
        ${sortOrder}, ${restaurant.id}, ${categoryId}, 
        NOW(), NOW()
      )
    `;

    // ดึงข้อมูลเมนูที่สร้างแล้วพร้อม category
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // สร้าง addons (ถ้ามี)
    if (addons && addons.length > 0) {
      console.log('Creating addons:', addons);
      
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
          console.log(`✅ Created addon: ${addon.name} - ฿${addon.price}`);
        } catch (addonError) {
          console.error(`❌ Failed to create addon: ${addon.name}`, addonError);
        }
      }
    }

    return NextResponse.json(menuItem, { status: 201 })

  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการสร้างเมนู' },
      { status: 500 }
    )
  }
} 