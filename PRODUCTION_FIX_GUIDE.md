# 🚨 Production Infinite Redirect Loop Fix

## ปัญหาที่เกิดขึ้น

บน production เกิด **infinite redirect loop** ที่หน้า signin เนื่องจาก:

1. **ผู้ใช้ authenticated แล้ว** → ระบบพยายาม redirect ไป `/restaurant`
2. **ไม่มีข้อมูลร้านอาหารใน database** → API `/api/restaurant/default` return 404
3. **Middleware redirect กลับไป signin** → วนลูปไม่รู้จบ

## 🛠️ การแก้ไขที่ได้ทำ

### 1. แก้ไข Signin Page Logic

ปรับ `src/app/auth/signin/page.tsx` เพื่อตรวจสอบร้านอาหารก่อน redirect:

```typescript
// ตรวจสอบว่ามีร้านอาหารก่อนจะ redirect
if (callbackUrl && session.user.role === 'RESTAURANT_OWNER') {
  const decodedUrl = decodeURIComponent(callbackUrl)
  
  // ถ้า callback ไปหน้า restaurant ให้ตรวจสอบว่ามีร้านอาหารหรือไม่
  if (decodedUrl.includes('/restaurant')) {
    try {
      const response = await fetch('/api/restaurant/default')
      if (!response.ok) {
        console.log('⚠️ No restaurants available, redirecting to home instead')
        window.location.href = '/'
        return
      }
    } catch (error) {
      console.log('⚠️ Error checking restaurants, redirecting to home')
      window.location.href = '/'
      return
    }
  }
}
```

### 2. แก้ไข Middleware

ปรับ `src/middleware.ts` เพื่อป้องกัน redirect loop:

```typescript
// ไม่ redirect ถ้ามี callbackUrl หรือเป็น signin/error pages เพื่อป้องกัน loop
if (isAuthPage && isAuth && 
    !req.nextUrl.searchParams.has('callbackUrl') &&
    !req.nextUrl.pathname.includes('/signin') &&
    !req.nextUrl.pathname.includes('/error')) {
  // redirect logic...
}
```

### 3. เพิ่ม Manual Override Buttons

เพิ่มปุ่มให้ผู้ใช้สามารถ navigate manually ได้หาก auto redirect ไม่ทำงาน:

```typescript
<Button size="small" variant="outlined" href="/">หน้าหลัก</Button>
<Button size="small" variant="outlined" href="/restaurant">จัดการร้าน</Button>
```

## 🔧 Scripts สำหรับ Production

### ตรวจสอบสถานะ Database

```bash
npm run db:check
```

### สร้างร้านอาหาร Default

```bash
npm run db:seed
```

หรือรันแยก:

```bash
node scripts/check-production-data.js
node scripts/create-default-restaurant.js
```

## 📋 ขั้นตอนการแก้ไขบน Production

### 1. Deploy Code Changes

```bash
git add .
git commit -m "fix: infinite redirect loop on signin page"
git push origin main
```

### 2. ตรวจสอบ Database

```bash
# บน production server
npm run db:check
```

### 3. สร้างข้อมูล Default (หากจำเป็น)

```bash
# บน production server
npm run db:seed
```

### 4. ทดสอบ

1. เข้า https://theredpotion.com/auth/signin
2. Login ด้วย `owner@redpotion.com` / `password123`
3. ตรวจสอบว่าไม่มี infinite loop
4. ตรวจสอบ redirect ไป `/restaurant` สำเร็จ

## 🔍 การ Debug

### Console Logs ที่ควรเห็น

**ปกติ (มีร้านอาหาร):**
```
🔄 User already authenticated, redirecting... {role: 'RESTAURANT_OWNER'}
✅ Default restaurant check passed
🔄 Redirecting to: /restaurant
```

**ไม่มีร้านอาหาร:**
```
🔄 User already authenticated, redirecting... {role: 'RESTAURANT_OWNER'}
⚠️ No restaurants available, redirecting to home instead
🔄 Redirecting to: /
```

### API Endpoints ที่เกี่ยวข้อง

- `GET /api/restaurant/default` - หาร้านอาหาร default
- `GET /api/restaurant/my-restaurant` - ร้านอาหารของ owner
- `PUT /api/restaurant/[restaurantId]/liff` - อัปเดต LIFF ID

## 📊 ข้อมูล Default Restaurant

เมื่อรัน seed script จะได้:

- **Restaurant**: Red Potion Restaurant
- **Owner Email**: owner@redpotion.com
- **Password**: password123
- **LIFF ID**: 2007609360-3Z0L8Ekg
- **Status**: ACTIVE

## ⚡ Next Steps

1. **Monitor Production**: ตรวจสอบ logs หลัง deploy
2. **Test LINE Integration**: ทดสอบ LIFF กับ LINE app
3. **Multi-tenant Support**: เตรียมรองรับหลายร้านอาหาร
4. **Error Handling**: ปรับปรุง error handling ให้ครอบคลุมมากขึ้น

---

> **หมายเหตุ**: การแก้ไขนี้เป็น short-term fix เพื่อแก้ปัญหาเร่งด่วน  
> ระยะยาวควรปรับ architecture ให้รองรับ multi-tenant ที่ดีกว่านี้ 