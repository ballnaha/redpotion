/**
 * Production Debug Utilities
 * ตรวจสอบปัญหาที่เกิดขึ้นใน production environment
 */

export interface ProductionDiagnostics {
  environment: {
    nodeEnv: string;
    nextAuthUrl?: string;
    hasLiffId: boolean;
    hasLineCredentials: boolean;
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
  const diagnostics: ProductionDiagnostics = {
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasLiffId: !!process.env.NEXT_PUBLIC_LIFF_ID,
      hasLineCredentials: !!process.env.LINE_CLIENT_ID && !!process.env.LINE_CLIENT_SECRET
    },
    cookies: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL 
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
    const response = await fetch('/api/auth/line-session', {
      method: 'GET',
      credentials: 'include'
    });
    
    diagnostics.networking.canReachApi = response.status !== 500;
    diagnostics.session.canAccessCookies = true;
    
    if (response.ok) {
      const data = await response.json();
      diagnostics.session.jwtValid = data.authenticated;
      diagnostics.session.userExists = !!data.user;
    } else if (response.status === 401) {
      diagnostics.session.cookieExists = false;
    }
  } catch (error) {
    console.error('❌ API connectivity test failed:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      diagnostics.networking.corsIssues = true;
    }
    if (error instanceof Error && error.message.includes('SSL')) {
      diagnostics.networking.sslIssues = true;
    }
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
  if (diagnostics.environment.nodeEnv !== 'production') {
    warnings.push(`NODE_ENV is "${diagnostics.environment.nodeEnv}" instead of "production"`);
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
  if (diagnostics.environment.nodeEnv === 'production') {
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
    warnings.push('LIFF SDK not available (normal for desktop browsers)');
  } else {
    if (!diagnostics.liff.initialized) {
      issues.push('LIFF SDK available but not initialized');
    } else {
      info.push('LIFF SDK properly initialized');
      
      if (diagnostics.liff.loggedIn) {
        info.push('User is logged in to LIFF');
        if (diagnostics.liff.hasAccessToken) {
          info.push('LIFF access token available');
        } else {
          warnings.push('LIFF logged in but no access token');
        }
      } else {
        info.push('User not logged in to LIFF');
      }
    }
  }

  // Session validation
  if (diagnostics.session.jwtValid && diagnostics.session.userExists) {
    info.push('Valid session with user data found');
  } else if (diagnostics.session.canAccessCookies && !diagnostics.session.cookieExists) {
    warnings.push('No session cookie found - user needs to log in');
  } else if (diagnostics.session.cookieExists && !diagnostics.session.jwtValid) {
    issues.push('Session cookie exists but JWT is invalid');
  }

  let report = '🔍 Production Diagnostics Report\n\n';
  
  if (issues.length > 0) {
    report += '❌ CRITICAL ISSUES:\n';
    issues.forEach(issue => report += `  • ${issue}\n`);
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '⚠️ WARNINGS:\n';
    warnings.forEach(warning => report += `  • ${warning}\n`);
    report += '\n';
  }

  if (info.length > 0) {
    report += '✅ STATUS INFO:\n';
    info.forEach(item => report += `  • ${item}\n`);
    report += '\n';
  }

  // Recommendations
  report += '💡 RECOMMENDATIONS:\n';
  
  if (issues.includes('NEXTAUTH_URL is not configured')) {
    report += '  • Set NEXTAUTH_URL to your production domain (e.g., https://red.theredpotion.com)\n';
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
 * Auto-fix common production issues
 */
export const attemptAutoFix = async (): Promise<{ fixed: string[]; failed: string[] }> => {
  const fixed: string[] = [];
  const failed: string[] = [];

  try {
    // ลอง refresh session token
    const response = await fetch('/api/auth/line-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh' })
    });

    if (response.ok) {
      fixed.push('Refreshed session token');
    } else {
      failed.push('Failed to refresh session token');
    }
  } catch (error) {
    failed.push('Network error during token refresh');
  }

  // ลอง re-initialize LIFF
  if (window.liff) {
    try {
      const { initializeLiff } = await import('./sessionUtils');
      const result = await initializeLiff();
      
      if (result.success) {
        fixed.push('Re-initialized LIFF SDK');
      } else {
        failed.push(`LIFF re-initialization failed: ${result.error}`);
      }
    } catch (error) {
      failed.push('Error during LIFF re-initialization');
    }
  }

  return { fixed, failed };
};

/**
 * Continuous monitoring สำหรับ production
 */
export const startProductionMonitoring = (intervalMs: number = 30000) => {
  let intervalId: NodeJS.Timeout;

  const monitor = async () => {
    const diagnostics = await collectProductionDiagnostics();
    
    // ตรวจสอบปัญหาที่ร้ายแรง
    const hasCriticalIssues = (
      !diagnostics.networking.canReachApi ||
      diagnostics.networking.corsIssues ||
      (diagnostics.session.cookieExists && !diagnostics.session.jwtValid)
    );

    if (hasCriticalIssues) {
      console.error('🚨 Critical production issues detected!');
      console.log(generateProductionReport(diagnostics));
      
      // ลอง auto-fix
      const { fixed, failed } = await attemptAutoFix();
      if (fixed.length > 0) {
        console.log('✅ Auto-fixed:', fixed);
      }
      if (failed.length > 0) {
        console.error('❌ Auto-fix failed:', failed);
      }
    }
  };

  if (typeof window !== 'undefined') {
    intervalId = setInterval(monitor, intervalMs);
    
    // รัน monitor ครั้งแรกทันที
    monitor();
  }

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}; 