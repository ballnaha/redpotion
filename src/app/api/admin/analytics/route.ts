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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Overview Statistics
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalRevenue,
      monthlyOrders,
      monthlyRevenue,
      lastMonthOrders,
      lastMonthRevenue,
      yearlyRevenue
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total restaurants
      prisma.restaurant.count(),
      
      // Total orders
      prisma.order.count(),
      
      // Total revenue (delivered and paid orders)
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          isPaid: true
        },
        _sum: { total: true }
      }),
      
      // Current month orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Current month revenue
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          isPaid: true,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: { total: true }
      }),
      
      // Last month orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Last month revenue
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          isPaid: true,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        },
        _sum: { total: true }
      }),
      
      // Yearly revenue
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          isPaid: true,
          createdAt: {
            gte: startOfYear
          }
        },
        _sum: { total: true }
      })
    ])

    // User distribution by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    })

    // Restaurant distribution by status
    const restaurantsByStatus = await prisma.restaurant.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    // Order distribution by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { total: true }
    })

    // Top restaurants by revenue (this month)
    const topRestaurants = await prisma.restaurant.findMany({
      include: {
        orders: {
          where: {
            status: 'DELIVERED',
            isPaid: true,
            createdAt: {
              gte: startOfMonth
            }
          },
          select: {
            total: true
          }
        },
        _count: {
          select: {
            orders: {
              where: {
                createdAt: {
                  gte: startOfMonth
                }
              }
            }
          }
        }
      },
      take: 10
    })

    // Calculate restaurant revenue
    const topRestaurantsWithRevenue = topRestaurants
      .map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        imageUrl: restaurant.imageUrl,
        status: restaurant.status,
        revenue: restaurant.orders.reduce((sum, order) => sum + order.total, 0),
        orderCount: restaurant._count.orders
      }))
      .filter(restaurant => restaurant.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Daily revenue for current month (for chart)
    const dailyRevenue = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        status: 'DELIVERED',
        isPaid: true,
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: { total: true },
      _count: { id: true }
    })

    // Group by day
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
    dailyRevenue.forEach(item => {
      const day = item.createdAt.toISOString().split('T')[0]
      if (!revenueByDay[day]) {
        revenueByDay[day] = { revenue: 0, orders: 0 }
      }
      revenueByDay[day].revenue += item._sum.total || 0
      revenueByDay[day].orders += item._count.id
    })

    // Recent activities (latest orders)
    const recentOrders = await prisma.order.findMany({
      include: {
        restaurant: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Calculate growth percentages
    const orderGrowth = lastMonthOrders > 0 
      ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : 0

    const revenueGrowth = (lastMonthRevenue._sum.total || 0) > 0 
      ? ((monthlyRevenue._sum.total || 0) - (lastMonthRevenue._sum.total || 0)) / (lastMonthRevenue._sum.total || 1) * 100 
      : 0

    return NextResponse.json({
      overview: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        monthlyOrders,
        monthlyRevenue: monthlyRevenue._sum.total || 0,
        yearlyRevenue: yearlyRevenue._sum.total || 0,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      },
      distributions: {
        usersByRole: usersByRole.reduce((acc: any, curr) => {
          acc[curr.role] = curr._count.id
          return acc
        }, {}),
        restaurantsByStatus: restaurantsByStatus.reduce((acc: any, curr) => {
          acc[curr.status] = curr._count.id
          return acc
        }, {}),
        ordersByStatus: ordersByStatus.reduce((acc: any, curr) => {
          acc[curr.status] = {
            count: curr._count.id,
            revenue: curr._sum.total || 0
          }
          return acc
        }, {})
      },
      topRestaurants: topRestaurantsWithRevenue,
      revenueChart: Object.entries(revenueByDay).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.date.localeCompare(b.date)),
      recentActivities: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        restaurantName: order.restaurant.name,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
} 