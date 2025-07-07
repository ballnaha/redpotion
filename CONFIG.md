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

ระบบจะใช้ `NODE_ENV` เป็นตัวกำหนดโหมดการทำงานเพียงอย่างเดียว:

### **Production Mode**
```bash
NODE_ENV=production
```

### **Development Mode**
```bash
NODE_ENV=development
```

## ⚙️ รายละเอียดการตั้งค่า

| ตัวแปร | Production | Development | คำอธิบาย |
|--------|------------|-------------|---------|
| `enforceLineApp` | `false` | `false` | บังคับให้เข้าผ่าน LINE app เท่านั้น |
| `allowDesktopAccess` | `true` | `true` | อนุญาตให้เข้าจาก desktop browser |
| `enableBypassMode` | `false` | `true` | เปิดใช้ bypass mode สำหรับทดสอบ |
| `requireLineLogin` | `true` | `true` | บังคับให้ login ด้วย LINE |
| `enableDebugLogs` | `false` | `true` | แสดง debug logs ใน console |
| `showDebugInfo` | `false` | `true` | แสดงข้อมูล debug ใน UI |
| `enableDevTools` | `false` | `true` | เปิดใช้ development tools |

## 🛠️ การใช้งาน

### 1. **Development Mode**
```bash
# รันในโหมด development
npm run dev

# หรือ
NODE_ENV=development npm run dev
```

### 2. **Production Mode**
```bash
# Build และ start ในโหมด production
npm run build
npm run start

# หรือ
NODE_ENV=production npm run build
NODE_ENV=production npm run start
```

### 3. **ทดสอบ Production Mode ใน Development Server**
```bash
# รัน dev server แต่ใช้ production config
npm run dev:prod

# หรือ
NODE_ENV=production npm run dev
```

## 📋 Scripts ที่พร้อมใช้งาน

```bash
# Development
npm run dev              # NODE_ENV=development next dev
npm run dev:prod         # NODE_ENV=production next dev

# Build
npm run build            # next build (ใช้ NODE_ENV ปัจจุบัน)
npm run build:dev        # NODE_ENV=development next build
npm run build:prod       # NODE_ENV=production next build

# Start
npm run start            # NODE_ENV=production next start
npm run start:dev        # NODE_ENV=development next start
```

## 🔧 การ Override การตั้งค่า (ถ้าจำเป็น)

หากต้องการปรับแต่งเพิ่มเติม สามารถใช้ environment variables เหล่านี้:

```bash
# Override การตั้งค่าเฉพาะ
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ALLOW_DESKTOP=false
NEXT_PUBLIC_ENABLE_BYPASS=true
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_REQUIRE_LINE_LOGIN=true
```

## 🚨 ข้อควรระวัง

1. **NODE_ENV**: ตัวแปรนี้เป็นตัวกำหนดหลักของระบบ
2. **Restart**: เปลี่ยน NODE_ENV แล้วต้อง restart server
3. **Environment Variables**: ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะใช้ได้ใน client-side
4. **Cache**: การเปลี่ยนโหมดอาจต้องล้าง cache: `npm run cache:clear`

## 💡 ตัวอย่างการใช้งาน

### Scenario 1: พัฒนาปกติ
```bash
npm run dev
# จะใช้ development config อัตโนมัติ
```

### Scenario 2: ทดสอบ production behavior ใน development
```bash
npm run dev:prod
# จะใช้ production config แต่รันบน dev server
```

### Scenario 3: Deploy production
```bash
npm run build:prod
npm run start
# จะใช้ production config ทั้งหมด
```

## 🔍 การ Debug

### ดูการตั้งค่าปัจจุบัน
```bash
# ใน browser console (development mode)
console.log('Current config:', getAppConfig());
```

### ดู environment mode
```bash
# ใน code
import { getEnvironmentMode, isProduction, isDevelopment } from '@/lib/appConfig';

console.log('Mode:', getEnvironmentMode());
console.log('Is Production:', isProduction());
console.log('Is Development:', isDevelopment());
```

## 📖 ข้อดีของการใช้ NODE_ENV เพียงอย่างเดียว

