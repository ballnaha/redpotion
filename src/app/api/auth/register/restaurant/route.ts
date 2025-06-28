import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const {
      // Personal info
      name,
      email,
      password,
      
      // Restaurant info
      restaurantName,
      restaurantDescription,
      restaurantAddress,
      restaurantPhone,
      restaurantEmail,
      
      // Business info
      businessType,
      taxId,
      bankAccount,
      bankName,
      
      // Location
      latitude,
      longitude,
      locationName,
      
      // Documents (multi-upload array)
      documents,
    } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !restaurantName || !restaurantAddress || !restaurantPhone) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate documents
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาอัพโหลดเอกสารอย่างน้อย 1 ไฟล์' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate phone number (Thai mobile format)
    const phoneRegex = /^0[6-9]\d{8}$/
    const cleanPhone = restaurantPhone.replace(/\D/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate tax ID (13 digits)
    if (taxId) {
      const cleanTaxId = taxId.replace(/\D/g, '')
      if (cleanTaxId.length !== 13) {
        return NextResponse.json(
          { error: 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก' },
          { status: 400 }
        )
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้แล้ว' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and restaurant in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'RESTAURANT_OWNER'
        }
      })

      // Create restaurant with enhanced data
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          description: restaurantDescription || null,
          address: restaurantAddress,
          phone: cleanPhone, // Use cleaned phone number
          email: restaurantEmail || null,
          ownerId: user.id,
          status: 'PENDING', // ต้องรอการอนุมัติ
          
          // Business information
          businessType: businessType || 'ร้านอาหาร',
          taxId: taxId ? taxId.replace(/\D/g, '') : null,
          bankAccount: bankAccount || null,
          bankName: bankName || null,
          
          // Location information
          latitude: latitude || null,
          longitude: longitude || null,
          locationName: locationName || null,
        }
      })

      // Create documents if provided
      if (documents && Array.isArray(documents) && documents.length > 0) {
        const documentPromises = documents.map((doc: any, index: number) => {
          // Try to determine document type based on order
          let documentType = 'OTHER'

          return tx.document.create({
            data: {
              fileName: doc.fileName || doc.originalName || `document_${index + 1}`,
              fileUrl: doc.url || doc,
              fileSize: doc.fileSize || 0,
              mimeType: doc.mimeType || 'application/octet-stream',
              documentType: documentType as any,
              description: `เอกสารที่ ${index + 1}: ${doc.originalName || doc.fileName || ''}`,
              restaurantId: restaurant.id,
            }
          })
        })
        
        await Promise.all(documentPromises)
      }

      return { user, restaurant }
    })

    return NextResponse.json(
      { 
        message: 'สมัครสมาชิกสำเร็จ ระบบจะตรวจสอบเอกสารและอนุมัติภายใน 1-2 วันทำการ',
        userId: result.user.id,
        restaurantId: result.restaurant.id
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Restaurant registration error:', error)
    
    // Log more detailed error information
    if (error.code) {
      console.error('Error code:', error.code)
    }
    if (error.meta) {
      console.error('Error meta:', error.meta)
    }
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'ข้อมูลนี้ถูกใช้แล้ว กรุณาตรวจสอบอีเมลหรือข้อมูลร้าน' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 