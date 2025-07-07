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
    const { accessToken, restaurantId, returnUrl, isRecovery }: LineLoginRequest & { isRecovery?: boolean } = await req.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    const loginType = isRecovery ? 'Recovery' : 'Normal';
    console.log(`🔐 LINE ${loginType} Login attempt with restaurantId:`, restaurantId)

    // ตรวจสอบ access token กับ LINE API - เพิ่ม timeout เพื่อความเร็ว
    const lineResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      signal: AbortSignal.timeout(5000) // 5 วินาที timeout
    })

    if (!lineResponse.ok) {
      console.error('❌ LINE API error:', lineResponse.status, lineResponse.statusText)
      return NextResponse.json(
        { error: 'Invalid LINE access token' },
        { status: 401 }
      )
    }

    const lineProfile: LineProfile = await lineResponse.json()
    console.log('📋 LINE Profile received:', {
      userId: lineProfile.userId,
      displayName: lineProfile.displayName,
      pictureUrl: lineProfile.pictureUrl,
      statusMessage: lineProfile.statusMessage
    })

    // ค้นหาหรือสร้าง user ในฐานข้อมูล
    let user = await prisma.user.findUnique({
      where: { lineUserId: lineProfile.userId }
    })

    let isNewUser = false;
    let profileUpdated = false;

    if (!user) {
      console.log('👤 Creating new LINE user with profile data')
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
      console.log('✅ New user created:', {
        id: user.id,
        name: user.name,
        image: user.image
      });
    } else {
      console.log('👤 Existing LINE user found, checking for profile updates...')
      
      // ตรวจสอบว่าต้องอัพเดทข้อมูลหรือไม่
      const needsUpdate = 
        user.name !== lineProfile.displayName || 
        user.image !== lineProfile.pictureUrl;
      
      if (needsUpdate) {
        console.log('🔄 Profile data changed, updating...', {
          oldName: user.name,
          newName: lineProfile.displayName,
          oldImage: user.image,
          newImage: lineProfile.pictureUrl
        });
        
        // อัพเดทข้อมูลจาก LINE ทุกครั้งที่ login
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: lineProfile.displayName,
            image: lineProfile.pictureUrl,
            updatedAt: new Date() // บันทึกเวลาที่อัพเดทล่าสุด
          }
        })
        profileUpdated = true;
        
        console.log('✅ Profile updated successfully:', {
          id: user.id,
          name: user.name,
          image: user.image
        });
      } else {
        console.log('ℹ️ Profile data unchanged, no update needed');
        
        // อัพเดทเฉพาะ updatedAt เพื่อบันทึกการ login ล่าสุด
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            updatedAt: new Date()
          }
        })
      }
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
      profileUpdated, // เพิ่มข้อมูลว่ามีการอัพเดทโปรไฟล์หรือไม่
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        lineUserId: user.lineUserId
      },
      lineProfile: { // เพิ่มข้อมูล LINE profile เดิมสำหรับการแสดงผล
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        statusMessage: lineProfile.statusMessage
      },
      redirectUrl: finalRedirectUrl,
      shouldRedirectToRestaurant,
      restaurantId: restaurantId || null
    })

    // ตั้งค่า cookie สำหรับ session - ปรับปรุงให้เสถียรขึ้น
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    };

    // แก้ไข domain configuration สำหรับ production
    if (process.env.NODE_ENV === 'production') {
      // ปรับปรุงการจัดการ domain ให้เสถียรขึ้น
      if (process.env.NEXTAUTH_URL) {
        try {
          const urlObj = new URL(process.env.NEXTAUTH_URL);
          const hostname = urlObj.hostname;
          
          // ตรวจสอบ IP address vs domain name
          const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
          
          if (!isIP) {
            const domainParts = hostname.split('.');
            if (domainParts.length > 2) {
              // สำหรับ subdomain เช่น red.theredpotion.com
              const rootDomain = domainParts.slice(-2).join('.');
              cookieOptions.domain = '.' + rootDomain;
              console.log('🍪 Setting cookie domain (subdomain):', cookieOptions.domain);
            } else if (domainParts.length === 2) {
              // สำหรับ root domain เช่น theredpotion.com
              cookieOptions.domain = '.' + hostname;
              console.log('🍪 Setting cookie domain (root):', cookieOptions.domain);
            }
          } else {
            // สำหรับ IP address ไม่ต้องใส่ domain
            console.log('🍪 Using IP address, no domain setting');
          }
        } catch (error) {
          console.warn('⚠️ Failed to parse NEXTAUTH_URL for cookie domain:', error);
        }
      }
      
      // เพิ่ม SameSite=None สำหรับ LIFF iframe
      cookieOptions.sameSite = 'none';
      cookieOptions.secure = true;
    }

    console.log('🍪 Cookie options:', {
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      domain: cookieOptions.domain,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
      httpOnly: cookieOptions.httpOnly
    });

    response.cookies.set('line-session-token', sessionToken, cookieOptions)

    // เพิ่ม backup cookie สำหรับ recovery (shorter lived)
    const backupCookieOptions = {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: false // ให้ client access ได้เพื่อใช้เป็น fallback
    };
    response.cookies.set('line-session-backup', JSON.stringify({
      userId: user.id,
      timestamp: Date.now()
    }), backupCookieOptions);

    return response

  } catch (error) {
    console.error('❌ LINE Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 