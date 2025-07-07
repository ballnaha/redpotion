/**
 * Hybrid Authentication System
 * ใช้ Session API เป็นหลัก + LIFF เป็นรอง
 * แนวทางนี้เสถียรและนิยมใช้กันมากกว่า pure LIFF
 */

import { getAppConfig } from './appConfig';

export interface AuthResult {
  success: boolean;
  user?: any;
  needsRedirect?: boolean;
  redirectUrl?: string;
  error?: string;
  method: 'session' | 'liff' | 'none';
}

export interface AuthOptions {
  restaurantId?: string;
  returnUrl?: string;
  forceReauth?: boolean;
}

/**
 * ระบบ Authentication หลัก - ใช้ Session API เป็นหลัก
 */
export const authenticateUser = async (options: AuthOptions = {}): Promise<AuthResult> => {
  const config = getAppConfig();
  
  console.log('🔐 Starting hybrid authentication...', options);
  
  // Step 1: ตรวจสอบ Session API ก่อนเสมอ (หลัก)
  const sessionResult = await checkSessionAuth();
  if (sessionResult.success && !options.forceReauth) {
    console.log('✅ Session authentication successful');
    return sessionResult;
  }
  
  // Step 2: ถ้าไม่มี session และอยู่ใน LINE environment ให้ลอง LIFF (เป็น fallback เท่านั้น)
  if (isInLineEnvironment() && config.requireLineLogin) {
    console.log('📱 No session but in LINE environment, trying LIFF as fallback...');
    const liffResult = await tryLiffAuth(options);
    if (liffResult.success) {
      return liffResult;
    }
    // ถ้า LIFF ล้มเหลว ให้ลอง session อีกครั้ง (เผื่อ user เพิ่ง login)
    console.log('⚠️ LIFF failed, retrying session check...');
    const retrySessionResult = await checkSessionAuth();
    if (retrySessionResult.success) {
      console.log('✅ Session authentication successful on retry');
      return retrySessionResult;
    }
  }
  
  // Step 3: ถ้าทั้งคู่ไม่ได้ ให้ redirect ไป login
  return {
    success: false,
    needsRedirect: true,
    redirectUrl: buildLoginUrl(options),
    error: 'Authentication required',
    method: 'none'
  };
};

/**
 * ตรวจสอบ Session API (เร็วและเสถียร)
 */
export const checkSessionAuth = async (): Promise<AuthResult> => {
  try {
    console.log('🔍 Checking session API...');
    
    const response = await fetch('/api/auth/line-session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated && data.user) {
        console.log('✅ Session API authentication successful:', data.user.name);
        return {
          success: true,
          user: data.user,
          method: 'session'
        };
      }
    }
    
    console.log('❌ Session API authentication failed');
    return {
      success: false,
      error: 'No valid session',
      method: 'session'
    };
  } catch (error) {
    console.error('❌ Session API error:', error);
    return {
      success: false,
      error: 'Session check failed',
      method: 'session'
    };
  }
};

/**
 * ลอง LIFF Authentication (เป็น fallback เท่านั้น)
 */
export const tryLiffAuth = async (options: AuthOptions = {}): Promise<AuthResult> => {
  try {
    console.log('📱 Attempting LIFF authentication as fallback...');
    
    // ตรวจสอบ LIFF SDK
    if (!isLiffAvailable()) {
      console.log('⚠️ LIFF SDK not available, falling back to session API');
      return await checkSessionAuth();
    }
    
    // Initialize LIFF (with timeout and fallback)
    const initResult = await initializeLiffWithFallback();
    if (!initResult.success) {
      console.log('⚠️ LIFF initialization failed, falling back to session API');
      return await checkSessionAuth();
    }
    
    // ตรวจสอบ login status
    if (!window.liff.isLoggedIn()) {
      console.log('🔐 LIFF not logged in, checking session API first...');
      const sessionFallback = await checkSessionAuth();
      if (sessionFallback.success) {
        return sessionFallback;
      }
      
      return {
        success: false,
        needsRedirect: true,
        redirectUrl: buildLineLoginUrl(options),
        error: 'LIFF login required',
        method: 'liff'
      };
    }
    
    // ได้ access token แล้วส่งไป backend
    const accessToken = window.liff.getAccessToken();
    if (!accessToken) {
      console.log('⚠️ No LIFF access token, falling back to session API');
      return await checkSessionAuth();
    }
    
    // ส่งไป backend เพื่อสร้าง session
    const loginResult = await sendLiffTokenToBackend(accessToken, options);
    return loginResult;
    
  } catch (error) {
    console.error('❌ LIFF authentication error, falling back to session API:', error);
    // เมื่อ LIFF ผิดพลาด ให้ลอง session API แทน
    return await checkSessionAuth();
  }
};

