import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const variant = formData.get('variant') as string;

    if (!file) {
      return NextResponse.json({ message: 'ไม่พบไฟล์' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        message: 'ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะรูปภาพ PDF และเอกสาร Word' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit for documents)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        message: 'ขนาดไฟล์ต้องไม่เกิน 10MB' 
      }, { status: 400 });
    }

    // Generate file path
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = path.extname(file.name);
    const fileName = `${category}_${timestamp}_${randomString}${fileExtension}`;
    
    // Create upload directory structure
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents', category);
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }

    const filePath = path.join(uploadDir, fileName);
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    
    // Return the public URL
    const publicUrl = `/uploads/documents/${category}/${fileName}`;
    
    return NextResponse.json({
      message: 'อัพโหลดไฟล์สำเร็จ',
      url: publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์' },
      { status: 500 }
    );
  }
} 