1. **ความเรียบง่าย**: ไม่ต้องจำการตั้งค่าหลายตัวแปร
2. **มาตรฐาน**: ใช้ convention ของ Node.js
3. **ไม่ผิดพลาด**: ลดความเสี่ยงในการตั้งค่าผิด
4. **ง่ายต่อการ deploy**: เปลี่ยนแค่ NODE_ENV เท่านั้น
5. **Consistent**: พฤติกรรมเหมือนกันทุกครั้ง

## 🔄 การย้ายจากระบบเก่า

หากเคยใช้ environment variables เก่า สามารถลบออกได้:

```bash
# ลบตัวแปรเหล่านี้ออกจาก .env files
# NEXT_PUBLIC_ENFORCE_LINE_APP
# NEXT_PUBLIC_ALLOW_DESKTOP
# NEXT_PUBLIC_ENABLE_BYPASS
# NEXT_PUBLIC_DEBUG_MODE
# NEXT_PUBLIC_REQUIRE_LINE_LOGIN
```

ระบบจะใช้ NODE_ENV เป็นตัวกำหนดอัตโนมัติ 

## 🔐 ระบบ Hybrid Authentication

### แนวทางใหม่: Session API + LIFF

ระบบได้รับการปรับปรุงให้ใช้ **Session API เป็นหลัก + LIFF เป็นรอง** ซึ่งเสถียรและนิยมใช้กันมากกว่า pure LIFF:

#### ลำดับการทำงาน:
1. **Session API Check** - ตรวจสอบ session ที่มีอยู่ก่อน (เร็วและเสถียร)
2. **LIFF Fallback** - ถ้าไม่มี session และอยู่ใน LINE environment
3. **Redirect to Login** - ถ้าทั้งคู่ไม่ได้

#### ข้อดี:
- ✅ **เสถียรกว่า**: ไม่ต้องพึ่ง LIFF initialization
- ⚡ **เร็วกว่า**: Session API check รวดเร็ว
- 🛡️ **ปลอดภัยกว่า**: ไม่มี LIFF connection issues
- 🔄 **Persistent**: Session คงอยู่หลัง refresh

### การใช้งาน Hybrid Authentication:

```typescript
import { authenticateUser, AuthWrapper } from '@/lib/hybridAuth';

// ใน component
<AuthWrapper restaurantId="123" requireAuth={true}>
  <YourProtectedContent />
</AuthWrapper>

// Manual authentication
const result = await authenticateUser({
  restaurantId: '123',
  returnUrl: '/current-page'
});
```

### Debug และทดสอบ:
- `/test-hybrid-auth` - หน้าทดสอบระบบ Hybrid Authentication
- `/test-node-env` - หน้าทดสอบการตั้งค่า NODE_ENV

## 🛠️ การใช้งาน

### 1. **Development Mode**
```bash
# รันในโหมด development
npm run dev

# หรือ
NODE_ENV=development npm run dev
```

### 2. **Production Mode**
```bash
# Build และ start ในโหมด production
npm run build
npm run start

# หรือ
NODE_ENV=production npm run build
NODE_ENV=production npm run start
```

### 3. **ทดสอบ Production Mode ใน Development Server**
```bash
# รัน dev server แต่ใช้ production config
npm run dev:prod

# หรือ
NODE_ENV=production npm run dev
```

## 📋 Scripts ที่พร้อมใช้งาน

```bash
# Development
npm run dev              # NODE_ENV=development next dev
npm run dev:prod         # NODE_ENV=production next dev

# Build
npm run build            # next build (ใช้ NODE_ENV ปัจจุบัน)
npm run build:dev        # NODE_ENV=development next build
npm run build:prod       # NODE_ENV=production next build

# Start
npm run start            # NODE_ENV=production next start
npm run start:dev        # NODE_ENV=development next start
```

## 🔧 การ Override การตั้งค่า (ถ้าจำเป็น)

หากต้องการปรับแต่งเพิ่มเติม สามารถใช้ environment variables เหล่านี้:

