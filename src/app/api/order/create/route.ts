import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // สร้าง order number แบบ unique
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // สร้าง order ใหม่
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        customerName: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim() || 'ลูกค้า',
        customerPhone: customerInfo?.phone || '',
        customerEmail: customerInfo?.email || '',
        deliveryAddress: deliveryAddress?.address || '',
        deliveryNotes: '',
        subtotal,
        deliveryFee,
        tax: 0,
        total,
        paymentMethod,
        isPaid: paymentMethod === 'cash' ? false : false, // ยังไม่ชำระจนกว่าจะยืนยัน
        restaurantId,
        items: {
          create: items.map((item: any) => ({
            quantity: item.quantity,
            price: item.price,
            notes: '',
            menuItemId: item.itemId,
            addons: item.addOns?.length > 0 ? {
              create: item.addOns.map((addon: any) => ({
                quantity: item.quantity, // addon quantity = item quantity
                price: addon.price,
                addonId: addon.id
              }))
            } : undefined
          }))
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