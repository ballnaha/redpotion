import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAppConfig, getEnvironmentMode, isProduction, isDevelopment } from '@/lib/appConfig'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Production status endpoint - available only when debug is enabled
    const appConfig = getAppConfig();
    const isDebugEnabled = appConfig.enableDebugLogs;
    
    if (!isDebugEnabled && isProduction()) {
      return NextResponse.json(
        { error: 'Production status endpoint is disabled' },
        { status: 403 }
      )
    }

    const status: any = {
      timestamp: new Date().toISOString(),
      environment: getEnvironmentMode(),
      server: {
        nodejs: process.version,
        platform: process.platform,
        uptime: process.uptime()
      },
      configuration: {},
      database: {},
      authentication: {},
      cookies: {},
      networking: {},
      appConfig: appConfig
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
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing'
    };

    // Database Test
    try {
      await prisma.$connect();
      const userCount = await prisma.user.count();
      const restaurantCount = await prisma.restaurant.count();
      
      status.database = {
        connected: true,
        userCount,
        restaurantCount,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      status.database = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString()
      };
    }

    // Authentication Test
    const sessionCookie = request.cookies.get('line-session-token');
    
    if (sessionCookie) {
      try {
        const decoded = jwt.verify(sessionCookie.value, process.env.NEXTAUTH_SECRET!);
        status.authentication = {
          hasSessionCookie: true,
          jwtValid: true,
          userId: (decoded as any).userId,
          expiresAt: new Date((decoded as any).exp * 1000).toISOString()
        };
      } catch (error) {
        status.authentication = {
          hasSessionCookie: true,
          jwtValid: false,
          error: error instanceof Error ? error.message : 'JWT verification failed'
        };
      }
    } else {
      status.authentication = {
        hasSessionCookie: false,
        jwtValid: false,
        message: 'No session cookie found'
      };
    }

    // Cookie Configuration Analysis
    status.cookies = {
      expectedSettings: {
        httpOnly: true,
        secure: isProduction(),
        sameSite: isProduction() ? 'none' : 'lax',
        domain: isProduction() && process.env.NEXTAUTH_URL 
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

    if (status.configuration.nodeEnv !== 'production' && status.configuration.nodeEnv !== 'development') {
      warnings.push(`NODE_ENV is "${status.configuration.nodeEnv}" (should be "production" or "development")`);
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