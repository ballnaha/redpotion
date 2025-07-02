import { NextRequest, NextResponse } from 'next/server';
import { stat, readdir } from 'fs/promises';
import path from 'path';
import { checkFileExists } from '@/lib/fileUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ 
        error: 'Missing path parameter',
        usage: '/api/debug/file-status?path=/uploads/restaurants/xxx/menu/yyy.jpg'
      }, { status: 400 });
    }

    const result: any = {
      requestedPath: filePath,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
    const exists = await checkFileExists(filePath);
    result.fileExists = exists;

    if (filePath.startsWith('/uploads/')) {
      const relativePath = filePath.replace('/uploads/', '');
      const fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);
      
      result.fullPath = fullPath;
      result.relativePath = relativePath;

      try {
        const stats = await stat(fullPath);
        result.fileStats = {
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
        };
      } catch (error) {
        result.error = `File not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      // ตรวจสอบโฟลเดอร์แม่
      try {
        const dirPath = path.dirname(fullPath);
        const dirContents = await readdir(dirPath);
        result.parentDirectory = {
          path: dirPath,
          contents: dirContents.slice(0, 10), // แสดงแค่ 10 ไฟล์แรก
          totalFiles: dirContents.length
        };
      } catch (error) {
        result.parentDirectoryError = error instanceof Error ? error.message : 'Unknown error';
      }

      // ตรวจสอบว่า public/uploads directory มีอยู่หรือไม่
      try {
        const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
        const uploadsStats = await stat(uploadsPath);
        result.uploadsDirectory = {
          exists: true,
          path: uploadsPath,
          isDirectory: uploadsStats.isDirectory()
        };
      } catch (error) {
        result.uploadsDirectory = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Debug file status error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ 
        error: 'Missing imageUrl in request body'
      }, { status: 400 });
    }

    const exists = await checkFileExists(imageUrl);
    
    return NextResponse.json({
      imageUrl,
      exists,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });

  } catch (error) {
    console.error('Debug file check error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 