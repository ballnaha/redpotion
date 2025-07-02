import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface LineSessionData {
  userId: string
  lineUserId: string
  name: string
  email: string
  role: string
  image?: string
  restaurantId?: string
}

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('line-session-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false, error: 'No session token' },
        { status: 401 }
      )
    }

    const jwtSecret = process.env.NEXTAUTH_SECRET
    if (!jwtSecret) {
      console.error('❌ JWT Secret not configured')
      return NextResponse.json(
        { authenticated: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    try {
      const decoded = jwt.verify(sessionToken, jwtSecret) as LineSessionData
      
      // ตรวจสอบว่า user ยังมีอยู่ใน database หรือไม่
      const user = await prisma.user.findUnique({
        where: { lineUserId: decoded.lineUserId }
      })

      if (!user) {
        console.log('❌ LINE user no longer exists in database:', decoded.lineUserId)
        return NextResponse.json(
          { authenticated: false, error: 'User not found in database' },
          { status: 401 }
        )
      }
      
      console.log('✅ LINE Session valid for user:', user.name)
      
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
          lineUserId: user.lineUserId
        },
        restaurantId: decoded.restaurantId
      })

    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError)
      return NextResponse.json(
        { authenticated: false, error: 'Invalid session token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('❌ LINE Session check error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('🔐 LINE Logout requested')
    
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // ลบ session cookie
    response.cookies.set('line-session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('❌ LINE Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 