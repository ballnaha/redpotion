/**
 * LIFF SDK Loader - ระบบโหลด LIFF SDK ที่เสถียรและไม่แสดง error ที่ไม่จำเป็น
 * Version 2.0 - ปรับปรุงให้ทำงานร่วมกับ layout preload
 */

interface LiffLoadResult {
  success: boolean;
  error?: string;
  retry?: boolean;
}

interface LiffInitResult {
  success: boolean;
  error?: string;
  alreadyInitialized?: boolean;
}

// Global state สำหรับติดตาม loading status
let liffLoadingPromise: Promise<LiffLoadResult> | null = null;
let liffSDKLoaded = false;
let liffInitialized = false;

/**
 * ตรวจสอบว่า LIFF SDK พร้อมใช้งานหรือไม่
 */
export const isLiffSDKAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.liff && liffSDKLoaded;
};

/**
 * รอให้ LIFF SDK โหลดเสร็จจาก layout หรือโหลดเอง
 */
export const ensureLiffSDKLoaded = async (maxRetries: number = 3): Promise<LiffLoadResult> => {
  // ถ้าโหลดแล้วให้ return ทันที
  if (liffSDKLoaded && isLiffSDKAvailable()) {
    return { success: true };
  }

  // ตรวจสอบว่ามี LIFF SDK ใน window แล้วหรือไม่ (จาก layout)
  if (typeof window !== 'undefined' && window.liff) {
    console.log('✅ LIFF SDK already available from layout');
    liffSDKLoaded = true;
    return { success: true };
  }

  // ถ้ากำลังโหลดอยู่ ให้รอ Promise เดิม
  if (liffLoadingPromise) {
    return await liffLoadingPromise;
  }

      // รอให้ layout โหลด SDK เสร็จก่อน (รอสูงสุด 3 วินาที) แบบ parallel
    const layoutPromise = waitForLayoutLiffSDK(3000);
    const manualPromise = new Promise<LiffLoadResult>((resolve) => {
      // เริ่มโหลด manual หลังจาก 1 วินาที ถ้า layout ยังไม่เสร็จ
      setTimeout(async () => {
        console.log('🔄 Starting parallel manual LIFF loading...');
        const result = await loadLiffSDKWithRetry(maxRetries);
        resolve(result);
      }, 1000);
    });
    
    // รอให้ Promise ใดก็ได้ที่เสร็จก่อน (parallel loading)
    liffLoadingPromise = Promise.race([layoutPromise, manualPromise]);
    
    try {
      const result = await liffLoadingPromise;
      if (result.success) {
        liffSDKLoaded = true;
        return result;
      }
      
      // ถ้าทั้งคู่ไม่สำเร็จ ลองอีกครั้ง
      console.log('🔄 Both layout and manual loading failed, final retry...');
      const finalRetry = await loadLiffSDKWithRetry(1);
      if (finalRetry.success) {
        liffSDKLoaded = true;
      }
      return finalRetry;
    } finally {
      // ล้าง Promise หลังจากเสร็จแล้ว
      liffLoadingPromise = null;
    }
};

/**
 * รอให้ layout โหลด LIFF SDK เสร็จ - ปรับปรุงความเร็ว
 */
const waitForLayoutLiffSDK = async (timeout: number = 3000): Promise<LiffLoadResult> => {
  return new Promise((resolve) => {
    // ตรวจสอบว่ามี SDK แล้วหรือไม่
    if (typeof window !== 'undefined' && window.liff) {
      console.log('✅ LIFF SDK already loaded by layout');
      resolve({ success: true });
      return;
    }

    let resolved = false;
    
    // Listen for SDK load success
    const handleSuccess = () => {
      if (!resolved) {
        resolved = true;
        console.log('✅ LIFF SDK loaded by layout successfully');
        window.removeEventListener('liffSDKLoaded', handleSuccess);
        window.removeEventListener('liffSDKError', handleError);
        resolve({ success: true });
      }
    };

    // Listen for SDK load error
    const handleError = () => {
      if (!resolved) {
        resolved = true;
        console.warn('⚠️ LIFF SDK loading by layout failed');
        window.removeEventListener('liffSDKLoaded', handleSuccess);
        window.removeEventListener('liffSDKError', handleError);
        resolve({ success: false, error: 'Layout LIFF load failed', retry: true });
      }
    };

    window.addEventListener('liffSDKLoaded', handleSuccess);
    window.addEventListener('liffSDKError', handleError);

    // ลด timeout เพื่อความเร็ว
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('⚠️ LIFF SDK layout load timeout (3s)');
        window.removeEventListener('liffSDKLoaded', handleSuccess);
        window.removeEventListener('liffSDKError', handleError);
        resolve({ success: false, error: 'Layout LIFF load timeout', retry: true });
      }
    }, timeout);
  });
};

