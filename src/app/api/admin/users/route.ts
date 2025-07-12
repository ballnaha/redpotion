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
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (role && role !== 'ALL') {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          profile: {
            select: {
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          _count: {
            select: {
              accounts: true,
              sessions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Get summary statistics
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        password: undefined // ไม่ส่ง password ออกไป
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: stats.reduce((acc: any, curr) => {
        acc[curr.role] = curr._count.id
        return acc
      }, {})
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
        { status: 403 }
      )
    }

    const { userId, action, data } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { message: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'UPDATE_ROLE':
        if (!data.role || !['CUSTOMER', 'RESTAURANT_OWNER', 'ADMIN'].includes(data.role)) {
          return NextResponse.json(
            { message: 'Role ไม่ถูกต้อง' },
            { status: 400 }
          )
        }

        result = await prisma.user.update({
          where: { id: userId },
          data: { role: data.role }
        })
        break

      case 'SUSPEND_USER':
        // TODO: Add user suspension logic
        return NextResponse.json(
          { message: 'ฟีเจอร์นี้จะพัฒนาต่อไป' },
          { status: 501 }
        )

      default:
        return NextResponse.json(
          { message: 'Action ไม่ถูกต้อง' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: 'อัปเดตข้อมูลสำเร็จ',
      user: {
        ...result,
        password: undefined
      }
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' },
      { status: 500 }
    )
  }
} 