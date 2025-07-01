# การแก้ไขปัญหา OAuthCreateAccount Error ใน LINE Login

## สรุปปัญหา
จาก URL: `http://localhost:3000/auth/signin?callbackUrl=...&error=OAuthCreateAccount` 
และ LINE auth endpoint status = 0

## สาเหตุหลัก
1. **PrismaAdapter Conflict**: PrismaAdapter พยายามสร้าง user อัตโนมัติ แต่ขัดแย้งกับ custom signIn callback
2. **Database Schema Constraint**: User.email เป็น required (String) แต่ LINE ไม่ได้ส่ง email เสมอ
3. **Type Compatibility**: NextAuth type definitions ไม่รองรับ null email values

## การแก้ไขที่ดำเนินการ

### 1. ปิดการใช้ PrismaAdapter
```typescript
// เปลี่ยนจาก
adapter: process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined,

// เป็น
// adapter: process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined,
```

### 2. แก้ไข Database Schema
```prisma
model User {
  id            String      @id @default(cuid())
  name          String?
  email         String?     @unique  // เปลี่ยนจาก String เป็น String?
  emailVerified DateTime?
  image         String?
  password      String?
  role          UserRole    @default(USER)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  accounts      Account[]
  restaurant    Restaurant?
  sessions      Session[]
}
```

### 3. ปรับปรุง Custom SignIn Callback
```typescript
async signIn({ user, account, profile, email, credentials }) {
  if (account?.provider === 'line') {
    try {
      const lineUserId = account?.providerAccountId || user?.id;
      
      // ตรวจสอบ existing user ด้วย LINE account
      let existingUser = await prisma.user.findFirst({
        where: {
          accounts: {
            some: {
              provider: 'line',
              providerAccountId: lineUserId
            }
          }
        },
        include: { accounts: true }
      });

      if (existingUser) {
        return true;
      }
      
      // สร้าง user ใหม่พร้อม Account record
      const newUser = await prisma.user.create({
        data: {
          name: user.name || `LINE User ${lineUserId.slice(-6)}`,
          email: user.email || null, // อนุญาตให้เป็น null
          image: user.image,
          role: 'USER',
          emailVerified: user.email ? new Date() : null
        }
      });
      
      // สร้าง Account record แยก
      await prisma.account.create({
        data: {
          userId: newUser.id,
          type: 'oauth',
          provider: 'line',
          providerAccountId: lineUserId,
          // ... other fields
        }
      });
      
      return true;
    } catch (error) {
      // Error handling
      return '/auth/error?error=OAuthCallback&error_description=Database+error';
    }
  }
  return true;
}
```

### 4. แก้ไข JWT Callback
```typescript
async jwt({ token, user, account, profile }) {
  // สำหรับ LINE users ให้ดึงข้อมูลจาก database
  if (account?.provider === 'line') {
    try {
      let dbUser = await prisma.user.findFirst({
        where: {
          accounts: {
            some: {
              provider: 'line',
              providerAccountId: account.providerAccountId
            }
          }
        },
        include: { restaurant: true }
      });
      
      if (dbUser) {
        token.role = dbUser.role;
        token.restaurantId = dbUser.restaurant?.id;
        if (dbUser.email) {
          token.email = dbUser.email;
        }
      }
    } catch (error) {
      // Fallback to JWT-only
      token.role = 'USER';
    }
  }
  return token;
}
```

## ผลลัพธ์ที่คาดหวัง
1. ✅ LINE Login จะทำงานโดยไม่ต้องมี email
2. ✅ User สามารถสร้างได้แม้ไม่มี email จาก LINE
3. ✅ Account linking ทำงานถูกต้อง
4. ✅ ไม่มี OAuthCreateAccount error อีกต่อไป

## การทดสอบ
1. ไปที่ `http://localhost:3000/debug-line`
2. คลิก "ทดสอบ LINE Login จริง"
3. ตรวจสอบว่าไม่มี error=OAuthCreateAccount

## หมายเหตุ
- การแก้ไขนี้ทำให้ระบบไม่ depend บน PrismaAdapter อีกต่อไป
- ใช้ custom user management เต็มรูปแบบ
- รองรับ LINE users ที่ไม่มี email address
- Fallback กลับไป JWT-only session ถ้ามีปัญหา database

## Progress Log
- **27 ธันวาคม 2024 11:00**: แก้ไข OAuthCreateAccount error
- **27 ธันวาคม 2024 14:45**: เพิ่ม auto email generation
- **27 ธันวาคม 2024 14:50**: แก้ไข OAuthCallback error ด้วย enhanced error handling

## Status ปัจจุบัน
- ✅ Server: Running (Status 200)
- ✅ Debug Page: Working (Status 200) 
- ✅ Error Detection: Enhanced with URL parameter checking
- ⚠️ **ตรวจสอบ server console logs เพื่อดู error details ของ OAuthCallback**

## วันที่อัปเดต
27 ธันวาคม 2024 (14:50) 