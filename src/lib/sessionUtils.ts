/**
 * LINE Session Management Utilities
 * 
 * ฟังก์ชันสำหรับจัดการ LINE session validation, refresh และ cleanup
 */

interface LineUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  lineUserId: string;
}

interface SessionResponse {
  authenticated: boolean;
  user?: LineUser;
  restaurantId?: string;
  sessionInfo?: {
    expiresIn: number;
    needsRefresh: boolean;
  };
  error?: string;
}

/**
 * ตรวจสอบ LINE session
 */
export const checkLineSession = async (): Promise<SessionResponse> => {
  try {
    const response = await fetch('/api/auth/line-session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache'
    });

    const data = await response.json();
    
    if (response.ok && data.authenticated) {
      console.log('✅ Session valid for:', data.user?.name);
      
      // ถ้า token ใกล้หมดอายุให้ refresh อัตโนมัติ
      if (data.sessionInfo?.needsRefresh) {
        console.log('🔄 Token needs refresh, refreshing automatically...');
        await refreshLineSession();
      }
      
      return data;
    } else {
      console.log('❌ Session invalid:', data.error);
      return { authenticated: false, error: data.error };
    }
  } catch (error) {
    console.error('❌ Session check failed:', error);
    return { authenticated: false, error: 'Session check failed' };
  }
};

/**
 * Refresh LINE session token
 */
export const refreshLineSession = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/line-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'refresh' })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Session refreshed successfully');
      return true;
    } else {
      console.log('❌ Session refresh failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Session refresh error:', error);
    return false;
  }
};

/**
 * Logout และลบ session
 */
export const logoutLineSession = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/line-session', {
      method: 'DELETE'
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Logged out successfully');
      
      // ลบข้อมูลใน localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('line_user_data');
      }
      
      return true;
    } else {
      console.log('❌ Logout failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
    return false;
  }
};

/**
 * ตรวจสอบว่าอยู่ใน LINE environment หรือไม่
 */
export const isInLineEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  return userAgent.includes('Line') || 
         window.location.search.includes('liff=true') ||
         window.location.search.includes('openExternalBrowser=1');
};

/**
 * ตรวจสอบว่า LIFF SDK พร้อมใช้งานหรือไม่
 */
export const isLiffReady = (): boolean => {
  return typeof window !== 'undefined' && !!window.liff;
};

/**
 * รอให้ LIFF SDK โหลดเสร็จ
 */
export const waitForLiff = (timeoutMs: number = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isLiffReady()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isLiffReady()) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        reject(new Error('LIFF SDK load timeout'));
      }
    }, 100);
  });
};

/**
 * Initialize LIFF SDK ด้วย retry mechanism และ validation
 */
export const initializeLiff = async (maxRetries: number = 3): Promise<{ success: boolean; error?: string; liffId?: string }> => {
  // Import validation function
  const { getValidatedLiffId } = await import('./liffUtils');
  const { liffId, error: validationError } = getValidatedLiffId();
  
  if (!liffId) {
    return { 
      success: false, 
      error: validationError || 'No valid LIFF ID available' 
    };
  }

  if (!isLiffReady()) {
    return { 
      success: false, 
      error: 'LIFF SDK not available. Please check if the LIFF script is loaded correctly.' 
    };
  }

  console.log('🔄 Initializing LIFF with ID:', liffId);

  for (let i = 0; i < maxRetries; i++) {
    try {
      await window.liff.init({ liffId });
      console.log('✅ LIFF initialized successfully');
      return { success: true, liffId };
    } catch (error) {
      console.log(`⚠️ LIFF init attempt ${i + 1} failed:`, error);
      
      if (error instanceof Error) {
        // Already initialized error
        if (error.message.includes('already initialized') || 
            error.message.includes('LIFF has already been initialized')) {
          console.log('✅ LIFF already initialized');
          return { success: true, liffId };
        }

        // Invalid LIFF ID error
        if (error.message.includes('invalid liff id') || 
            error.message.includes('Invalid LIFF ID')) {
          return { 
            success: false, 
            error: `Invalid LIFF ID: ${liffId}. Please check your LIFF configuration in LINE Developers Console.` 
          };
        }

        // Network or timeout errors
        if (error.message.includes('timeout') || 
            error.message.includes('network') ||
            error.message.includes('failed to fetch')) {
          if (i === maxRetries - 1) {
            return { 
              success: false, 
              error: `Network error: Unable to connect to LINE servers. Please check your internet connection.` 
            };
          }
        }
      }
      
      if (i === maxRetries - 1) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown LIFF initialization error' 
        };
      }
      
      // รอก่อนลองใหม่ (progressive backoff)
      await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
    }
  }
  
  return { success: false, error: 'Failed to initialize LIFF after all retry attempts' };
};

/**
 * ตรวจสอบและจัดการ LINE authentication flow
 */