```bash
# Override การตั้งค่าเฉพาะ
NEXT_PUBLIC_ENFORCE_LINE_APP=true
NEXT_PUBLIC_ALLOW_DESKTOP=false
NEXT_PUBLIC_ENABLE_BYPASS=true
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_REQUIRE_LINE_LOGIN=true
```

## 🚨 ข้อควรระวัง

1. **NODE_ENV**: ตัวแปรนี้เป็นตัวกำหนดหลักของระบบ
2. **Restart**: เปลี่ยน NODE_ENV แล้วต้อง restart server
3. **Environment Variables**: ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะใช้ได้ใน client-side
4. **Cache**: การเปลี่ยนโหมดอาจต้องล้าง cache: `npm run cache:clear`

## 💡 ตัวอย่างการใช้งาน

### Scenario 1: พัฒนาปกติ
```bash
npm run dev
# จะใช้ development config อัตโนมัติ
# รวมถึง Hybrid Authentication พร้อม debug logs
```

### Scenario 2: ทดสอบ production behavior ใน development
```bash
npm run dev:prod
# จะใช้ production config แต่รันบน dev server
# Hybrid Authentication จะไม่แสดง debug logs
```

### Scenario 3: Deploy production
```bash
npm run build:prod
npm run start
# จะใช้ production config ทั้งหมด
# Hybrid Authentication จะทำงานแบบ production
```

## 🔍 การ Debug

### Debug Pages
- `/test-hybrid-auth` - ทดสอบระบบ Hybrid Authentication
- `/test-node-env` - ทดสอบการตั้งค่า NODE_ENV
- `/debug-production` - Production status
- `/debug-line` - LINE integration debug

### ดูการตั้งค่าปัจจุบัน
```bash
# ใน browser console (development mode)
console.log('Current config:', getAppConfig());
```

### ดู environment mode
```bash
# ใน code
import { getAppConfig, getEnvironmentMode } from '@/lib/appConfig';
import { authenticateUser, quickAuthCheck } from '@/lib/hybridAuth';

console.log('Mode:', getEnvironmentMode());
console.log('Config:', getAppConfig());

// ทดสอบ authentication
const authResult = await quickAuthCheck();
console.log('Auth status:', authResult);
```

## 📖 ข้อดีของการใช้ NODE_ENV + Hybrid Auth

1. **ความเรียบง่าย**: เปลี่ยนแค่ `NODE_ENV` เท่านั้น
2. **มาตรฐาน**: ใช้ Node.js convention
3. **ไม่ผิดพลาด**: ลดความเสี่ยงในการตั้งค่าผิด
4. **ง่ายต่อการ deploy**: เปลี่ยนแค่ตัวแปรเดียว
5. **Consistent**: พฤติกรรมเหมือนกันทุกครั้ง
6. **เสถียร**: Session API เสถียรกว่า pure LIFF
7. **เร็ว**: Session check รวดเร็ว
8. **Fallback**: LIFF เป็น backup สำหรับ LINE environment

## 🔄 การย้ายจากระบบเก่า

หากเคยใช้ pure LIFF authentication สามารถย้ายมาใช้ Hybrid Authentication:

### เปลี่ยนจาก:
```typescript
// เก่า: pure LIFF
import { initializeLiff, handleLineAuth } from '@/lib/sessionUtils';

const result = await handleLineAuth(restaurantId);
```

### เป็น:
```typescript
// ใหม่: Hybrid Authentication
import { authenticateUser, AuthWrapper } from '@/lib/hybridAuth';

// Option 1: ใช้ AuthWrapper component
<AuthWrapper restaurantId={restaurantId}>
  <YourContent />
</AuthWrapper>

// Option 2: Manual authentication
const result = await authenticateUser({ restaurantId });
```

## 🧪 การทดสอบ

### ทดสอบ Hybrid Authentication:
```bash
# เปิดหน้าทดสอบ
http://localhost:3000/test-hybrid-auth
```

### ทดสอบ NODE_ENV:
```bash
# เปิดหน้าทดสอบ
http://localhost:3000/test-node-env
```

ระบบจะใช้ NODE_ENV เป็นตัวกำหนดอัตโนมัติ พร้อมระบบ Hybrid Authentication ที่เสถียรและรวดเร็ว! 🎉 