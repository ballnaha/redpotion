import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

interface LineSessionData {
  userId: string;
  lineUserId: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  restaurantId?: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restaurantId,
      items,
      customerInfo,
      deliveryAddress,
      paymentMethod,
      subtotal,
      deliveryFee,
      total,
      discount = 0,
      promoCode
    } = body;

    console.log('🛒 Order Create Request:', {
      restaurantId,
      itemsCount: items?.length || 0,
      paymentMethod,
      total,
      discount,
      promoCode
    });

    console.log('📦 Items Data:', items?.map((item: any, index: number) => ({
      index,
      itemId: item.itemId,
      name: item.name || 'N/A',
      quantity: item.quantity,
      price: item.price,
      addOnsCount: item.addOns?.length || 0
    })));

    // ตรวจสอบว่า items มีข้อมูลครบถ้วน
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีรายการสินค้าในคำสั่งซื้อ' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า menuItemId ทั้งหมดมีอยู่จริง และ extract real menuItem ID
    const menuItemIds = items.map((item: any) => {
      if (!item.itemId) return null;
      
      // Extract real menuItem ID from unique ID (remove addons part)
      // Format: "realId" or "realId-addons-addon1-addon2"
      const realMenuItemId = item.itemId.split('-addons-')[0];
      return realMenuItemId;
    }).filter(Boolean);
    
    if (menuItemIds.length !== items.length) {
      console.error('❌ Missing itemId in some items:', items);
      return NextResponse.json(
        { success: false, error: 'ข้อมูลสินค้าไม่ครบถ้วน (ไม่มี itemId)' },
        { status: 400 }
      );
    }

    const existingMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurantId // ตรวจสอบว่าเป็นของร้านค้าเดียวกัน
      },
      select: { id: true, name: true, price: true }
    });

    if (existingMenuItems.length !== menuItemIds.length) {
      const missingIds = menuItemIds.filter(id => !existingMenuItems.find(item => item.id === id));
      console.error('❌ Menu items not found:', missingIds);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ไม่พบสินค้าบางรายการ',
          details: `Menu item IDs not found: ${missingIds.join(', ')}`
        },
        { status: 400 }
      );
    }

    // ตรวจสอบ addons ถ้ามี
    const allAddonIds = items
      .flatMap((item: any) => item.addOns || [])
      .map((addon: any) => addon.id)
      .filter(Boolean);

    if (allAddonIds.length > 0) {
      const existingAddons = await prisma.addon.findMany({
        where: { id: { in: allAddonIds } },
        select: { id: true, name: true, price: true }
      });

      if (existingAddons.length !== allAddonIds.length) {
        const missingAddonIds = allAddonIds.filter((id: string) => !existingAddons.find((addon: any) => addon.id === id));
        console.error('❌ Addons not found:', missingAddonIds);
        return NextResponse.json(
          { 
            success: false, 
            error: 'ไม่พบรายการเสริมบางรายการ',
            details: `Addon IDs not found: ${missingAddonIds.join(', ')}`
          },
          { status: 400 }
        );
      }
    }

    // สร้าง order number แบบ unique
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // ดึง lineUserId จาก session (แบบมืออาชีพ)
    let currentLineUserId = '';
    const sessionToken = request.cookies.get('line-session-token')?.value;
    
    if (sessionToken) {
      try {
        const jwtSecret = process.env.NEXTAUTH_SECRET;
        if (jwtSecret) {
          const currentUser = jwt.verify(sessionToken, jwtSecret) as LineSessionData;
          currentLineUserId = currentUser.lineUserId;
          console.log('✅ Using lineUserId from session:', currentLineUserId);
        }
      } catch (jwtError) {
        console.error('❌ JWT verification failed, using lineUserId from customerInfo');
      }
    }
    
    // Fallback ใช้ lineUserId จาก customerInfo ถ้าไม่มีใน session
    if (!currentLineUserId) {
      currentLineUserId = customerInfo?.lineUserId || '';
      console.log('⚠️ Using lineUserId from customerInfo (fallback):', currentLineUserId);
    }

    console.log('✅ Creating order with validated data:', {
      restaurantId,
      menuItemIds: existingMenuItems.map(item => ({ id: item.id, name: item.name })),
      addonIds: allAddonIds,
      lineUserId: currentLineUserId
    });

    // สร้าง order ใหม่
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        customerName: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim() || 'ลูกค้า',
        customerPhone: customerInfo?.phone || '',
        customerEmail: customerInfo?.email || '',
        lineUserId: currentLineUserId,  // ใช้ lineUserId จาก session เป็นหลัก
        deliveryAddress: deliveryAddress?.address || '',
        deliveryNotes: '',
        subtotal,
        deliveryFee,
        tax: 0,
        discount: discount || 0,  // บันทึกจำนวนเงินส่วนลด
        promoCode: promoCode || null,  // บันทึกโค้ดส่วนลด
        total,
        paymentMethod,
        isPaid: paymentMethod === 'cash' ? false : false, // ยังไม่ชำระจนกว่าจะยืนยัน
        restaurantId,
        items: {
          create: items.map((item: any) => {
            // Extract real menuItem ID from unique ID
            const realMenuItemId = item.itemId.split('-addons-')[0];
            
            return {
              quantity: item.quantity,
              price: item.price,
              notes: '',
              menuItemId: realMenuItemId, // ใช้ real menuItem ID
              addons: item.addOns?.length > 0 ? {
                create: item.addOns.map((addon: any) => ({
                  quantity: item.quantity, // addon quantity = item quantity
                  price: addon.price,
                  addonId: addon.id
                }))
              } : undefined
            };
          })
        }
      },
      include: {
        restaurant: true,
        items: {
          include: {
            menuItem: true,
            addons: {
              include: {
                addon: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      order,
      message: 'สั่งซื้อเรียบร้อย! รอการยืนยันจากร้านค้า'
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการสั่งซื้อ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 