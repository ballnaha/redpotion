import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { lookup } from 'mime-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path
    const filePath = params.path.join('/');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    
    console.log('📁 Uploads API request:', {
      requestedPath: filePath,
      fullPath: fullPath,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 100),
    });
    
    // Security check: make sure the path is within uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const resolvedPath = path.resolve(fullPath);
    
    if (!resolvedPath.startsWith(uploadsDir)) {
      console.warn('🚫 Security violation - path outside uploads directory:', {
        requestedPath: filePath,
        resolvedPath: resolvedPath,
        uploadsDir: uploadsDir
      });
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    let fileStats;
    try {
      fileStats = await stat(resolvedPath);
      console.log('✅ File found:', {
        path: filePath,
        size: fileStats.size,
        modified: fileStats.mtime.toISOString()
      });
    } catch (error) {
      console.warn('❌ File not found:', {
        requestedPath: filePath,
        fullPath: resolvedPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return new NextResponse('File not found', { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(resolvedPath);
    
    // Get MIME type
    const mimeType = lookup(resolvedPath) || 'application/octet-stream';
    
    console.log('📤 Serving file:', {
      path: filePath,
      mimeType: mimeType,
      size: fileBuffer.length
    });
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Last-Modified': fileStats.mtime.toUTCString(),
        'ETag': `"${fileStats.size}-${fileStats.mtime.getTime()}"`,
      },
    });

  } catch (error) {
    console.error('❌ Error serving upload file:', {
      requestedPath: params.path.join('/'),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 