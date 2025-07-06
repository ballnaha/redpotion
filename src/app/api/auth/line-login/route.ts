import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface LineLoginRequest {
  accessToken: string
  restaurantId?: string
  returnUrl?: string
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, restaurantId, returnUrl }: LineLoginRequest = await req.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    console.log('🔐 LINE Login attempt with restaurantId:', restaurantId)

    // ตรวจสอบ access token กับ LINE API
    const lineResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!lineResponse.ok) {
      console.error('❌ LINE API error:', lineResponse.status, lineResponse.statusText)
      return NextResponse.json(
        { error: 'Invalid LINE access token' },
        { status: 401 }
      )
    }

    const lineProfile: LineProfile = await lineResponse.json()
    console.log('📋 LINE Profile:', {
      userId: lineProfile.userId,
      displayName: lineProfile.displayName
    })

    // ค้นหาหรือสร้าง user ในฐานข้อมูล
    let user = await prisma.user.findUnique({
      where: { lineUserId: lineProfile.userId }
    })

    let isNewUser = false;

    if (!user) {
      console.log('👤 Creating new LINE user')
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          lineUserId: lineProfile.userId,
          name: lineProfile.displayName,
          image: lineProfile.pictureUrl,
          role: 'USER',
          // สร้าง email จาก LINE User ID
          email: `line_${lineProfile.userId}@line.user`
        }
      })
    } else {
      console.log('👤 Existing LINE user found')
      // อัพเดทข้อมูลจาก LINE
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: lineProfile.displayName,
          image: lineProfile.pictureUrl
        }
      })
    }

    // สร้าง JWT token สำหรับ session
    const jwtSecret = process.env.NEXTAUTH_SECRET
    if (!jwtSecret) {
      console.error('❌ JWT Secret not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const sessionToken = jwt.sign(
      {
        userId: user.id,
        lineUserId: user.lineUserId,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        restaurantId: restaurantId || null
      },
      jwtSecret,
      { expiresIn: '30d' }
    )

    console.log('✅ LINE Login successful for user:', user.name)

    // ตรวจสอบ user role และ restaurantId เพื่อตัดสินใจ redirect
    let shouldRedirectToRestaurant = false
    let finalRedirectUrl = '/'

    // ใช้ returnUrl ถ้ามี, ไม่เช่นนั้นใช้ logic เดิม
    if (returnUrl) {
      console.log('🔄 Using returnUrl:', returnUrl)
      finalRedirectUrl = returnUrl
      if (returnUrl.includes('/menu/') || returnUrl.includes('/cart/')) {
        shouldRedirectToRestaurant = true
      }
    } else if (restaurantId) {
      console.log('🏪 RestaurantId provided:', restaurantId)
      shouldRedirectToRestaurant = true
      finalRedirectUrl = `/menu/${restaurantId}?from=line-signin`
    } else if (user.role === 'RESTAURANT_OWNER') {
      console.log('👨‍🍳 Restaurant owner login')
      finalRedirectUrl = '/restaurant'
    } else {
      console.log('👤 Regular user login to home')
      finalRedirectUrl = '/'
    }

    const response = NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        lineUserId: user.lineUserId
      },
      redirectUrl: finalRedirectUrl,
      shouldRedirectToRestaurant,
      restaurantId: restaurantId || null
    })

    // ตั้งค่า cookie สำหรับ session
    response.cookies.set('line-session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // สำหรับ LIFF iframe
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      // เพิ่ม domain สำหรับ production
      ...(process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL && {
        domain: new URL(process.env.NEXTAUTH_URL).hostname
      })
    })

    return response

  } catch (error) {
    console.error('❌ LINE Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 