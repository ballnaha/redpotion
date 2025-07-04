# การตั้งค่า Production/Development Mode

## 📋 ตัวแปร Environment Variables

เพิ่มตัวแปรเหล่านี้ในไฟล์ `.env.local` หรือ `.env`:

```bash
# Authentication Settings
NEXT_PUBLIC_ENFORCE_LINE_APP=true        # บังคับให้เข้าผ่าน LINE app เท่านั้น
NEXT_PUBLIC_ALLOW_DESKTOP=false          # อนุญาตให้เข้าจาก desktop browser
NEXT_PUBLIC_ENABLE_BYPASS=false          # เปิดใช้งาน bypass mode (?bypass=true)
NEXT_PUBLIC_DEBUG_MODE=false             # แสดง debug logs

# เปิด/ปิดการบังคับใช้ LINE application (true/false)
# false = สามารถเข้าจาก browser ได้
NEXT_PUBLIC_REQUIRE_LINE_LOGIN=true
```

## 🚀 โหมดการใช้งาน

### **Production Mode** (เข้าได้เฉพาะ LINE app)
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ALLOW_DESKTOP=false
NEXT_PUBLIC_ENABLE_BYPASS=false
NEXT_PUBLIC_DEBUG_MODE=false
```

### **Development Mode** (เข้าได้ทุก browser)
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=false
NEXT_PUBLIC_ALLOW_DESKTOP=true
NEXT_PUBLIC_ENABLE_BYPASS=true
NEXT_PUBLIC_DEBUG_MODE=true
```

### **Mixed Mode** (Production + Debug)
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ALLOW_DESKTOP=false
NEXT_PUBLIC_ENABLE_BYPASS=false
NEXT_PUBLIC_DEBUG_MODE=true
```

## ⚙️ รายละเอียดการตั้งค่า

| ตัวแปร | Default (Prod) | Default (Dev) | คำอธิบาย |
|--------|----------------|---------------|---------|
| `NEXT_PUBLIC_ENFORCE_LINE_APP` | `true` | `false` | บังคับให้เข้าผ่าน LINE app เท่านั้น |
| `NEXT_PUBLIC_ALLOW_DESKTOP` | `false` | `true` | อนุญาตให้เข้าจาก desktop browser |
| `NEXT_PUBLIC_ENABLE_BYPASS` | `false` | `true` | เปิดใช้ bypass mode สำหรับทดสอบ |
| `NEXT_PUBLIC_DEBUG_MODE` | `false` | `true` | แสดง debug logs ใน console |
| `NEXT_PUBLIC_REQUIRE_LINE_LOGIN` | `true` | `true` | บังคับให้ login ด้วย LINE (แต่ไม่บังคับใช้ LINE app) |

## 🛠️ การใช้งาน

### 1. **สำหรับ Production**
- ไม่ต้องตั้งค่าเพิ่มเติม (ใช้ default)
- หรือสร้างไฟล์ `.env.production`:
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ALLOW_DESKTOP=false
NEXT_PUBLIC_ENABLE_BYPASS=false
NEXT_PUBLIC_DEBUG_MODE=false
```

### 2. **สำหรับ Development**
สร้างไฟล์ `.env.local`:
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=false
NEXT_PUBLIC_ALLOW_DESKTOP=true
NEXT_PUBLIC_ENABLE_BYPASS=true
NEXT_PUBLIC_DEBUG_MODE=true
```

### 3. **URL Bypass** (สำหรับทดสอบ)
เมื่อ `NEXT_PUBLIC_ENABLE_BYPASS=true`:
```
https://your-site.com/menu/restaurant123?bypass=true
```

## 🔧 การทดสอบ

### ทดสอบบน Desktop (Development)
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=false
NEXT_PUBLIC_ALLOW_DESKTOP=true
```

### ทดสอบ Production Mode ใน Development
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ALLOW_DESKTOP=false
NEXT_PUBLIC_ENABLE_BYPASS=true  # ใช้ ?bypass=true เพื่อข้าม
```

### ดู Debug Logs
```bash
NEXT_PUBLIC_DEBUG_MODE=true
```
จากนั้นเปิด Developer Console เพื่อดู logs

## 📱 พฤติกรรมของระบบ

### เมื่อ `ENFORCE_LINE_APP=true`:
- ✅ เข้าได้จาก LINE app
- ❌ เข้าไม่ได้จาก desktop browser (แสดงข้อความแจ้งเตือน)
- ✅ เข้าได้ด้วย `?bypass=true` (ถ้า `ENABLE_BYPASS=true`)

### เมื่อ `ENFORCE_LINE_APP=false`:
- ✅ เข้าได้จากทุก browser
- ✅ ไม่มีข้อจำกัด

### เมื่อ `DEBUG_MODE=true`:
- 📝 แสดง debug logs ใน console
- 📊 แสดงข้อมูล config ที่ใช้
- 🔍 แสดงสถานะการตรวจสอบ LINE app

## 🚨 ข้อควรระวัง

1. **Production**: ใช้ `ENFORCE_LINE_APP=true` เพื่อความปลอดภัย
2. **Environment Variables**: ต้องมี prefix `NEXT_PUBLIC_` เพื่อให้ใช้ได้ใน client-side
3. **Restart**: เปลี่ยน env variables แล้วต้อง restart development server
4. **File Priority**: `.env.local` > `.env.production` > `.env`

## 💡 เทคนิคการใช้งาน

### Quick Switch ระหว่าง Modes
สร้างไฟล์ script สำหรับสลับโหมด:

**scripts/production.env**
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ALLOW_DESKTOP=false
NEXT_PUBLIC_ENABLE_BYPASS=false
NEXT_PUBLIC_DEBUG_MODE=false
```

