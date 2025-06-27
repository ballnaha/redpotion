import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { deleteImageFromFileSystem } from '@/lib/deleteImage'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      include: {
        documents: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
            documentType: true,
            description: true
          }
        },
        _count: {
          select: {
            categories: true,
            menuItems: true,
            orders: true
          }
        }
      } as any
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant)

  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้าน' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const {
      name,
      description,
      address,
      phone,
      email,
      imageUrl,
      latitude,
      longitude,
      locationName,
      businessType,
      taxId,
      bankAccount,
      bankName,
      openTime,
      closeTime,
      isOpen,
      minOrderAmount,
      deliveryFee,
      deliveryRadius
    } = data

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { message: 'กรุณาระบุชื่อร้าน' },
        { status: 400 }
      )
    }

    if (!address?.trim()) {
      return NextResponse.json(
        { message: 'กรุณาระบุที่อยู่ร้าน' },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { message: 'กรุณาระบุเบอร์โทรศัพท์' },
        { status: 400 }
      )
    }

    // ดึงข้อมูลร้านเดิมเพื่อเช็ครูปภาพเก่า
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      select: {
        imageUrl: true
      }
    })

    if (!existingRestaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้าน' },
        { status: 404 }
      )
    }

    // ลบรูปเก่าถ้ามีรูปใหม่และรูปเก่าไม่เหมือนรูปใหม่
    if (imageUrl && existingRestaurant.imageUrl && existingRestaurant.imageUrl !== imageUrl) {
      try {
        await deleteImageFromFileSystem(existingRestaurant.imageUrl)
        console.log(`🗑️ Deleted old restaurant image: ${existingRestaurant.imageUrl}`)
      } catch (deleteError) {
        console.warn('⚠️ Could not delete old restaurant image:', deleteError)
        // ไม่หยุดการอัปเดตถ้าลบรูปเก่าไม่ได้
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: {
        ownerId: session.user.id
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        latitude: latitude !== undefined ? latitude : null,
        longitude: longitude !== undefined ? longitude : null,
        locationName: locationName?.trim() || null,
        businessType: businessType?.trim() || null,
        taxId: taxId?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        bankName: bankName?.trim() || null,
        openTime: openTime || null,
        closeTime: closeTime || null,
        isOpen: isOpen !== undefined ? isOpen : true,
        minOrderAmount: minOrderAmount !== undefined ? minOrderAmount : null,
        deliveryFee: deliveryFee !== undefined ? deliveryFee : null,
        deliveryRadius: deliveryRadius !== undefined ? deliveryRadius : null
      } as any,
      include: {
        _count: {
          select: {
            categories: true,
            menuItems: true,
            orders: true
          }
        }
      }
    })

    return NextResponse.json(restaurant)

  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลร้าน' },
      { status: 500 }
    )
  }
} 