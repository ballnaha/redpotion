# การแก้ไขปัญหา LINE Login - Red Potion

## สรุปการปรับปรุง

ฉันได้ปรับปรุงระบบ LINE Login เพื่อแก้ไขปัญหาที่เกิดขึ้น โดยทำการปรับปรุงในส่วนต่างๆ ดังนี้:

### 1. ปรับปรุง NextAuth Configuration (`src/app/api/auth/[...nextauth]/route.ts`)

**เพิ่มเติม:**
- ปรับปรุง LINE Provider configuration
- เพิ่ม `prompt: 'consent'` เพื่อให้แน่ใจว่าผู้ใช้จะต้อง consent ทุกครั้ง
- เพิ่ม `checks: ['state', 'pkce']` เพื่อป้องกัน CSRF attacks
- ระบุ token และ userinfo endpoints ชัดเจน
- เพิ่ม debug logging สำหรับ development
- ปรับปรุง error handling สำหรับ database connection issues
- เพิ่มการตั้งค่า cookies security

**โค้ดที่สำคัญ:**
```javascript
LineProvider({
  clientId: process.env.LINE_CLIENT_ID!,
  clientSecret: process.env.LINE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'profile openid',
      prompt: 'consent'
    }
  },
  checks: ['state', 'pkce'],
  token: 'https://api.line.me/oauth2/v2.1/token',
  userinfo: 'https://api.line.me/v2/profile',
})
```

### 2. ปรับปรุงหน้า Sign In (`src/app/auth/signin/page.tsx`)

**เพิ่มเติม:**
- เพิ่ม loading state สำหรับ LINE Login โดยเฉพาะ
- ปรับปรุง error handling และ user feedback
- เพิ่ม console logging สำหรับ debugging
- ปรับปรุง UI/UX ให้ดีขึ้น

**โค้ดที่สำคัญ:**
```javascript
const handleLineLogin = async () => {
  setLineLoading(true)
  setError('')
  
  try {
    console.log('🚀 Starting LINE login...')
    
    const result = await signIn('line', { 
      callbackUrl: '/menu/cmcg20f2i00029hu8p2am75df',
      redirect: true
    })
    
    if (result?.error) {
      setError('ไม่สามารถเข้าสู่ระบบด้วย LINE ได้ กรุณาลองใหม่อีกครั้ง')
      setLineLoading(false)
    }
  } catch (error) {
    setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE')
    setLineLoading(false)
  }
}
```

### 3. ปรับปรุงหน้า Error (`src/app/auth/error/page.tsx`)

**เพิ่มเติม:**
- ข้อความ error ที่ครอบคลุมและเป็นภาษาไทย
- แนวทางแก้ไขสำหรับแต่ละประเภทของ error
- UI ที่เป็นมิตรกับผู้ใช้
- ข้อมูล debug สำหรับ development

### 4. สร้างหน้าทดสอบ (`src/app/test-line/page.tsx`)

**ฟีเจอร์:**
- ทดสอบ NextAuth providers
- ทดสอบ LINE configuration
- ทดสอบ session information
- ทดสอบ LINE login flow
- แสดงข้อมูล environment variables
- แสดงผลการทดสอบแบบ real-time

## วิธีการทดสอบ

### 1. ทดสอบผ่านหน้าเว็บ
1. เข้าไปที่ `http://localhost:3000/test-line`
2. กดปุ่ม "ทดสอบ LINE Login" เพื่อดูผลลัพธ์
3. ตรวจสอบ console logs ใน browser developer tools

### 2. ทดสอบผ่านหน้า Sign In
1. เข้าไปที่ `http://localhost:3000/auth/signin`
2. กดปุ่ม "เข้าสู่ระบบด้วย LINE"
3. ตรวจสอบการ redirect และ error messages

### 3. ตรวจสอบ Environment Variables
แก้ไขไฟล์ `.env` และอัปเดต `NEXTAUTH_SECRET`:
```env
NEXTAUTH_SECRET="kE120hB7Z8qnosoiy5V6coc3pQTEOKuRUiUXEIgwBwE="
```

## การแก้ไขปัญหาที่พบบ่อย

### 1. Error: AccessDenied

**สาเหตุ:**
- ผู้ใช้ยกเลิกการอนุญาตใน LINE
- LINE Channel ไม่ได้ตั้งค่า callback URL ถูกต้อง
- ไม่มีสิทธิ์เข้าถึงข้อมูลโปรไฟล์

**แนวทางแก้ไข:**
1. ตรวจสอบ LINE Developers Console
2. ตรวจสอบ callback URL: `http://localhost:3000/api/auth/callback/line`
3. ตรวจสอบ scope ใน LINE Channel settings

### 2. Error: OAuthCreateAccount

**สาเหตุ:**
- ปัญหาการเชื่อมต่อฐานข้อมูล
- ข้อมูล user ซ้ำในฐานข้อมูล

**แนวทางแก้ไข:**
1. ตรวจสอบ `DATABASE_URL` ในไฟล์ `.env`
2. ตรวจสอบการเชื่อมต่อ PostgreSQL
3. ลองใช้ JWT-only session (ปิด adapter)

### 3. Error: Configuration

**สาเหตุ:**
- `NEXTAUTH_SECRET` ไม่ได้ตั้งค่า
- Environment variables ไม่ถูกโหลด

**แนวทางแก้ไข:**
1. ตั้งค่า `NEXTAUTH_SECRET` ใหม่
2. รีสตาร์ทเซิร์ฟเวอร์ development
3. ตรวจสอบไฟล์ `.env` location

## ตรวจสอบ Logs

### Browser Console
เปิด Developer Tools และดู console logs:
```
🚀 Starting LINE login...
📱 LINE login result: {...}
🔐 SignIn callback triggered: {...}
```

### Server Console
ดู terminal ที่รัน `npm run dev`:
```
NextAuth redirect: {...}
📱 LINE signIn data: {...}
✅ User created successfully
```

## ข้อมูลการตั้งค่า LINE Channel

### ข้อมูลจากไฟล์ `.env`
```
LINE_CLIENT_ID="2007609360"
LINE_CLIENT_SECRET="c21d2e938f3fe568bb4cbce60686f994"
NEXT_PUBLIC_LIFF_ID="2007609360-3Z0L8Ekg"
```

### Callback URLs ที่ต้องตั้งค่าใน LINE Developers Console
- Development: `http://localhost:3000/api/auth/callback/line`
- Production: `https://yourdomain.com/api/auth/callback/line`

## Next Steps

1. **ทดสอบในหน้า test-line** เพื่อวินิจฉัยปัญหา
2. **ตรวจสอบ LINE Developers Console** ว่าการตั้งค่าถูกต้อง
3. **อัปเดต NEXTAUTH_SECRET** ตามที่แนะนำ
4. **ทดสอบ LINE Login** ในหน้า signin
5. **ตรวจสอบ logs** ทั้งใน browser และ server

หากยังมีปัญหา กรุณาตรวจสอบ:
- LINE Channel status (Published/Draft)
- Callback URL configuration
- Environment variables loading
- Database connection (หากใช้)

## สำคัญ

หลังจากแก้ไขไฟล์ `.env` แล้ว **ต้องรีสตาร์ทเซิร์ฟเวอร์** เสมอ:
```bash
# หยุดเซิร์ฟเวอร์ (Ctrl+C)
npm run dev
``` 