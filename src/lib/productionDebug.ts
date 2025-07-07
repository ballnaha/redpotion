/**
 * Production Debug Utilities
 * ตรวจสอบปัญหาที่เกิดขึ้นใน production environment
 */

import { getAppConfig, getEnvironmentMode, isProduction, isDevelopment } from './appConfig';

export interface ProductionDiagnostics {
  environment: {
    nodeEnv: string;
    mode: 'production' | 'development';
    nextAuthUrl?: string;
    hasLiffId: boolean;
    hasLineCredentials: boolean;
    appConfig: ReturnType<typeof getAppConfig>;
  };
  cookies: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
    domain?: string;
    path: string;
  };
  session: {
    canAccessCookies: boolean;
    cookieExists: boolean;
    jwtValid: boolean;
    userExists: boolean;
  };
  liff: {
    sdkAvailable: boolean;
    initialized: boolean;
    loggedIn: boolean;
    hasAccessToken: boolean;
  };
  networking: {
    canReachApi: boolean;
    corsIssues: boolean;
    sslIssues: boolean;
  };
}

/**
 * รวบรวมข้อมูล diagnostics สำหรับ production
 */
export const collectProductionDiagnostics = async (): Promise<ProductionDiagnostics> => {
  const appConfig = getAppConfig();
  
  const diagnostics: ProductionDiagnostics = {
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      mode: getEnvironmentMode(),
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasLiffId: !!process.env.NEXT_PUBLIC_LIFF_ID,
      hasLineCredentials: !!process.env.LINE_CLIENT_ID && !!process.env.LINE_CLIENT_SECRET,
      appConfig
    },
    cookies: {
      httpOnly: true,
      secure: isProduction(),
      sameSite: isProduction() ? 'none' : 'lax',
      domain: isProduction() && process.env.NEXTAUTH_URL 
        ? new URL(process.env.NEXTAUTH_URL).hostname 
        : undefined,
      path: '/'
    },
    session: {
      canAccessCookies: false,
      cookieExists: false,
      jwtValid: false,
      userExists: false
    },
    liff: {
      sdkAvailable: false,
      initialized: false,
      loggedIn: false,
      hasAccessToken: false
    },
    networking: {
      canReachApi: false,
      corsIssues: false,
      sslIssues: false
    }
  };

  // ตรวจสอบ client-side เท่านั้น
  if (typeof window === 'undefined') {
    return diagnostics;
  }

  // ตรวจสอบ LIFF SDK
  if (window.liff) {
    diagnostics.liff.sdkAvailable = true;
    
    try {
      const isLoggedIn = window.liff.isLoggedIn();
      diagnostics.liff.initialized = true;
      diagnostics.liff.loggedIn = isLoggedIn;
      
      if (isLoggedIn) {
        const accessToken = window.liff.getAccessToken();
        diagnostics.liff.hasAccessToken = !!accessToken;
      }
    } catch (error) {
      console.warn('⚠️ LIFF not properly initialized:', error);
    }
  }

  // ตรวจสอบ API connectivity
  try {
    const response = await fetch('/api/health');
    diagnostics.networking.canReachApi = response.ok;
  } catch (error) {
    diagnostics.networking.canReachApi = false;
    if (error instanceof TypeError && error.message.includes('CORS')) {
      diagnostics.networking.corsIssues = true;
    }
  }

  // ตรวจสอบ cookies
  if (typeof document !== 'undefined') {
    diagnostics.session.canAccessCookies = true;
    diagnostics.session.cookieExists = document.cookie.includes('line-session-token');
  }

  return diagnostics;
};

/**
 * สร้างรายงาน production issues
 */
