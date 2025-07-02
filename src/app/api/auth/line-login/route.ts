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
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, restaurantId }: LineLoginRequest = await req.json()

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

    if (!user) {
      console.log('👤 Creating new LINE user')
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

    // กำหนด redirect URL ตาม restaurantId
    let redirectUrl = '/'
    if (restaurantId) {
      redirectUrl = `/menu/${restaurantId}`
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        lineUserId: user.lineUserId
      },
      redirectUrl
    })

    // ตั้งค่า cookie สำหรับ session
    response.cookies.set('line-session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
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