/**
 * Initialize LIFF แบบมี fallback
 */
const initializeLiffWithFallback = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // ตรวจสอบ LIFF ID
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      return { success: false, error: 'LIFF ID not configured' };
    }
    
    // Initialize ด้วย timeout
    try {
      await Promise.race([
        window.liff.init({ liffId }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LIFF init timeout')), 5000)
        )
      ]);
      console.log('✅ LIFF initialized successfully');
      return { success: true };
    } catch (initError) {
      if (initError instanceof Error && initError.message.includes('already initialized')) {
        console.log('✅ LIFF already initialized');
        return { success: true };
      }
      throw initError;
    }
  } catch (error) {
    console.error('❌ LIFF initialization failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'LIFF init failed' 
    };
  }
};

/**
 * ส่ง LIFF token ไป backend
 */
const sendLiffTokenToBackend = async (accessToken: string, options: AuthOptions = {}): Promise<AuthResult> => {
  try {
    console.log('🔗 Sending LIFF token to backend...');
    
    const response = await fetch('/api/auth/line-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        restaurantId: options.restaurantId,
        returnUrl: options.returnUrl
      })
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Backend authentication successful');
      return {
        success: true,
        user: data.user,
        redirectUrl: data.redirectUrl,
        method: 'liff'
      };
    } else {
      return {
        success: false,
        error: data.error || 'Backend authentication failed',
        method: 'liff'
      };
    }
  } catch (error) {
    console.error('❌ Backend authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Backend error',
      method: 'liff'
    };
  }
};

/**
 * Helper Functions
 */
export const isInLineEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isLineApp = userAgent.includes('Line');
  const hasLiffParam = window.location.search.includes('liff=true');
  
  return isLineApp || hasLiffParam;
};

export const isLiffAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.liff;
};

export const loadLiffSdk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isLiffAvailable()) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ LIFF SDK loaded');
      resolve();
    };
    script.onerror = () => {
      console.error('❌ Failed to load LIFF SDK');
      reject(new Error('Failed to load LIFF SDK'));
    };
    document.head.appendChild(script);
  });
};

const buildLoginUrl = (options: AuthOptions): string => {
  const params = new URLSearchParams();
  
  if (options.restaurantId) {
    params.set('restaurant', options.restaurantId);
  }
  
  if (options.returnUrl) {
    params.set('returnUrl', options.returnUrl);
  }
  
  return `/auth/line-signin?${params.toString()}`;
};

const buildLineLoginUrl = (options: AuthOptions): string => {
  const config = getAppConfig();
  
  // ถ้าอยู่ใน LINE environment ให้ลอง LIFF login
  if (isInLineEnvironment()) {
    const params = new URLSearchParams();
    if (options.restaurantId) {
      params.set('restaurant', options.restaurantId);
    }
    return `/liff?${params.toString()}`;
  }
  
  // ถ้าไม่ใช่ LINE environment ให้ไป normal login
  return buildLoginUrl(options);
};

/**
 * Quick Authentication Check (สำหรับใช้ใน components)
 */
export const quickAuthCheck = async (): Promise<{ isAuthenticated: boolean; user?: any }> => {
  try {
    const result = await checkSessionAuth();
    return {
      isAuthenticated: result.success,
      user: result.user
    };
  } catch {
    return { isAuthenticated: false };
  }
};

/**
 * Force Re-authentication
 */
export const forceReauth = async (options: AuthOptions = {}): Promise<AuthResult> => {
  return authenticateUser({ ...options, forceReauth: true });
};

/**
 * Logout (ล้าง session ทั้งหมด)
 */
export const logout = async (): Promise<void> => {
  try {
    // ลบ session จาก backend
    await fetch('/api/auth/line-session', {
      method: 'DELETE',
      credentials: 'include'
    });
    
    // ลบ LIFF session (ถ้ามี)
    if (isLiffAvailable() && window.liff.isLoggedIn && window.liff.isLoggedIn()) {
      try {
        window.liff.logout();
      } catch (liffError) {
        console.warn('⚠️ LIFF logout error:', liffError);
      }
    }
    
    // ลบ localStorage
    try {
      localStorage.removeItem('liff_session_data');
    } catch (storageError) {
      console.warn('⚠️ localStorage clear error:', storageError);
    }
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}; 