export const handleLineAuth = async (restaurantId?: string): Promise<{
  success: boolean;
  redirectUrl?: string;
  error?: string;
}> => {
  try {
    // ตรวจสอบว่าอยู่ใน LINE environment
    if (!isInLineEnvironment()) {
      return {
        success: false,
        error: 'กรุณาเปิดลิงก์นี้ในแอป LINE'
      };
    }

    // รอให้ LIFF SDK โหลด
    await waitForLiff();

    // Initialize LIFF
    const initResult = await initializeLiff();
    if (!initResult.success) {
      return {
        success: false,
        error: initResult.error || 'Failed to initialize LIFF'
      };
    }

    // ตรวจสอบสถานะ login
    if (!window.liff.isLoggedIn()) {
      window.liff.login();
      return { success: false, error: 'Redirecting to LINE login' };
    }

    // ได้ access token
    const accessToken = window.liff.getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลการยืนยันตัวตนได้'
      };
    }

    // ส่งไปยัง backend
    const response = await fetch('/api/auth/line-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        restaurantId
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        redirectUrl: data.redirectUrl
      };
    } else {
      return {
        success: false,
        error: data.error || 'Authentication failed'
      };
    }

  } catch (error) {
    console.error('❌ LINE auth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * สร้าง session checker ที่ทำงานเป็นระยะ
 */
export const createSessionChecker = (intervalMs: number = 5 * 60 * 1000) => {
  let intervalId: NodeJS.Timeout | null = null;

  const start = () => {
    if (intervalId) return; // ป้องกันการสร้างหลาย interval

    intervalId = setInterval(async () => {
      const sessionResult = await checkLineSession();
      
      if (!sessionResult.authenticated) {
        console.log('⚠️ Session expired, need re-authentication');
        // ส่ง event เพื่อแจ้งให้ component ทราบ
        window.dispatchEvent(new CustomEvent('lineSessionExpired'));
      }
    }, intervalMs);

    console.log('🔄 Session checker started, interval:', intervalMs / 1000, 'seconds');
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log('⏹️ Session checker stopped');
    }
  };

  return { start, stop };
};

/**
 * LIFF Session Persistence Utilities
 */

interface LiffSessionData {
  accessToken: string;
  userProfile: any;
  restaurantId?: string;
  timestamp: number;
  expiresAt: number;
}

const LIFF_SESSION_KEY = 'liff_session_data';
const LIFF_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * บันทึก LIFF session ลง localStorage
 */
export const saveLiffSession = (accessToken: string, userProfile: any, restaurantId?: string): void => {
  try {
    const sessionData: LiffSessionData = {
      accessToken,
      userProfile,
      restaurantId,
      timestamp: Date.now(),
      expiresAt: Date.now() + LIFF_SESSION_DURATION
    };
    
    localStorage.setItem(LIFF_SESSION_KEY, JSON.stringify(sessionData));
    console.log('💾 LIFF session saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save LIFF session:', error);
  }
};

/**
 * โหลด LIFF session จาก localStorage
 */
export const loadLiffSession = (): LiffSessionData | null => {
  try {
    const stored = localStorage.getItem(LIFF_SESSION_KEY);
    if (!stored) return null;
    
    const sessionData: LiffSessionData = JSON.parse(stored);
    
    // ตรวจสอบว่า session หมดอายุหรือไม่
    if (Date.now() > sessionData.expiresAt) {
      console.log('⏰ LIFF session expired, removing...');
      localStorage.removeItem(LIFF_SESSION_KEY);
      return null;
    }
    
    console.log('📋 LIFF session loaded from localStorage');
    return sessionData;
  } catch (error) {
    console.error('❌ Failed to load LIFF session:', error);
    localStorage.removeItem(LIFF_SESSION_KEY);
    return null;
  }
};

/**
 * ลบ LIFF session จาก localStorage
 */
export const clearLiffSession = (): void => {
  try {
    localStorage.removeItem(LIFF_SESSION_KEY);
    console.log('🗑️ LIFF session cleared');
  } catch (error) {
    console.error('❌ Failed to clear LIFF session:', error);
  }
};

/**
 * ตรวจสอบและ restore LIFF session หลัง refresh
 */
export const restoreLiffSession = async (): Promise<{
  success: boolean;
  sessionData?: LiffSessionData;
  needsReAuth?: boolean;
}> => {
  try {
    // โหลด session จาก localStorage
    const sessionData = loadLiffSession();
    if (!sessionData) {
      return { success: false, needsReAuth: true };
    }
    
    console.log('🔄 Attempting to restore LIFF session...');
    
    // ตรวจสอบ session กับ backend
    const response = await fetch('/api/auth/line-session');
    const backendSession = await response.json();
    
    if (response.ok && backendSession.authenticated) {
      console.log('✅ LIFF session restored successfully');
      return { success: true, sessionData };
    } else {
      console.log('❌ Backend session invalid, need re-authentication');
      clearLiffSession();
      return { success: false, needsReAuth: true };
    }
  } catch (error) {
    console.error('❌ Failed to restore LIFF session:', error);
    clearLiffSession();
    return { success: false, needsReAuth: true };
  }
};

/**
 * อัพเดท LIFF session timestamp
 */
export const refreshLiffSessionTimestamp = (): void => {
  try {
    const sessionData = loadLiffSession();
    if (sessionData) {
      sessionData.timestamp = Date.now();
      sessionData.expiresAt = Date.now() + LIFF_SESSION_DURATION;
      localStorage.setItem(LIFF_SESSION_KEY, JSON.stringify(sessionData));
      console.log('🔄 LIFF session timestamp refreshed');
    }
  } catch (error) {
    console.error('❌ Failed to refresh LIFF session timestamp:', error);
  }
}; 