**scripts/development.env**
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=false
NEXT_PUBLIC_ALLOW_DESKTOP=true
NEXT_PUBLIC_ENABLE_BYPASS=true
NEXT_PUBLIC_DEBUG_MODE=true
```

จากนั้นใช้:
```bash
# Switch to production mode
cp scripts/production.env .env.local
npm run dev

# Switch to development mode  
cp scripts/development.env .env.local
npm run dev
```

## 🔍 การ Debug

เมื่อเปิด `DEBUG_MODE=true` จะเห็น logs เช่น:
```
🔧 App Config: { enforceLineApp: true, allowDesktopAccess: false, ... }
📱 LINE App Detected: true
🔓 Bypass Mode: false
🚫 Not from LINE app, blocking access
🛠️ Desktop access allowed by config
```

## 📖 ตัวอย่างการใช้งาน

### Scenario 1: Development
```bash
# .env.local
NEXT_PUBLIC_ENFORCE_LINE_APP=false
NEXT_PUBLIC_ALLOW_DESKTOP=true
NEXT_PUBLIC_DEBUG_MODE=true
```

### Scenario 2: Production Testing
```bash
# .env.local
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ENABLE_BYPASS=true
NEXT_PUBLIC_DEBUG_MODE=true
```
ใช้ URL: `https://localhost:3000/menu/123?bypass=true`

### Scenario 3: Pure Production
```bash
# .env.production (หรือไม่ต้องตั้งเลย)
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ALLOW_DESKTOP=false
NEXT_PUBLIC_ENABLE_BYPASS=false
NEXT_PUBLIC_DEBUG_MODE=false
```

## LINE Login และ Application Access Configuration

### Environment Variables

เพิ่มตัวแปรเหล่านี้ในไฟล์ `.env.local` เพื่อควบคุมพฤติกรรมของแอป:

```bash
# เปิด/ปิดการบังคับใช้ LINE application (true/false)
# false = สามารถเข้าจาก browser ได้
NEXT_PUBLIC_ENFORCE_LINE_APP=false

# เปิด/ปิดการเข้าถึงจาก desktop browser (true/false)
NEXT_PUBLIC_ALLOW_DESKTOP=true

# เปิด/ปิดการบังคับ LINE login (true/false)
# true = ต้อง login ด้วย LINE เท่านั้น
NEXT_PUBLIC_REQUIRE_LINE_LOGIN=true

# เปิด/ปิด bypass mode สำหรับ development (true/false)
NEXT_PUBLIC_ENABLE_BYPASS=false

# เปิด/ปิด debug mode (true/false)
NEXT_PUBLIC_DEBUG_MODE=true
```

### การตั้งค่าแนะนำ

#### สำหรับ Production:
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=false
NEXT_PUBLIC_ALLOW_DESKTOP=true
NEXT_PUBLIC_REQUIRE_LINE_LOGIN=true
NEXT_PUBLIC_ENABLE_BYPASS=false
NEXT_PUBLIC_DEBUG_MODE=false
```

#### สำหรับ Development:
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=false
NEXT_PUBLIC_ALLOW_DESKTOP=true
NEXT_PUBLIC_REQUIRE_LINE_LOGIN=true
NEXT_PUBLIC_ENABLE_BYPASS=true
NEXT_PUBLIC_DEBUG_MODE=true
```

#### สำหรับทดสอบโดยไม่ต้อง LINE login:
```bash
NEXT_PUBLIC_ENFORCE_LINE_APP=false
NEXT_PUBLIC_ALLOW_DESKTOP=true
NEXT_PUBLIC_REQUIRE_LINE_LOGIN=false
NEXT_PUBLIC_ENABLE_BYPASS=true
NEXT_PUBLIC_DEBUG_MODE=true
```

### พฤติกรรมแต่ละการตั้งค่า

- **ENFORCE_LINE_APP=false**: ผู้ใช้สามารถเข้าจาก browser บน desktop ได้
- **ALLOW_DESKTOP=true**: อนุญาตให้เข้าจาก desktop browser
- **REQUIRE_LINE_LOGIN=true**: บังคับให้ login ด้วย LINE (แต่ไม่บังคับใช้ LINE app)
- **REQUIRE_LINE_LOGIN=false**: ไม่บังคับ LINE login สามารถใช้งานได้ทันที
- **ENABLE_BYPASS=true**: เปิดโหมด bypass สำหรับ development
- **DEBUG_MODE=true**: แสดง console logs เพื่อการ debug 