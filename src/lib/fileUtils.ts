import { stat } from 'fs/promises';
import path from 'path';

/**
 * ตรวจสอบว่าไฟล์มีอยู่จริงใน uploads folder หรือไม่
 * @param imageUrl - URL ของรูปภาพ (เช่น /uploads/restaurants/xxx/menu/yyy.jpg)
 * @returns Promise<boolean>
 */
export async function checkFileExists(imageUrl: string): Promise<boolean> {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
    return false;
  }

  try {
    // Extract relative path from URL
    const relativePath = imageUrl.replace('/uploads/', '');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);
    
    // Check if file exists
    await stat(fullPath);
    return true;
  } catch (error) {
    console.warn('⚠️ File not found:', imageUrl);
    return false;
  }
}

/**
 * สร้าง absolute path สำหรับไฟล์ในโฟลเดอร์ uploads
 * @param relativePath - path สัมพัทธ์ใน uploads folder
 * @returns string - absolute path
 */
export function getUploadsPath(relativePath: string): string {
  return path.join(process.cwd(), 'public', 'uploads', relativePath);
}

/**
 * สร้าง public URL สำหรับไฟล์ uploads
 * @param relativePath - path สัมพัทธ์ใน uploads folder
 * @returns string - public URL
 */
export function getUploadsUrl(relativePath: string): string {
  return `/uploads/${relativePath}`;
}

/**
 * ตรวจสอบและสร้าง fallback URL สำหรับรูปภาพที่ไม่มีอยู่
 * @param imageUrl - URL ของรูปภาพ
 * @param fallbackUrl - URL สำรอง (default: /images/default_restaurant.jpg)
 * @returns Promise<string> - URL ที่ใช้งานได้
 */
export async function getValidImageUrl(
  imageUrl: string | null, 
  fallbackUrl: string = '/images/default_restaurant.jpg'
): Promise<string> {
  if (!imageUrl) {
    return fallbackUrl;
  }

  // ถ้าเป็น external URL ให้ใช้เลย
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
  const exists = await checkFileExists(imageUrl);
  return exists ? imageUrl : fallbackUrl;
}

/**
 * Extract restaurant ID จาก image URL
 * @param imageUrl - URL ของรูปภาพ
 * @returns string | null - restaurant ID หรือ null ถ้าหาไม่เจอ
 */
export function extractRestaurantIdFromImageUrl(imageUrl: string): string | null {
  if (!imageUrl || !imageUrl.startsWith('/uploads/restaurants/')) {
    return null;
  }

  const match = imageUrl.match(/\/uploads\/restaurants\/([^\/]+)\//);
  return match ? match[1] : null;
} 