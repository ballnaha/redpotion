import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Production status endpoint - available only when debug is enabled
    const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    
    if (!isDebugEnabled && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Production status endpoint is disabled' },
        { status: 403 }
      )
    }

    const status: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      server: {
        nodejs: process.version,
        platform: process.platform,
        uptime: process.uptime()
      },
      configuration: {},
      database: {},
      authentication: {},
      cookies: {},
      networking: {}
    };

    // Environment Configuration
    status.configuration = {
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL ? 'set' : 'missing',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
      nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      lineClientId: process.env.LINE_CLIENT_ID ? 'set' : 'missing',
      lineClientSecret: process.env.LINE_CLIENT_SECRET ? 'set' : 'missing',
      liffId: process.env.NEXT_PUBLIC_LIFF_ID ? 'set' : 'missing',
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing',
      enforceLineApp: process.env.NEXT_PUBLIC_ENFORCE_LINE_APP || 'not set',
      allowDesktop: process.env.NEXT_PUBLIC_ALLOW_DESKTOP || 'not set',
      requireLineLogin: process.env.NEXT_PUBLIC_REQUIRE_LINE_LOGIN || 'not set',
      enableBypass: process.env.NEXT_PUBLIC_ENABLE_BYPASS || 'not set',
      debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE || 'not set'
    };

    // Database Status
    try {
      const userCount = await prisma.user.count();
      const restaurantCount = await prisma.restaurant.count();
      const activeRestaurants = await prisma.restaurant.count({
        where: { status: 'ACTIVE' }
      });

      status.database = {
        connected: true,
        userCount,
        restaurantCount,
        activeRestaurants,
        lastChecked: new Date().toISOString()
      };
    } catch (dbError) {
      status.database = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

    // Authentication Status
    const cookies = request.cookies.getAll();
    const sessionCookie = request.cookies.get('line-session-token');

    status.authentication = {
      hasCookies: cookies.length > 0,
      cookieCount: cookies.length,
      cookieNames: cookies.map(c => c.name),
      hasSessionCookie: !!sessionCookie,
      sessionCookieLength: sessionCookie?.value?.length || 0
    };

    // JWT Validation (ถ้ามี session cookie)
    if (sessionCookie?.value && process.env.NEXTAUTH_SECRET) {
      try {
        const decoded = jwt.verify(sessionCookie.value, process.env.NEXTAUTH_SECRET);
        status.authentication.jwtValid = true;
        status.authentication.jwtPayload = {
          userId: (decoded as any).userId,
          role: (decoded as any).role,
          exp: (decoded as any).exp,
          iat: (decoded as any).iat
        };
      } catch (jwtError) {
        status.authentication.jwtValid = false;
        status.authentication.jwtError = jwtError instanceof Error ? jwtError.message : 'JWT validation failed';
      }
    }

    // Cookie Configuration Analysis
    status.cookies = {
      expectedSettings: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL 
          ? (() => {
              try {
                const urlObj = new URL(process.env.NEXTAUTH_URL!);
                const hostname = urlObj.hostname;
                const domainParts = hostname.split('.');
                return domainParts.length > 2 
                  ? '.' + domainParts.slice(-2).join('.')
                  : hostname;
              } catch {
                return 'invalid-nextauth-url';
              }
            })()
          : undefined,
        path: '/',
        maxAge: 30 * 24 * 60 * 60
      }
    };

    // Network Status
    const userAgent = request.headers.get('user-agent') || '';
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    status.networking = {
      userAgent: userAgent.slice(0, 200) + (userAgent.length > 200 ? '...' : ''),
      origin,
      referer,
      isLineApp: userAgent.includes('Line'),
      isDesktop: !userAgent.includes('Mobile') && !userAgent.includes('Line'),
      headers: {
        'accept': request.headers.get('accept')?.slice(0, 100),
        'accept-language': request.headers.get('accept-language'),
        'accept-encoding': request.headers.get('accept-encoding')
      }
    };

    // Configuration Validation
    const issues: string[] = [];
    const warnings: string[] = [];

    if (status.configuration.nodeEnv !== 'production') {
      warnings.push(`NODE_ENV is "${status.configuration.nodeEnv}" instead of "production"`);
    }

    if (status.configuration.nextAuthUrl === 'missing') {
      issues.push('NEXTAUTH_URL is not configured');
    }

    if (status.configuration.nextAuthSecret === 'missing') {
      issues.push('NEXTAUTH_SECRET is not configured');
    } else if (status.configuration.nextAuthSecretLength < 32) {
      warnings.push(`NEXTAUTH_SECRET is too short (${status.configuration.nextAuthSecretLength} chars, should be 32+)`);
    }

    if (status.configuration.lineClientId === 'missing') {
      issues.push('LINE_CLIENT_ID is not configured');
    }

    if (status.configuration.lineClientSecret === 'missing') {
      issues.push('LINE_CLIENT_SECRET is not configured');
    }

    if (status.configuration.liffId === 'missing') {
      issues.push('NEXT_PUBLIC_LIFF_ID is not configured');
    }

    if (!status.database.connected) {
      issues.push('Database connection failed');
    }

    if (status.authentication.hasSessionCookie && status.authentication.jwtValid === false) {
      issues.push('Session cookie exists but JWT is invalid');
    }

    status.validation = {
      issues,
      warnings,
      overallStatus: issues.length === 0 ? (warnings.length === 0 ? 'healthy' : 'warning') : 'error'
    };

    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('❌ Production status check failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check production status', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 