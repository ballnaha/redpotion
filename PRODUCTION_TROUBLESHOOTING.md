# 🔧 Production Troubleshooting Guide

## ปัญหาที่พบบ่อยใน Production และวิธีแก้ไข

### 🚨 ปัญหา: Auto Login ไม่ทำงานใน Production (Server Error 500)

#### สาเหตุที่เป็นไปได้:

1. **Cookie Domain Configuration ผิด**
   - ใน production ต้องตั้ง domain ให้ถูกต้อง
   - สำหรับ subdomain ต้องใช้ root domain

2. **SameSite Cookie Policy**
   - ใน production ต้องใช้ `sameSite: 'none'` สำหรับ LIFF iframe
   - ต้องมี `secure: true` ด้วย

3. **NEXTAUTH_URL ไม่ถูกต้อง**
   - ต้องเป็น production URL เต็ม
   - ตัวอย่าง: `https://red.theredpotion.com`

#### วิธีแก้ไข:

```bash
# ตั้งค่า Environment Variables ใน Production
NEXTAUTH_URL=https://red.theredpotion.com
NEXTAUTH_SECRET=your-strong-secret-here-32-chars-minimum
NODE_ENV=production

# LINE Configuration
LINE_CLIENT_ID=your_line_client_id
LINE_CLIENT_SECRET=your_line_client_secret
NEXT_PUBLIC_LIFF_ID=your_liff_id

# Database
DATABASE_URL=your_production_database_url
```

### 🔍 การตรวจสอบปัญหา

#### 1. ใช้ Production Debug Page
```
https://yoursite.com/debug-production
```

#### 2. ตรวจสอบ API Status
```bash
curl -X GET https://yoursite.com/api/debug/production-status \
  -H "Accept: application/json"
```

#### 3. ตรวจสอบ LINE Session
```bash
curl -X GET https://yoursite.com/api/auth/line-session \
  -H "Accept: application/json" \
  -H "Cookie: line-session-token=your-token"
```

### ❌ Server Error 500 - สาเหตุและแก้ไข

#### สาเหตุ 1: Database Connection Failed
```
Error: Can't reach database server
```

**แก้ไข:**
```bash
# ตรวจสอบ DATABASE_URL
echo $DATABASE_URL

# ทดสอบการเชื่อมต่อ
npx prisma db push

# Generate Prisma client ใหม่
npx prisma generate
```

#### สาเหตุ 2: JWT Secret ไม่ตรงกัน
```
Error: JWT verification failed
```

**แก้ไข:**
```bash
# ตั้ง NEXTAUTH_SECRET ใหม่
NEXTAUTH_SECRET=super-secret-key-minimum-32-characters-long

# Restart application
pm2 restart all
```

#### สาเหตุ 3: LINE API Configuration ผิด
```
Error: Invalid LINE access token
```

**แก้ไข:**
- ตรวจสอบ LINE_CLIENT_ID และ LINE_CLIENT_SECRET
- ตรวจสอบ Callback URL ใน LINE Developers Console
- ตรวจสอบ LIFF App configuration

### 🍪 Cookie Issues ใน Production

#### ปัญหา: User ต้อง login ซ้ำเรื่อยๆ

**สาเหตุ:** Cookie domain หรือ path ไม่ถูกต้อง

**แก้ไข:**
```typescript
// ใน line-login/route.ts
const cookieOptions = {
  httpOnly: true,
  secure: true, // ต้องเป็น true ใน production
  sameSite: 'none', // สำหรับ LIFF iframe
  domain: '.theredpotion.com', // ใช้ root domain
  path: '/',
  maxAge: 30 * 24 * 60 * 60 // 30 days
};
```

#### ปัญหา: Cookie ไม่ถูกส่งใน LIFF iframe

**สาเหตุ:** CORS หรือ SameSite policy

**แก้ไข:**
1. ตั้งค่า `sameSite: 'none'` และ `secure: true`
2. เพิ่ม domain ใน CORS allowed origins
3. ตรวจสอบ LIFF App domain settings

### 🔐 LINE Authentication Issues

#### ปัญหา: LIFF initialization failed

**ตรวจสอบ:**
1. LIFF ID ถูกต้องหรือไม่
2. LIFF App status เป็น Published หรือไม่
3. Endpoint URL ถูกต้องหรือไม่

**แก้ไข:**
```typescript
// ใน liffUtils.ts - ตรวจสอบ LIFF ID format
const LIFF_ID_REGEX = /^\d{10}-\w{8}$/;

export const validateLiffId = (liffId: string): boolean => {
  return LIFF_ID_REGEX.test(liffId);
};
```

#### ปัญหา: Access token หมดอายุ

**อาการ:** Error 401 จาก LINE API

**แก้ไข:**
- Implement token refresh mechanism
- ตรวจสอบ session validity
- Auto re-login เมื่อ token หมดอายุ

### 📱 LIFF-specific Issues

#### ปัญหา: LIFF ทำงานใน development แต่ไม่ทำงานใน production

**ตรวจสอบ:**
1. LIFF App endpoint URL ตั้งเป็น production URL หรือไม่
2. SSL certificate ใช้งานได้หรือไม่
3. Domain verification ใน LINE Developers Console