export const generateProductionReport = (diagnostics: ProductionDiagnostics): string => {
  const issues: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  // Environment issues
  if (diagnostics.environment.nodeEnv !== 'production' && diagnostics.environment.nodeEnv !== 'development') {
    warnings.push(`NODE_ENV is "${diagnostics.environment.nodeEnv}" (should be "production" or "development")`);
  }

  if (!diagnostics.environment.nextAuthUrl) {
    issues.push('NEXTAUTH_URL is not configured');
  }

  if (!diagnostics.environment.hasLiffId) {
    issues.push('NEXT_PUBLIC_LIFF_ID is not configured');
  }

  if (!diagnostics.environment.hasLineCredentials) {
    issues.push('LINE_CLIENT_ID or LINE_CLIENT_SECRET is missing');
  }

  // Cookie issues
  if (isProduction()) {
    if (!diagnostics.cookies.secure) {
      issues.push('Cookies should be secure in production');
    }
    if (diagnostics.cookies.sameSite !== 'none') {
      warnings.push('SameSite should be "none" for LIFF iframe in production');
    }
    if (!diagnostics.cookies.domain) {
      warnings.push('Cookie domain not set in production');
    }
  }

  // Session issues
  if (!diagnostics.session.canAccessCookies) {
    issues.push('Cannot access session cookies (possible CORS or network issue)');
  }

  if (!diagnostics.networking.canReachApi) {
    issues.push('Cannot reach authentication API');
  }

  if (diagnostics.networking.corsIssues) {
    issues.push('CORS issues detected - check your domain configuration');
  }

  if (diagnostics.networking.sslIssues) {
    issues.push('SSL/TLS issues detected');
  }

  // LIFF issues
  if (!diagnostics.liff.sdkAvailable) {
    warnings.push('LIFF SDK not loaded');
  } else if (!diagnostics.liff.initialized) {
    issues.push('LIFF SDK not initialized');
  }

  // Configuration info
  info.push(`Environment: ${diagnostics.environment.mode}`);
  info.push(`Debug mode: ${diagnostics.environment.appConfig.enableDebugLogs ? 'enabled' : 'disabled'}`);
  info.push(`Bypass mode: ${diagnostics.environment.appConfig.enableBypassMode ? 'enabled' : 'disabled'}`);

  let report = '🔍 Production Diagnostics Report\n\n';
  
  if (info.length > 0) {
    report += '📋 Information:\n';
    info.forEach(item => report += `  ℹ️ ${item}\n`);
    report += '\n';
  }

  if (issues.length > 0) {
    report += '❌ Issues Found:\n';
    issues.forEach(issue => report += `  • ${issue}\n`);
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '⚠️ Warnings:\n';
    warnings.forEach(warning => report += `  • ${warning}\n`);
    report += '\n';
  }

  if (issues.length === 0 && warnings.length === 0) {
    report += '✅ No issues found! System appears to be working correctly.\n\n';
  }

  // แนะนำการแก้ไข
  report += '🛠️ Suggested Fixes:\n';
  
  if (issues.includes('NEXTAUTH_URL is not configured')) {
    report += '  • Set NEXTAUTH_URL environment variable\n';
  }
  
  if (issues.includes('NEXT_PUBLIC_LIFF_ID is not configured')) {
    report += '  • Configure NEXT_PUBLIC_LIFF_ID in your environment variables\n';
  }
  
  if (issues.includes('Cannot reach authentication API')) {
    report += '  • Check your server status and network connectivity\n';
    report += '  • Verify your domain DNS settings\n';
  }
  
  if (issues.includes('CORS issues detected - check your domain configuration')) {
    report += '  • Add your domain to allowed origins\n';
    report += '  • Check your reverse proxy/CDN CORS settings\n';
  }
  
  if (warnings.includes('No session cookie found - user needs to log in')) {
    report += '  • User should complete LINE login process\n';
    report += '  • Check if auto-login is working properly\n';
  }

  if (issues.includes('Session cookie exists but JWT is invalid')) {
    report += '  • JWT secret might have changed\n';
    report += '  • Cookie might be corrupted or expired\n';
    report += '  • Consider clearing cookies and re-logging in\n';
  }

  return report;
};

/**
 * เริ่มต้นการ monitor production
 */
export const startProductionMonitoring = (intervalMs: number = 60000) => {
  if (isDevelopment()) {
    console.log('🔍 Production monitoring disabled in development mode');
    return;
  }

  const monitor = async () => {
    try {
      const diagnostics = await collectProductionDiagnostics();
      const report = generateProductionReport(diagnostics);
      
      if (diagnostics.environment.appConfig.enableDebugLogs) {
        console.log('📊 Production Monitor Report:');
        console.log(report);
      }
    } catch (error) {
      console.error('❌ Production monitoring failed:', error);
    }
  };

  // เริ่มต้น monitor
  monitor();
  
  // ตั้งค่า interval
  const intervalId = setInterval(monitor, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}; 