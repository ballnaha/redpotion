import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' }, { status: 403 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const variant = formData.get('variant') as string;

    if (!file) {
      return NextResponse.json({ message: 'ไม่พบไฟล์รูปภาพ' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'ขนาดไฟล์ต้องไม่เกิน 5MB' }, { status: 400 });
    }

    // Get restaurant data
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id
      }
    });

    if (!restaurant) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลร้าน' }, { status: 404 });
    }

    // Generate organized file path structure
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = 'jpg'; // Always convert to JPG for consistency
    
    // Organized folder structure: restaurants/{restaurantId}/{category}/
    const restaurantFolder = restaurant.id;
    const categoryFolder = category || 'general';
    const folder = `restaurants/${restaurantFolder}/${categoryFolder}`;
    const fileName = `${variant || 'image'}_${timestamp}_${random}.${extension}`;
    const fullPath = `${folder}/${fileName}`;

    // Log organized structure for debugging
    console.log('📁 Organized folder structure:', {
      restaurantId: restaurantFolder,
      category: categoryFolder,
      variant: variant,
      folder: folder,
      fileName: fileName,
      fullPath: fullPath
    });

    // Save file to public/uploads folder with resizing
    try {
      // Get file buffer
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // Create full directory path
      const publicPath = path.join(process.cwd(), 'public', 'uploads', folder);
      
      // Create directories if they don't exist
      await mkdir(publicPath, { recursive: true });
      
      // Create full file path
      const filePath = path.join(publicPath, fileName);
      
      // Configure image processing based on variant and category
      let processedBuffer: Buffer;
      
      if (variant === 'banner' || category === 'banner') {
        // Banner image: resize to 1200x675 (16:9 aspect ratio) for web optimization
        processedBuffer = await sharp(inputBuffer)
          .resize(1200, 675, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toBuffer();
      } else if (variant === 'gallery' || category === 'gallery') {
        // Gallery image: resize to 1280x720 (16:9 aspect ratio) for gallery display
        processedBuffer = await sharp(inputBuffer)
          .resize(1280, 720, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 90,
            progressive: true 
          })
          .toBuffer();
      } else if (variant === 'avatar' || category === 'profile' || category === 'menu') {
        // Avatar/Profile/Menu image: resize to 400x400 (square)
        processedBuffer = await sharp(inputBuffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toBuffer();
      } else {
        // General: resize to max 800px width while maintaining aspect ratio
        processedBuffer = await sharp(inputBuffer)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toBuffer();
      }
      
      // Write processed file to disk
      await writeFile(filePath, processedBuffer);
      
      // Generate public URL path
      const imageUrl = `/uploads/${folder}/${fileName}`;
      
      console.log('✅ File saved and processed successfully:', {
        filePath: filePath,
        publicUrl: imageUrl,
        originalSize: inputBuffer.length,
        processedSize: processedBuffer.length,
        variant: variant,
        category: category,
        compression: `${((1 - processedBuffer.length / inputBuffer.length) * 100).toFixed(1)}%`
      });

    } catch (saveError) {
      console.error('❌ Failed to save file:', saveError);
      throw new Error('ไม่สามารถบันทึกไฟล์ได้');
    }

    // Generate public URL for the uploaded image
    const imageUrl = `/uploads/${folder}/${fileName}`;

    // Log the organized path structure
    console.log('Image upload path:', fullPath);
    console.log('Restaurant ID:', restaurant.id);
    console.log('Category:', category);
    console.log('Variant:', variant);

    return NextResponse.json({
      success: true,
      imageUrl,
      metadata: {
        restaurantId: restaurantFolder,
        restaurantName: restaurant.name,
        category: categoryFolder,
        variant: variant,
        fileName: fileName,
        folder: folder,
        fullPath: fullPath,
        fileSize: file.size,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัปโหลด' },
      { status: 500 }
    );
  }
}

// Options for handling CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 