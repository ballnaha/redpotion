/**
 * LIFF URL Utilities
 * 
 * ฟังก์ชันสำหรับสร้างและจัดการ LIFF URL
 */

/**
 * LIFF Configuration and Validation
 */

/**
 * ตรวจสอบ format ของ LIFF ID
 */
export function validateLiffId(liffId: string): { valid: boolean; error?: string } {
  if (!liffId) {
    return { valid: false, error: 'LIFF ID is required' };
  }

  // LIFF ID format: nnnnnnnnnn-xxxxxxxx (10 digits - 8 characters)
  const liffIdPattern = /^\d{10}-[a-zA-Z0-9]{8}$/;
  
  if (!liffIdPattern.test(liffId)) {
    return { 
      valid: false, 
      error: 'Invalid LIFF ID format. Expected format: 1234567890-AbCdEfGh' 
    };
  }

  return { valid: true };
}

/**
 * ดึง LIFF ID ที่ validated
 */
export function getValidatedLiffId(): { liffId: string | null; error?: string } {
  const envLiffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const fallbackLiffId = '2007609360-3Z0L8Ekg'; // Default for development

  // ลองใช้ LIFF ID จาก environment variable ก่อน
  if (envLiffId) {
    const validation = validateLiffId(envLiffId);
    if (validation.valid) {
      return { liffId: envLiffId };
    } else {
      console.error('❌ Invalid LIFF ID in environment variable:', validation.error);
      console.log('🔄 Falling back to development LIFF ID');
    }
  }

  // ถ้าไม่มีใน env หรือ invalid ให้ใช้ fallback
  const fallbackValidation = validateLiffId(fallbackLiffId);
  if (fallbackValidation.valid) {
    console.warn('⚠️ Using fallback LIFF ID for development');
    return { liffId: fallbackLiffId };
  }

  return { 
    liffId: null, 
    error: 'No valid LIFF ID available. Please set NEXT_PUBLIC_LIFF_ID environment variable.' 
  };
}

/**
 * สร้าง LIFF URL สำหรับร้านอาหาร
 */
export function createLiffUrl(restaurantId: string): string {
  const { liffId } = getValidatedLiffId();
  if (!liffId) {
    throw new Error('Invalid LIFF ID configuration');
  }
  return `https://liff.line.me/${liffId}?restaurant=${restaurantId}`;
}

/**
 * สร้าง LIFF URL พร้อม parameters เพิ่มเติม
 */
export function createLiffUrlWithParams(restaurantId: string, additionalParams: Record<string, string> = {}): string {
  const { liffId } = getValidatedLiffId();
  if (!liffId) {
    throw new Error('Invalid LIFF ID configuration');
  }
  const params = new URLSearchParams({
    restaurant: restaurantId,
    ...additionalParams
  });
  
  return `https://liff.line.me/${liffId}?${params.toString()}`;
}

/**
 * ตรวจสอบว่า URL เป็น LIFF URL หรือไม่
 */
export function isLiffUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'liff.line.me';
  } catch {
    return false;
  }
}

/**
 * ดึง restaurant ID จาก LIFF URL
 */
export function getRestaurantIdFromLiffUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('restaurant');
  } catch {
    return null;
  }
}

/**
 * สร้าง fallback URL สำหรับกรณีที่ไม่อยู่ใน LINE
 */
export function createFallbackUrl(restaurantId: string): string {
  return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/menu/${restaurantId}?liff=true`;
}

/**
 * สร้าง QR Code URL สำหรับ LIFF
 */
export function createQRCodeUrl(restaurantId: string): string {
  const liffUrl = createLiffUrl(restaurantId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(liffUrl)}`;
}

/**
 * ตรวจสอบว่าอยู่ใน LIFF environment หรือไม่
 */
export function isInLiffEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isLineApp = userAgent.includes('Line');
  const hasLiffParam = window.location.search.includes('liff=true');
  const isLiffDomain = window.location.hostname === 'liff.line.me';
  
  return isLineApp || hasLiffParam || isLiffDomain;
}

/**
 * สร้าง share URL สำหรับแชร์ร้านอาหาร
 */
export function createShareUrl(restaurantId: string, restaurantName: string): {
  liffUrl: string;
  webUrl: string;
  message: string;
} {
  const liffUrl = createLiffUrl(restaurantId);
  const webUrl = createFallbackUrl(restaurantId);
  const message = `🍽️ สั่งอาหารจาก ${restaurantName}\n\n📱 เปิดใน LINE: ${liffUrl}\n🌐 เปิดในเว็บ: ${webUrl}`;
  
  return {
    liffUrl,
    webUrl,
    message
  };
} 