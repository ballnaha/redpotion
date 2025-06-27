import { unlink } from 'fs/promises';
import path from 'path';

/**
 * ลบรูปภาพจาก filesystem
 * @param imageUrl - URL ของรูปภาพที่ต้องการลบ (เช่น /uploads/restaurants/xxx/menu/yyy.jpg)
 */
export async function deleteImageFromFileSystem(imageUrl: string): Promise<void> {
  if (!imageUrl) {
    console.warn('⚠️ No image URL provided for deletion');
    return;
  }

  try {
    // Extract file path from URL (remove /uploads/ prefix)
    const relativePath = imageUrl.replace('/uploads/', '');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);

    // Delete file from filesystem
    await unlink(fullPath);
    console.log('✅ Image file deleted successfully:', fullPath);
  } catch (error) {
    // File might not exist or already deleted - this is okay
    console.warn('⚠️ Could not delete image file (may not exist):', imageUrl, error);
  }
}

/**
 * ลบรูปภาพหลายไฟล์พร้อมกัน
 * @param imageUrls - Array ของ URLs ที่ต้องการลบ
 */
export async function deleteMultipleImages(imageUrls: (string | null | undefined)[]): Promise<void> {
  const validUrls = imageUrls.filter(Boolean) as string[];
  
  if (validUrls.length === 0) {
    console.warn('⚠️ No valid image URLs provided for deletion');
    return;
  }

  console.log(`🗑️ Deleting ${validUrls.length} image files...`);
  
  const deletePromises = validUrls.map(url => deleteImageFromFileSystem(url));
  await Promise.allSettled(deletePromises);
} 