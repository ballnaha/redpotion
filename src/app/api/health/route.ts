import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const health = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    responseTime: 0,
    checks: {
      database: { status: 'unknown', responseTime: 0, error: null as string | null },
      environment: { status: 'unknown', missing: [] as string[] },
      liff: { status: 'unknown', configured: false }
    }
  };

  let overallStatus = 'ok';

  // Database Health Check
  const dbStartTime = Date.now();
  try {
    const userCount = await prisma.user.count();
    const dbResponseTime = Date.now() - dbStartTime;
    
    health.checks.database = {
      status: 'healthy',
      responseTime: dbResponseTime,
      error: null
    };

    // Database performance warning
    if (dbResponseTime > 1000) {
      health.checks.database.status = 'slow';
      overallStatus = 'warning';
    }
  } catch (error) {
    health.checks.database = {
      status: 'error',
      responseTime: Date.now() - dbStartTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
    overallStatus = 'error';
  }

  // Environment Check
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'LINE_CLIENT_ID',
    'LINE_CLIENT_SECRET',
    'NEXT_PUBLIC_LIFF_ID',
    'DATABASE_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  health.checks.environment = {
    status: missingEnvVars.length === 0 ? 'healthy' : 'error',
    missing: missingEnvVars
  };

  if (missingEnvVars.length > 0) {
    overallStatus = 'error';
  }

  // LIFF Configuration Check
  health.checks.liff = {
    status: process.env.NEXT_PUBLIC_LIFF_ID ? 'healthy' : 'warning',
    configured: !!process.env.NEXT_PUBLIC_LIFF_ID
  };

  if (!process.env.NEXT_PUBLIC_LIFF_ID) {
    overallStatus = overallStatus === 'ok' ? 'warning' : overallStatus;
  }

  // Calculate total response time
  health.responseTime = Date.now() - startTime;
  health.status = overallStatus;

  // Return appropriate HTTP status
  const httpStatus = overallStatus === 'error' ? 500 : 
                    overallStatus === 'warning' ? 200 : 200;

  return NextResponse.json(health, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    }
  });
} 