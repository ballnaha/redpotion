import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบว่าอยู่ใน development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    console.log('🔐 Debug: Login test user');

    // หา test user
    const testUser = await prisma.user.findUnique({
      where: { lineUserId: 'test-line-user-123' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        lineUserId: true
      }
    });

    if (!testUser) {
      return NextResponse.json(
        { error: 'Test user not found. Please run create-test-user.js first' },
        { status: 404 }
      );
    }

    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'JWT Secret not configured' },
        { status: 500 }
      );
    }

    // สร้าง JWT token สำหรับ test user
    const tokenPayload = {
      userId: testUser.id,
      lineUserId: testUser.lineUserId,
      name: testUser.name,
      email: testUser.email,
      role: testUser.role,
      image: testUser.image
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: '30d'
    });

    // สร้าง response และ set cookies
    const response = NextResponse.json({
      success: true,
      message: 'Test user logged in successfully',
      user: testUser
    });

    // Set session cookie
    const isProduction = (process.env.NODE_ENV as string) === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    };

    response.cookies.set('line-session-token', token, cookieOptions);

    console.log('✅ Test user logged in:', testUser.name);

    return response;

  } catch (error) {
    console.error('❌ Debug login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 