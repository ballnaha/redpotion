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
  iat?: number
  exp?: number
}

export async function GET(req: NextRequest) {
  try {
    // Enhanced debugging สำหรับ production
    const cookies = req.cookies.getAll();
    const hasLineSessionCookie = cookies.some(cookie => cookie.name === 'line-session-token');
    const sessionToken = req.cookies.get('line-session-token')?.value;
    
    console.log('🔍 Session check details:', {
      hasCookies: cookies.length > 0,
      hasLineSessionCookie,
      hasSessionTokenValue: !!sessionToken,
      cookieNames: cookies.map(c => c.name),
      userAgent: req.headers.get('user-agent')?.slice(0, 100) + '...',
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer')
    });

    if (!sessionToken) {
      console.log('❌ No session token found - cookies available:', cookies.map(c => c.name));
      return NextResponse.json(
        { 
          authenticated: false, 
          error: 'No session token',
          debug: {
            cookieCount: cookies.length,
            cookieNames: cookies.map(c => c.name),
            hasLineSessionCookie
          }
        },
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
      // ตรวจสอบและ decode JWT token
      const decoded = jwt.verify(sessionToken, jwtSecret) as LineSessionData
      
      // ตรวจสอบว่า token ใกล้หมดอายุหรือไม่ (เหลือน้อยกว่า 7 วัน)
      const now = Math.floor(Date.now() / 1000)
      const tokenExpiry = decoded.exp || 0
      const daysUntilExpiry = (tokenExpiry - now) / (24 * 60 * 60)
      
      if (daysUntilExpiry < 7) {
        console.log('⚠️ JWT token expiring soon, days left:', daysUntilExpiry.toFixed(1))
      }
      
      // ตรวจสอบว่า user ยังมีอยู่ใน database หรือไม่ - optimized query
      const user = await prisma.user.findUnique({
        where: { lineUserId: decoded.lineUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          lineUserId: true,
          updatedAt: true
        }
      })

      if (!user) {
        console.log('❌ LINE user no longer exists in database:', decoded.lineUserId)
        
        // ลบ invalid cookie
        const response = NextResponse.json(
          { authenticated: false, error: 'User not found in database' },
          { status: 401 }
        )
        response.cookies.set('line-session-token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/'
        })
        
        return response
      }
      
      console.log('✅ LINE Session valid for user:', user.name, 'expires in', daysUntilExpiry.toFixed(1), 'days')
      
      // ส่งข้อมูล user กลับไป
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
        restaurantId: decoded.restaurantId,
        sessionInfo: {
          expiresIn: daysUntilExpiry,
          needsRefresh: daysUntilExpiry < 7
        }
      })

    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError)
      
      // ลบ invalid cookie
      const response = NextResponse.json(
        { authenticated: false, error: 'Invalid session token' },
        { status: 401 }
      )
      response.cookies.set('line-session-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      })
      
      return response
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

// เพิ่ม endpoint สำหรับ refresh token
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()
    
    if (action === 'refresh') {
      const sessionToken = req.cookies.get('line-session-token')?.value
      
      if (!sessionToken) {
        return NextResponse.json(
          { success: false, error: 'No session token' },
          { status: 401 }
        )
      }

      const jwtSecret = process.env.NEXTAUTH_SECRET
      if (!jwtSecret) {
        return NextResponse.json(
          { success: false, error: 'Server configuration error' },
          { status: 500 }
        )
      }

      try {
        const decoded = jwt.verify(sessionToken, jwtSecret) as LineSessionData
        
        // ตรวจสอบ user ในฐานข้อมูล
        const user = await prisma.user.findUnique({
          where: { lineUserId: decoded.lineUserId }
        })

        if (!user) {
          return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 401 }
          )
        }

        // สร้าง token ใหม่
        const newToken = jwt.sign(
          {
            userId: user.id,
            lineUserId: user.lineUserId,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
            restaurantId: decoded.restaurantId || null
          },
          jwtSecret,
          { expiresIn: '30d' }
        )

        const response = NextResponse.json({
          success: true,
          message: 'Token refreshed successfully'
        })

        // อัพเดท cookie
        response.cookies.set('line-session-token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/'
        })

        console.log('✅ Token refreshed for user:', user.name)
        return response

      } catch (jwtError) {
        console.error('❌ Token refresh failed:', jwtError)
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ POST request error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 