import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get restaurants with pagination
    const [restaurants, totalCount] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          documents: {
            select: {
              id: true,
              fileUrl: true,
              fileName: true,
              mimeType: true,
              documentType: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              menuItems: true,
              orders: true,
              categories: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.restaurant.count({ where })
    ])

    // Get summary statistics
    const stats = await prisma.restaurant.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      restaurants,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: stats.reduce((acc: any, curr) => {
        acc[curr.status] = curr._count.id
        return acc
      }, {})
    })

  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
} 