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
 * Initialize LIFF SDK ด้วย retry mechanism
 */
export const initializeLiff = async (liffId: string, maxRetries: number = 3): Promise<boolean> => {
  if (!liffId) {
    throw new Error('LIFF ID is required');
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      await window.liff.init({ liffId });
      console.log('✅ LIFF initialized successfully');
      return true;
    } catch (error) {
      console.log(`⚠️ LIFF init attempt ${i + 1} failed:`, error);
      
      if (error instanceof Error && (
          error.message.includes('already initialized') || 
          error.message.includes('LIFF has already been initialized')
        )) {
        console.log('✅ LIFF already initialized');
        return true;
      }
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // รอก่อนลองใหม่
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
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
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2007609360-3Z0L8Ekg';
    await initializeLiff(liffId);

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