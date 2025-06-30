import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { deleteImageFromFileSystem } from '@/lib/deleteImage'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
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

    const resolvedParams = await params
    const { galleryId } = resolvedParams

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      select: {
        id: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    const data = await request.json()
    const { title, description, imageUrl, isActive, sortOrder } = data

    const gallery = await (prisma as any).gallery.update({
      where: {
        id: galleryId,
        restaurantId: restaurant.id
      },
      data: {
        title: title?.trim() || null,
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim(),
        isActive,
        sortOrder
      }
    })

    return NextResponse.json(gallery)

  } catch (error) {
    console.error('Error updating gallery:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัปเดตแกลเลอรี่' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
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

    const resolvedParams = await params
    const { galleryId } = resolvedParams

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      select: {
        id: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลร้านอาหาร' },
        { status: 404 }
      )
    }

    // ดึงข้อมูลแกลเลอรี่เพื่อลบรูปภาพ
    const gallery = await (prisma as any).gallery.findUnique({
      where: {
        id: galleryId,
        restaurantId: restaurant.id
      }
    })

    if (!gallery) {
      return NextResponse.json(
        { message: 'ไม่พบแกลเลอรี่ที่ต้องการลบ' },
        { status: 404 }
      )
    }

    // ลบรูปภาพจาก file system
    if (gallery.imageUrl) {
      try {
        await deleteImageFromFileSystem(gallery.imageUrl)
        console.log(`🗑️ Deleted gallery image: ${gallery.imageUrl}`)
      } catch (deleteError) {
        console.warn('⚠️ Could not delete gallery image:', deleteError)
        // ไม่หยุดการลบถ้าลบรูปไม่ได้
      }
    }

    // ลบแกลเลอรี่จากฐานข้อมูล
    await (prisma as any).gallery.delete({
      where: {
        id: galleryId,
        restaurantId: restaurant.id
      }
    })

    return NextResponse.json({ message: 'ลบแกลเลอรี่สำเร็จ' })

  } catch (error) {
    console.error('Error deleting gallery:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการลบแกลเลอรี่' },
      { status: 500 }
    )
  }
} 