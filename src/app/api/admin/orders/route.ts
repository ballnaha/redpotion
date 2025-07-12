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
    const restaurantId = searchParams.get('restaurantId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }

    if (restaurantId && restaurantId !== 'ALL') {
      where.restaurantId = restaurantId
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { restaurant: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              imageUrl: true
            }
          },
          items: {
            include: {
              menuItem: {
                select: {
                  name: true,
                  price: true,
                  imageUrl: true
                }
              },
              addons: {
                include: {
                  addon: {
                    select: {
                      name: true,
                      price: true
                    }
                  }
                }
              }
            }
          },
          paymentSlips: {
            select: {
              id: true,
              status: true,
              transferAmount: true,
              submittedAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    // Get summary statistics
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      _sum: {
        total: true
      }
    })

    // Get daily revenue for current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const monthlyRevenue = await prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
        isPaid: true,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: {
        byStatus: stats.reduce((acc: any, curr) => {
          acc[curr.status] = {
            count: curr._count.id,
            revenue: curr._sum.total || 0
          }
          return acc
        }, {}),
        monthly: {
          revenue: monthlyRevenue._sum.total || 0,
          orders: monthlyRevenue._count.id || 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
} 