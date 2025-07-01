# LINE Login Debug Tool - คู่มือการใช้งาน

## 🔧 เครื่องมือที่สร้างขึ้น

### 1. หน้า Debug หลัก
**URL:** `http://localhost:3000/debug-line`

**ฟีเจอร์:**
- ✅ ตรวจสอบ NextAuth Providers
- ✅ ตรวจสอบ Environment Variables
- ✅ ทดสอบ LINE OAuth Endpoint
- ✅ ทดสอบ LINE Callback Endpoint
- ✅ ตรวจสอบ Browser Environment
- ✅ ทดสอบ LINE Login จริง
- ✅ แสดงผลลัพธ์แบบ real-time

### 2. API Endpoints สำหรับ Debug

#### `/api/debug/env`
- ตรวจสอบ Environment Variables
- แสดงสถานะของ: NEXTAUTH_URL, NEXTAUTH_SECRET, LINE_CLIENT_ID, LINE_CLIENT_SECRET
- ไม่เปิดเผยค่าจริงของ secrets (แสดงเฉพาะ length)

#### `/api/debug/line-flow`
- ตรวจสอบ LINE OAuth flow ทั้งหมด
- วิเคราะห์การตั้งค่า NextAuth
- สร้าง LINE OAuth URL และตรวจสอบความถูกต้อง

## 🚀 วิธีการใช้งาน

### ขั้นตอน 1: เปิดหน้า Debug
```
http://localhost:3000/debug-line
```

### ขั้นตอน 2: กดปุ่ม "ตรวจสอบระบบทั้งหมด"
- ระบบจะทดสอบทุกส่วนอัตโนมัติ
- ผลลัพธ์จะแสดงในรูปแบบ Accordion
- สี่สีแสดงสถานะ:
  - 🟢 **Success**: ทำงานปกติ
  - 🔴 **Error**: มีปัญหาต้องแก้ไข
  - 🟡 **Warning**: ควรตรวจสอบ
  - 🔵 **Info**: ข้อมูลเพิ่มเติม

### ขั้นตอน 3: แก้ไขปัญหาที่พบ

#### หาก Environment Variables ไม่ครบ:
```bash
# ตรวจสอบไฟล์ .env
LINE_CLIENT_ID="2007609360"
LINE_CLIENT_SECRET="c21d2e938f3fe568bb4cbce60686f994"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
```

#### หาก LINE OAuth Endpoint ผิดพลาด:
- ตรวจสอบ LINE Developers Console
- Callback URL ต้องเป็น: `http://localhost:3000/api/auth/callback/line`

### ขั้นตอน 4: ทดสอบ LINE Login จริง
- กดปุ่ม "ทดสอบ LINE Login จริง"
- ระบบจะ redirect ไปยัง LINE OAuth
- ดู server logs สำหรับข้อมูล debug

## 📊 การอ่านผลลัพธ์

### ✅ NextAuth Providers
```json
{
  "status": "success",
  "message": "LINE provider พร้อมใช้งาน",
  "details": {
    "id": "line",
    "name": "LINE",
    "type": "oauth",
    "signinUrl": "http://localhost:3000/api/auth/signin/line",
    "callbackUrl": "http://localhost:3000/api/auth/callback/line"
  }
}
```

### ✅ Environment Variables
```json
{
  "status": "success",
  "message": "ตัวแปร environment ครบถ้วน",
  "details": {
    "LINE_CLIENT_ID": "2007609360",
    "LINE_CLIENT_SECRET": "set",
    "LINE_CLIENT_SECRET_LENGTH": 32,
    "NEXTAUTH_URL": "http://localhost:3000",
    "NEXTAUTH_SECRET": "set",
    "NEXTAUTH_SECRET_LENGTH": 47
  }
}
```

### ✅ LINE OAuth Endpoint
```json
{
  "status": "success",
  "message": "LINE OAuth redirect ทำงานปกติ",
  "details": {
    "status": 302,
    "location": "https://access.line.me/oauth2/v2.1/authorize?..."
  }
}
```