**แก้ไข:**
```bash
# ตรวจสอบ SSL
curl -I https://red.theredpotion.com

# ตรวจสอบ LIFF endpoint
curl -X GET https://red.theredpotion.com/liff
```

### 🔄 Session Management Issues

#### ปัญหา: Session หายหลัง refresh page

**สาเหตุ:** LIFF SDK ไม่ถูก re-initialize

**แก้ไข:**
```typescript
// เพิ่มใน MenuPageComponent.tsx
useEffect(() => {
  const restoreLiffAfterRefresh = async () => {
    if (!window.liff && lineUser) {
      // โหลด LIFF SDK ใหม่
      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      await new Promise(resolve => {
        script.onload = resolve;
        document.head.appendChild(script);
      });
      
      // Re-initialize LIFF
      const { initializeLiff } = await import('@/lib/sessionUtils');
      await initializeLiff();
    }
  };
  
  setTimeout(restoreLiffAfterRefresh, 2000);
}, [lineUser]);
```

### 📊 Monitoring และ Logging

#### การเปิด Debug Logs ใน Production

```bash
# เปิด debug logs
NEXT_PUBLIC_DEBUG_MODE=true

# Restart app
pm2 restart all

# ดู logs
pm2 logs
```

#### Real-time Monitoring

```typescript
// เพิ่มใน app
if (process.env.NODE_ENV === 'production') {
  import('@/lib/productionDebug').then(({ startProductionMonitoring }) => {
    startProductionMonitoring(30000); // ตรวจสอบทุก 30 วินาที
  });
}
```

### 🛠️ Emergency Fix Commands

#### ล้าง Cache และ Restart
```bash
# ล้าง Next.js cache
rm -rf .next

# ล้าง node_modules (ถ้าจำเป็น)
rm -rf node_modules
npm install

# Rebuild
npm run build

# Restart
pm2 restart all
```

#### ล้าง Database Sessions (กรณีฉุกเฉิน)
```sql
-- ล้าง sessions ทั้งหมด (ใช้ระวัง!)
DELETE FROM sessions WHERE expires < NOW();

-- หรือ ล้าง sessions ที่เก่าเกิน 1 วัน
DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '1 day';
```

### 🔧 Configuration Checklist

#### Pre-deployment Checklist
- [ ] `NODE_ENV=production`
- [ ] `NEXTAUTH_URL` ตั้งเป็น production URL
- [ ] `NEXTAUTH_SECRET` ยาวกว่า 32 ตัวอักษร
- [ ] `LINE_CLIENT_ID` และ `LINE_CLIENT_SECRET` ถูกต้อง
- [ ] `NEXT_PUBLIC_LIFF_ID` ถูกต้อง
- [ ] `DATABASE_URL` ใช้งานได้
- [ ] SSL certificate ใช้งานได้
- [ ] LIFF App status เป็น "Published"
- [ ] LIFF Endpoint URL ถูกต้อง

#### Post-deployment Testing
- [ ] เข้าสู่ระบบด้วย LINE ได้
- [ ] Session persist หลัง refresh
- [ ] Cookie ถูกตั้งอย่างถูกต้อง
- [ ] API endpoints ทำงานได้
- [ ] Database connection สำเร็จ
- [ ] Error logging ทำงาน

### 📞 การติดต่อขอความช่วยเหลือ

เมื่อพบปัญหาที่แก้ไม่ได้ ให้รวบรวมข้อมูลต่อไปนี้:

1. **Environment Information:**
   ```bash
   # รัน command นี้และส่งผลลัพธ์
   curl https://yoursite.com/api/debug/production-status
   ```

2. **Error Logs:**
   ```bash
   # PM2 logs
   pm2 logs --lines 100
   
   # System logs
   journalctl -u your-app-service --since "1 hour ago"
   ```

3. **Browser Console Logs:**
   - เปิด Developer Tools
   - ไปที่ Console tab
   - Screenshot error messages

4. **Network Tab:**
   - ดู failed requests
   - ตรวจสอบ response codes
   - ตรวจสอบ request headers

### 🚀 Performance Optimization

#### การปรับปรุงประสิทธิภาพ Authentication

```typescript
// Implement session caching
const sessionCache = new Map();

export const getCachedSession = (token: string) => {
  const cached = sessionCache.get(token);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  return null;
};

export const setCachedSession = (token: string, data: any, ttl: number = 300000) => {
  sessionCache.set(token, {
    data,
    expiry: Date.now() + ttl
  });
};
```

#### การลด Database Queries

```typescript
// ใช้ connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
});
```

### 📈 Health Checks

#### HTTP Health Check Endpoint
```typescript
// /api/health/route.ts
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {
      database: false,
      lineApi: false,
      liff: false
    }
  };

  try {
    // Database check
    await prisma.user.count();
    checks.checks.database = true;

    // LINE API check (optional)
    // await fetch('https://api.line.me/v2/profile', ...);
    checks.checks.lineApi = true;

    checks.checks.liff = !!process.env.NEXT_PUBLIC_LIFF_ID;

    return NextResponse.json(checks);
  } catch (error) {
    return NextResponse.json(
      { ...checks, status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
```

#### การใช้งาน Health Check
```bash
# ตรวจสอบ health
curl https://yoursite.com/api/health

# ใช้กับ Load Balancer
# Configure health check path: /api/health
# Expected response: 200 OK with {"status": "ok"}
``` 