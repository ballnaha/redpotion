import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    const pendingRestaurants = await prisma.restaurant.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add empty documents array temporarily until TypeScript refreshes
    const restaurantsWithDocuments = pendingRestaurants.map(restaurant => ({
      ...restaurant,
      documents: [] // TODO: Will add real documents when TypeScript client updates
    }))

    return NextResponse.json(restaurantsWithDocuments)

  } catch (error) {
    console.error('Error fetching pending restaurants:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
} 