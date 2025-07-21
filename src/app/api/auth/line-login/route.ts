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
  platform?: string
  updateProfile?: boolean
  isRecovery?: boolean
}

export async function POST(req: NextRequest) {
  try {
    // เพิ่ม debugging สำหรับ request ที่เข้ามา
    console.log('🔍 LINE Login API called');
    console.log('📊 Request headers:', {
      'content-type': req.headers.get('content-type'),
      'user-agent': req.headers.get('user-agent')?.slice(0, 100),
      'origin': req.headers.get('origin'),
      'referer': req.headers.get('referer')
    });

    // อ่าน request body และ debug
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📦 Request body received:', {
        hasAccessToken: !!requestBody.accessToken,
        accessTokenLength: requestBody.accessToken?.length || 0,
        restaurantId: requestBody.restaurantId,
        platform: requestBody.platform,
        returnUrl: requestBody.returnUrl,
        isRecovery: requestBody.isRecovery,
        allKeys: Object.keys(requestBody)
      });
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON body:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { accessToken, restaurantId, returnUrl, isRecovery, platform, updateProfile } = requestBody;

    if (!accessToken) {
      console.error('❌ No access token provided in request');
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    if (typeof accessToken !== 'string' || accessToken.trim() === '') {
      console.error('❌ Invalid access token format:', typeof accessToken, accessToken?.length);
      return NextResponse.json(
        { error: 'Access token must be a non-empty string' },
        { status: 400 }
      );
    }

    // ตรวจจับแพลตฟอร์มจาก User-Agent และ platform parameter
    const detectPlatform = (): 'IOS' | 'ANDROID' | 'BROWSER' => {
      // ใช้ platform parameter ก่อนถ้ามี
      if (platform) {
        const platformLower = platform.toLowerCase();
        if (platformLower === 'ios') return 'IOS';
        if (platformLower === 'android') return 'ANDROID';
        if (platformLower === 'web' || platformLower === 'browser') return 'BROWSER';
      }

      // ตรวจจับจาก User-Agent
      const userAgent = req.headers.get('user-agent') || '';
      
      if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iOS')) {
        return 'IOS';
      }
      if (userAgent.includes('Android')) {
        return 'ANDROID';
      }
      
      return 'BROWSER';
    };

    const loginPlatform = detectPlatform();
    console.log(`🔐 LINE Login from platform: ${loginPlatform}`);

    const loginType = isRecovery ? 'Recovery' : 'Normal';
    console.log(`🔐 LINE ${loginType} Login attempt with restaurantId:`, restaurantId)

    // ตรวจสอบ access token กับ LINE API - ลด timeout เพื่อความเร็ว
    console.log('🌐 Validating access token with LINE API...');
    const lineResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      signal: AbortSignal.timeout(3000) // 3 วินาที timeout
    })

    if (!lineResponse.ok) {
      console.error('❌ LINE API error:', lineResponse.status, lineResponse.statusText);
      const errorBody = await lineResponse.text().catch(() => 'Unknown error');
      console.error('❌ LINE API error body:', errorBody);
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

    // ค้นหาหรือสร้าง user ในฐานข้อมูล - เพิ่ม caching
    let user = await prisma.user.findUnique({
      where: { lineUserId: lineProfile.userId }
    })

    let isNewUser = false;
    let profileUpdated = false;

    if (!user) {
      console.log('👤 Creating new LINE user with profile data')
      isNewUser = true;
      
      // ตั้ง role เป็น CUSTOMER เป็น default สำหรับผู้ใช้ใหม่
      const userRole = 'CUSTOMER'; // ใช้ CUSTOMER เป็น default role สำหรับทุก platform
      
      console.log(`📱 Platform: ${loginPlatform}, Setting role: ${userRole}`);
      
      user = await prisma.user.create({
        data: {
          lineUserId: lineProfile.userId,
          name: lineProfile.displayName,
          image: lineProfile.pictureUrl,
          role: userRole,
          loginPlatform: loginPlatform,
          // สร้าง email จาก LINE User ID
          email: `line_${lineProfile.userId}@line.user`
        } as any
      })
      console.log('✅ New user created:', {
        id: user.id,
        name: user.name,
        image: user.image,
        role: user.role,
        platform: loginPlatform
      });
    } else {
      console.log('👤 Existing LINE user found, checking for profile updates...')
      
      // ตรวจสอบว่าต้องอัพเดทข้อมูลหรือไม่
      const needsUpdate = 
        user.name !== lineProfile.displayName || 
        user.image !== lineProfile.pictureUrl ||
        (user as any).loginPlatform !== loginPlatform ||
        updateProfile; // บังคับ update เมื่อมาจากหน้า settings
      
      if (needsUpdate) {
        const updateReason = updateProfile ? 'forced from settings' : 'profile data changed';
        console.log(`🔄 Updating user profile (${updateReason})...`, {
          oldName: user.name,
          newName: lineProfile.displayName,
          oldImage: user.image,
          newImage: lineProfile.pictureUrl,
          oldPlatform: (user as any).loginPlatform,
          newPlatform: loginPlatform
        });
        
        // อัพเดทข้อมูลจาก LINE ทุกครั้งที่ login
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lineUserId: lineProfile.userId, // เพิ่มการอัปเดต lineUserId
            name: lineProfile.displayName,
            image: lineProfile.pictureUrl,
            loginPlatform: loginPlatform,
            updatedAt: new Date() // บันทึกเวลาที่อัพเดทล่าสุด
          } as any
        })
        profileUpdated = true;
        
        console.log('✅ Profile updated successfully:', {
          id: user.id,
          name: user.name,
          image: user.image,
          lineUserId: user.lineUserId,
          loginPlatform: (user as any).loginPlatform,
          updateFromSettings: updateProfile
        });
      } else {
        console.log('ℹ️ Profile data unchanged, no update needed');
        
        // อัพเดทเฉพาะ updatedAt เพื่อบันทึกการ login ล่าสุด
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lineUserId: lineProfile.userId, // ให้แน่ใจว่ามี lineUserId
            loginPlatform: loginPlatform,
            updatedAt: new Date()
          } as any
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

    // ตัดสินใจ redirect ตาม role ก่อน
    if (user.role === 'RESTAURANT_OWNER') {
      console.log('👨‍🍳 Restaurant owner login - redirect to restaurant management')
      finalRedirectUrl = '/restaurant'
      shouldRedirectToRestaurant = false // Restaurant owner ไปหน้าจัดการร้าน ไม่ใช่เมนู
    }
    // ถ้าเป็น newUser จาก iOS/Android และมี restaurantId ให้ redirect ไปเมนูโดยตรง
    else if (isNewUser && (loginPlatform === 'IOS' || loginPlatform === 'ANDROID') && restaurantId) {
      console.log('📱 New mobile user with restaurant, direct redirect to menu')
      shouldRedirectToRestaurant = true
      finalRedirectUrl = `/menu/${restaurantId}?from=mobile-new-user`
    }
    // ใช้ returnUrl ถ้ามี (สำหรับ customer เท่านั้น)
    else if (returnUrl && user.role === 'CUSTOMER') {
      console.log('🔄 Using returnUrl for customer:', returnUrl)
      finalRedirectUrl = returnUrl
      if (returnUrl.includes('/menu/') || returnUrl.includes('/cart/')) {
        shouldRedirectToRestaurant = true
      }
    } 
    // ถ้ามี restaurantId และเป็น customer
    else if (restaurantId && user.role === 'CUSTOMER') {
      console.log('🏪 Customer with restaurantId, redirect to menu:', restaurantId)
      shouldRedirectToRestaurant = true
      finalRedirectUrl = `/menu/${restaurantId}?from=line-signin`
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