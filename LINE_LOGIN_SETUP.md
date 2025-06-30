# การตั้งค่า LINE Login สำหรับระบบ Red Potion

## ขั้นตอนการตั้งค่า LINE Login

### 1. สร้าง LINE Login Channel
1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider ใหม่หรือเลือก Provider ที่มีอยู่
3. สร้าง Channel ใหม่ และเลือกประเภท "LINE Login"
4. กรอกข้อมูลพื้นฐาน:
   - Channel name: Red Potion Customer Login
   - Channel description: สำหรับลูกค้าเข้าสู่ระบบ
   - App type: Web app

### 2. ตั้งค่า Callback URL
ในส่วน "LINE Login settings":
- Callback URL: `http://localhost:3000/api/auth/callback/line` (สำหรับ development)
- Callback URL: `https://yourdomain.com/api/auth/callback/line` (สำหรับ production)

### 3. ขอสิทธิ์เข้าถึง Email (ไม่บังคับ)
1. ไปที่แท็บ "OpenID Connect"
2. ขอสิทธิ์ "Email address permission" (ถ้าต้องการ)
3. ทำตามขั้นตอนการยื่นคำขอ

**หมายเหตุ:** ระบบสามารถทำงานได้โดยไม่ต้องมี email permission โดยจะใช้ LINE User ID สร้าง mock email แทน

### 4. สร้าง LIFF App (สำหรับ LINE App)
1. ใน LINE Developers Console ไปที่ Provider ของคุณ
2. สร้าง Channel ใหม่ประเภท "LINE Front-end Framework"
3. ตั้งค่า LIFF:
   - LIFF app type: Full
   - Endpoint URL: `https://yourdomain.com/liff` (production)
   - Endpoint URL: `http://localhost:3000/liff` (development)
   - Scope: profile, openid
4. คัดลอก LIFF ID ที่ได้

### 5. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` และเพิ่ม:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/redpotion"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generated-by-openssl"

# LINE Login
LINE_CLIENT_ID="your-line-channel-id"
LINE_CLIENT_SECRET="your-line-channel-secret"

# LINE LIFF
NEXT_PUBLIC_LIFF_ID="your-liff-id"
```

### 6. สร้าง Secret Key
รัน command นี้เพื่อสร้าง NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## การใช้งาน

### สำหรับลูกค้า (Customer)
- **ทางเว็บไซต์:** เข้าหน้า `/auth/signin` และคลิก "เข้าสู่ระบบด้วย LINE"
- **ทาง LIFF (LINE App):** เปิด LIFF URL จะ auto redirect ไป `/menu/cmcg20f2i00029hu8p2am75df`
- ระบบจะ auto login ด้วย LINE และสร้าง user account อัตโนมัติด้วย role "USER"

### สำหรับเจ้าของร้าน (Restaurant Owner)
- ยังคงใช้ระบบ email/password เดิม
- เข้าหน้า `/auth/signin` และใช้ form login

## Avatar ในหน้าเมนู
- หากเข้าสู่ระบบแล้ว: แสดง avatar ของผู้ใช้ (คลิกเพื่อ logout)
- หากยังไม่เข้าสู่ระบบ: แสดงไอคอน "?" (คลิกเพื่อ login)

## การทดสอบ
1. เริ่ม development server: `npm run dev`
2. **ทดสอบเว็บไซต์:** ไปที่ `http://localhost:3000/auth/signin` และทดสอบ LINE Login
3. **ทดสอบ LIFF:** 
   - เปิด LIFF URL ใน LINE app
   - หรือเข้า `http://localhost:3000/liff` เพื่อ simulate
   - หรือเข้า `http://localhost:3000/?liff=true` เพื่อทดสอบ auto redirect
4. ตรวจสอบ avatar ในหน้าเมนู `/menu/[restaurantId]`

## การแก้ไขปัญหา

### ปัญหา AccessDenied
หากเกิด error `/auth/error?error=AccessDenied`:

1. **ตรวจสอบ LINE Login Channel:**
   - URL callback ถูกต้อง
   - Channel status เป็น "Published"
   - Scope ไม่ต้องรวม email (ใช้ 'profile openid' เพียงพอ)

2. **ตรวจสอบ Environment Variables:**
   - `LINE_CLIENT_ID` และ `LINE_CLIENT_SECRET` ถูกต้อง
   - `NEXTAUTH_SECRET` ได้ตั้งค่าแล้ว

3. **การอนุญาต:**
   - อนุญาตให้แอปเข้าถึงข้อมูลโปรไฟล์ LINE
   - ไม่ยกเลิกการอนุญาตระหว่างกระบวนการ login

## หมายเหตุ
- LINE Login จะสร้าง user ใหม่เป็น "USER" (customer) เสมอ
- Email login ยังคงใช้ได้สำหรับ restaurant owners และ admins
- Avatar จะแสดงรูปจาก LINE หรือตัวอักษรแรกของชื่อ 