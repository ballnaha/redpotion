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
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { order: { customerName: { contains: search, mode: 'insensitive' } } },
        { order: { customerPhone: { contains: search, mode: 'insensitive' } } },
        { order: { restaurant: { name: { contains: search, mode: 'insensitive' } } } },
        { accountName: { contains: search, mode: 'insensitive' } },
        { transferReference: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get payment slips with pagination
    const [paymentSlips, totalCount] = await Promise.all([
      prisma.paymentSlip.findMany({
        where,
        include: {
          order: {
            include: {
              restaurant: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.paymentSlip.count({ where })
    ])

    // Get summary statistics
    const stats = await prisma.paymentSlip.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      _sum: {
        transferAmount: true
      }
    })

    // Get pending slips count that need immediate attention
    const pendingCount = await prisma.paymentSlip.count({
      where: { status: 'PENDING' }
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      paymentSlips,
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
            amount: curr._sum.transferAmount || 0
          }
          return acc
        }, {}),
        pendingCount
      }
    })

  } catch (error) {
    console.error('Error fetching payment slips:', error)
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

    const { slipId, action, adminNotes } = await request.json()

    if (!slipId || !action) {
      return NextResponse.json(
        { message: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate action
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { message: 'การกระทำไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Check if payment slip exists and is pending
    const paymentSlip = await prisma.paymentSlip.findUnique({
      where: { id: slipId },
      include: {
        order: {
          include: {
            restaurant: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!paymentSlip) {
      return NextResponse.json(
        { message: 'ไม่พบหลักฐานการโอนเงิน' },
        { status: 404 }
      )
    }

    if (paymentSlip.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'หลักฐานการโอนเงินนี้ถูกดำเนินการแล้ว' },
        { status: 400 }
      )
    }

    // Update payment slip status
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const now = new Date()

    const updatedSlip = await prisma.$transaction(async (tx) => {
      // Update payment slip
      const slip = await tx.paymentSlip.update({
        where: { id: slipId },
        data: {
          status: newStatus,
          adminNotes: adminNotes || null,
          ...(action === 'APPROVE' && { approvedAt: now }),
          ...(action === 'REJECT' && { rejectedAt: now })
        }
      })

      // If approved, mark order as paid
      if (action === 'APPROVE') {
        await tx.order.update({
          where: { id: paymentSlip.orderId },
          data: {
            isPaid: true,
            paidAt: now
          }
        })
      }

      return slip
    })

    // TODO: Send notification to customer about payment status
    console.log(`Payment slip ${slipId} ${action.toLowerCase()}d for order ${paymentSlip.order.orderNumber}`)

    return NextResponse.json({
      message: action === 'APPROVE' ? 'อนุมัติการโอนเงินเรียบร้อยแล้ว' : 'ปฏิเสธการโอนเงินเรียบร้อยแล้ว',
      paymentSlip: updatedSlip
    })

  } catch (error) {
    console.error('Error updating payment slip:', error)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัปเดตหลักฐานการโอนเงิน' },
      { status: 500 }
    )
  }
} 