/**
 * โหลด LIFF SDK พร้อม retry mechanism (fallback method)
 */
const loadLiffSDKWithRetry = async (maxRetries: number): Promise<LiffLoadResult> => {
  // ตรวจสอบว่ามี SDK อยู่แล้วหรือไม่
  if (typeof window !== 'undefined' && window.liff) {
    console.log('✅ LIFF SDK already available');
    liffSDKLoaded = true;
    return { success: true };
  }

  console.log('📦 Loading LIFF SDK manually...');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await loadLiffScript();
      
      // รอให้ SDK พร้อมใช้งาน
      await waitForLiffReady(5000); // รอสูงสุด 5 วินาที
      
      if (isLiffSDKAvailable()) {
        console.log('✅ LIFF SDK loaded successfully');
        liffSDKLoaded = true;
        return { success: true };
      } else {
        throw new Error('LIFF SDK not available after loading');
      }
    } catch (error) {
      console.warn(`⚠️ LIFF SDK loading attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('❌ All LIFF SDK loading attempts failed');
        return { 
          success: false, 
          error: 'Failed to load LIFF SDK after all retry attempts',
          retry: false 
        };
      }
      
      // รอก่อนลองใหม่ (progressive backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  return { 
    success: false, 
    error: 'Maximum retry attempts exceeded',
    retry: false 
  };
};

/**
 * โหลด LIFF script จาก CDN
 */
const loadLiffScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // ลบ script เก่าออกก่อน (ถ้ามี)
    const existingScripts = document.querySelectorAll('script[src*="liff/edge"], script[data-liff-sdk]');
    existingScripts.forEach(script => script.remove());

    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.liffSdk = 'manual';
    
    script.onload = () => {
      console.log('📦 LIFF script loaded manually');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('❌ LIFF script loading failed:', error);
      
      // ลอง backup URL
      const backupScript = document.createElement('script');
      backupScript.src = 'https://static.line-scdn.net/liff/edge/versions/2.22.3/sdk.js';
      backupScript.async = true;
      backupScript.crossOrigin = 'anonymous';
      backupScript.dataset.liffSdk = 'manual-backup';
      
      backupScript.onload = () => {
        console.log('📦 LIFF backup script loaded');
        resolve();
      };
      
      backupScript.onerror = () => {
        reject(new Error('Failed to load LIFF script from both primary and backup CDN'));
      };
      
      document.head.appendChild(backupScript);
    };
    
    document.head.appendChild(script);
  });
};

/**
 * รอให้ LIFF SDK พร้อมใช้งาน
 */
const waitForLiffReady = (timeout: number = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkReady = () => {
      if (typeof window !== 'undefined' && window.liff) {
        console.log('✅ LIFF SDK ready');
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('LIFF SDK ready timeout'));
        return;
      }
      
      setTimeout(checkReady, 100);
    };
    
    checkReady();
  });
};

/**
 * Initialize LIFF แบบ Smart Init พร้อม error handling ที่ดี
 */
export const smartInitializeLiff = async (liffId: string, maxRetries: number = 3): Promise<LiffInitResult> => {
  // ตรวจสอบว่า SDK โหลดแล้วหรือไม่
  if (!isLiffSDKAvailable()) {
    const loadResult = await ensureLiffSDKLoaded();
    if (!loadResult.success) {
      return { 
        success: false, 
        error: loadResult.error || 'LIFF SDK not available' 
      };
    }
  }

  // ถ้า initialize แล้วให้ return ทันที
  if (liffInitialized) {
    try {
      // ทดสอบว่าใช้งานได้จริงหรือไม่
      window.liff.isLoggedIn();
      console.log('✅ LIFF already initialized and working');
      return { success: true, alreadyInitialized: true };
    } catch (error) {
      console.warn('⚠️ LIFF object exists but not working, re-initializing...');
      liffInitialized = false;
    }
  }

  console.log('🚀 Initializing LIFF with ID:', liffId);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await window.liff.init({ liffId });
      console.log('✅ LIFF initialized successfully');
      liffInitialized = true;
      return { success: true };
    } catch (error) {
      console.warn(`⚠️ LIFF init attempt ${attempt}/${maxRetries}:`, error);
      
      if (error instanceof Error) {
        // Already initialized - ถือว่าสำเร็จ
        if (error.message.includes('already initialized') || 
            error.message.includes('LIFF has already been initialized')) {
          console.log('✅ LIFF already initialized');
          liffInitialized = true;
          return { success: true, alreadyInitialized: true };
        }

        // Invalid LIFF ID - ไม่ต้อง retry
        if (error.message.includes('invalid liff id') || 
            error.message.includes('Invalid LIFF ID')) {
          return { 
            success: false, 
            error: `Invalid LIFF ID: ${liffId}. Please check your LIFF configuration.` 
          };
        }

        // Network errors - ลอง retry
        if (error.message.includes('timeout') || 
            error.message.includes('network') ||
            error.message.includes('failed to fetch')) {
          if (attempt === maxRetries) {
            return { 
              success: false, 
              error: 'Network error: Unable to connect to LINE servers. Please check your internet connection.' 
            };
          }
          // รอก่อนลองใหม่
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
      
      if (attempt === maxRetries) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown LIFF initialization error' 
        };
      }
      
      // รอก่อนลองใหม่
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }

  return { success: false, error: 'Failed to initialize LIFF after all retry attempts' };
};

/**
 * ระบบ Graceful LIFF Loading - ไม่แสดง error ที่ไม่จำเป็น
 */
export const gracefulLiffOperation = async <T>(
  operation: () => Promise<T>,
  fallback: () => T,
  options: {
    silent?: boolean;
    retryCount?: number;
    operationName?: string;
  } = {}
): Promise<T> => {
  const { silent = true, retryCount = 2, operationName = 'LIFF operation' } = options;

  try {
    // ตรวจสอบและโหลด LIFF SDK
    const loadResult = await ensureLiffSDKLoaded();
    if (!loadResult.success) {
      if (!silent) {
        console.warn(`⚠️ ${operationName}: LIFF SDK not available, using fallback`);
      }
      return fallback();
    }

    // ลองทำ operation
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retryCount) {
          if (!silent) {
            console.warn(`⚠️ ${operationName}: All attempts failed, using fallback:`, error);
          }
          return fallback();
        }
        
        if (!silent) {
          console.warn(`⚠️ ${operationName}: Attempt ${attempt} failed, retrying...`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }

    return fallback();
  } catch (error) {
    if (!silent) {
      console.warn(`⚠️ ${operationName}: Unexpected error, using fallback:`, error);
    }
    return fallback();
  }
};

/**
 * Reset LIFF state (สำหรับ testing หรือ recovery)
 */
export const resetLiffState = () => {
  liffSDKLoaded = false;
  liffInitialized = false;
  liffLoadingPromise = null;
  
  // ลบ LIFF object ออกจาก window (ถ้ามี)
  if (typeof window !== 'undefined' && window.liff) {
    try {
      delete (window as any).liff;
    } catch (error) {
      console.warn('⚠️ Could not delete LIFF object:', error);
    }
  }
  
  console.log('🔄 LIFF state reset');
}; 