### ❌ ตัวอย่าง Error
```json
{
  "status": "error",
  "message": "LINE provider ไม่พบ",
  "details": {
    "availableProviders": ["credentials"]
  }
}
```

## 🔍 การ Debug แบบละเอียด

### ดู Server Logs
เมื่อทดสอบ LINE Login จะมี logs ต่อไปนี้:
```
🧪 Starting LINE login test at 1704176400000
📱 LINE profile received: {...}
📱 LINE SignIn Event Details: {...}
🔐 SignIn event fired: {...}
```

### ตรวจสอบ Network Requests
ใช้ Browser DevTools (F12) -> Network tab:
1. `/api/auth/signin/line` - ควรได้ 302 redirect
2. `access.line.me` - LINE OAuth page
3. `/api/auth/callback/line` - Callback from LINE

### Browser Console Logging
เปิด Console (F12) เพื่อดู:
```javascript
🧪 Starting LINE login test at 1704176400000
📱 NextAuth providers loaded
🔍 Environment check completed
```

## ⚠️ Common Issues & Solutions

### 1. error=line ยังคงเกิดขึ้น
**สาเหตุ:** LINE Developers Console configuration
**แก้ไข:**
- ตรวจสอบ Callback URL ใน LINE Console
- ตรวจสอบ Channel ID และ Channel Secret
- เปิด OpenID Connect scope

### 2. LINE provider ไม่พบ
**สาเหตุ:** NextAuth configuration ผิดพลาด
**แก้ไข:**
- รีสตาร์ทเซิร์ฟเวอร์
- ตรวจสอบ imports ใน NextAuth config
- ตรวจสอบ environment variables

### 3. Environment Variables ไม่โหลด
**สาเหตุ:** ไฟล์ .env ไม่ถูกต้อง
**แก้ไข:**
- ตรวจสอบชื่อไฟล์: `.env.local` หรือ `.env`
- ไม่มีเครื่องหมาย `,` หรือ `;` ในค่า
- รีสตาร์ทเซิร์ฟเวอร์หลังแก้ไข .env

## 📝 Checklist การแก้ไขปัญหา

### ☑️ ขั้นตอนพื้นฐาน
- [ ] เซิร์ฟเวอร์ทำงานที่ port 3000
- [ ] ไฟล์ .env มีครบทุกตัวแปร
- [ ] NextAuth providers มี LINE
- [ ] LINE OAuth endpoint ตอบสนอง 302

### ☑️ ขั้นตอนขั้นสูง
- [ ] LINE Developers Console settings ถูกต้อง
- [ ] Callback URL ตรงกัน
- [ ] OpenID Connect เปิดใช้งาน
- [ ] Channel permissions ครบถ้วน

### ☑️ การทดสอบ
- [ ] ทดสอบผ่าน debug tool
- [ ] ทดสอบ LINE login จริง
- [ ] ดู server logs ไม่มี error
- [ ] ไม่มี error=line ใน URL

## 🔗 Links & Resources

- **LINE Developers Console:** https://developers.line.biz/console/
- **NextAuth.js Docs:** https://next-auth.js.org/
- **Debug Tool:** http://localhost:3000/debug-line
- **Test Page:** http://localhost:3000/test-line
- **Error Page:** http://localhost:3000/auth/error

---

## 🚨 Emergency Debug Commands

หากมีปัญหาเร่งด่วน ใช้คำสั่งเหล่านี้:

### รีสตาร์ทเซิร์ฟเวอร์
```bash
npm run dev
```

### ตรวจสอบ Environment
```bash
# PowerShell
Get-Content .env | Where-Object { $_ -match 'LINE_' }
```

### ทดสอบ API โดยตรง
```bash
curl http://localhost:3000/api/auth/providers
curl http://localhost:3000/api/debug/env
curl http://localhost:3000/api/debug/line-flow
``` 