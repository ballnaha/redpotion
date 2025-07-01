# แก้ไขปัญหา LINE Login Callback กลับมาหน้า Sign In

## ปัญหาที่เกิดขึ้น
หลังจาก LINE login สำเร็จแล้ว ระบบกลับมาหน้า sign in แทนที่จะไปหน้า menu/restaurantId

## สาเหตุของปัญหา
1. **NextAuth redirect logic** ไม่ได้จัดการ callback URL อย่างถูกต้อง
2. **signIn() function** จาก next-auth ไม่ redirect ตาม callbackUrl ที่กำหนด
3. **Complex redirect logic** ใน callback function ทำให้เกิดความสับสน

## การแก้ไขที่ได้ทำ

### 1. ปรับปรุง NextAuth Redirect Logic

**ไฟล์:** `src/app/api/auth/[...nextauth]/route.ts`

**เปลี่ยนจาก:** Logic ที่ซับซ้อนและมีเงื่อนไขเยอะ
**เป็น:** Logic ที่เรียบง่ายและชัดเจน

```javascript
async redirect({ url, baseUrl }) {
  console.log('🔄 NextAuth redirect:', { url, baseUrl });
  
  // ถ้าเป็น callback URL ที่มีเส้นทางชัดเจน ให้ใช้ตามที่ระบุ
  if (url && url !== baseUrl && url !== `${baseUrl}/`) {
    // ตรวจสอบว่าเป็น relative URL หรือไม่
    if (url.startsWith('/')) {
      const fullUrl = `${baseUrl}${url}`;
      console.log('✅ Redirecting to relative URL:', fullUrl);
      return fullUrl;
    }
    
    // ตรวจสอบว่าเป็น absolute URL ที่อยู่ใน domain เดียวกัน
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(baseUrl);
      if (urlObj.origin === baseUrlObj.origin) {
        console.log('✅ Redirecting to same origin URL:', url);
        return url;
      }
    } catch (error) {
      console.warn('⚠️ Invalid URL format:', url);
    }
  }
  
  // สำหรับ LIFF หรือไม่มี callback URL ที่ชัดเจน ให้ไปหน้าเมนู
  const defaultMenuUrl = `${baseUrl}/menu/cmcg20f2i00029hu8p2am75df`;
  console.log('🏠 Using default menu URL:', defaultMenuUrl);
  return defaultMenuUrl;
}
```

### 2. เปลี่ยนวิธี LINE Login ในหน้า Sign In

**ไฟล์:** `src/app/auth/signin/page.tsx`

**เปลี่ยนจาก:** ใช้ `signIn('line', {...})` function
**เป็น:** ใช้ `window.location.href` เพื่อ redirect โดยตรง

```javascript
const handleLineLogin = async () => {
  setLineLoading(true)
  setError('')
  
  try {
    console.log('🚀 Starting LINE login...')
    
    // ใช้ window.location เพื่อ redirect ไปยัง LINE OAuth URL โดยตรง
    const lineLoginUrl = `/api/auth/signin/line?callbackUrl=${encodeURIComponent('/menu/cmcg20f2i00029hu8p2am75df')}`
    console.log('🔗 Redirecting to:', lineLoginUrl)
    
    window.location.href = lineLoginUrl
    
    // ไม่ต้อง setLineLoading(false) เพราะจะ redirect ออกจากหน้านี้
  } catch (error) {
    console.error('❌ LINE login exception:', error)
    setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE')
    setLineLoading(false)
  }
}
```

### 3. อัปเดตหน้าทดสอบ

**ไฟล์:** `src/app/test-line/page.tsx`

เพิ่มปุ่มทดสอบ LINE Login แบบ direct redirect:

```javascript
<Button
  variant="contained"
  color="success"
  onClick={() => {
    const lineLoginUrl = `/api/auth/signin/line?callbackUrl=${encodeURIComponent('/menu/cmcg20f2i00029hu8p2am75df')}`
    console.log('🚀 Direct LINE login redirect to:', lineLoginUrl)
    window.location.href = lineLoginUrl
  }}
  disabled={loading}
>
  🚀 ทดสอบ LINE Login จริง
</Button>
```

## วิธีการทดสอบ

### 1. ทดสอบผ่านหน้า Sign In
1. เข้าไปที่ `http://localhost:3000/auth/signin`
2. กดปุ่ม "เข้าสู่ระบบด้วย LINE"
3. ตรวจสอบว่า redirect ไปหน้าเมนูหรือไม่

### 2. ทดสอบผ่านหน้า Test
1. เข้าไปที่ `http://localhost:3000/test-line`
2. กดปุ่ม "🚀 ทดสอบ LINE Login จริง"
3. ตรวจสอบ console logs

### 3. ตรวจสอบ Console Logs

**Browser Console:**
```
🚀 Starting LINE login...
🔗 Redirecting to: /api/auth/signin/line?callbackUrl=%2Fmenu%2Fcmcg20f2i00029hu8p2am75df
```

**Server Console:**
```
🔄 NextAuth redirect: { url: '/menu/cmcg20f2i00029hu8p2am75df', baseUrl: 'http://localhost:3000' }
✅ Redirecting to relative URL: http://localhost:3000/menu/cmcg20f2i00029hu8p2am75df
```

## ข้อดีของการแก้ไขนี้

1. **ชัดเจน:** ใช้ direct redirect แทน NextAuth internal functions
2. **เสถียร:** ลดความซับซ้อนใน redirect logic
3. **ควบคุมได้:** สามารถระบุ callbackUrl ได้อย่างแม่นยำ
4. **Debug ง่าย:** มี console logs ที่ชัดเจน

## หากยังมีปัญหา

1. **ตรวจสอบ Server Console:** ดู NextAuth redirect logs
2. **ตรวจสอบ Browser Console:** ดู redirect URL ที่สร้างขึ้น
3. **ตรวจสอบ LINE Developers Console:** ตรวจสอบ callback URL settings
4. **ทดสอบด้วย incognito mode:** เพื่อหลีกเลี่ยง session cache

## URL Flow ที่คาดหวัง

```
1. หน้า Sign In → กดปุ่ม LINE Login
2. Redirect ไป: /api/auth/signin/line?callbackUrl=%2Fmenu%2Fcmcg20f2i00029hu8p2am75df
3. NextAuth redirect ไป LINE OAuth
4. LINE OAuth callback กลับมา: /api/auth/callback/line
5. NextAuth redirect callback ไป: /menu/cmcg20f2i00029hu8p2am75df
```

## สำคัญ

หลังจากแก้ไขแล้ว **ต้องรีสตาร์ทเซิร์ฟเวอร์** เสมอ:
```bash
# หยุดเซิร์ฟเวอร์ (Ctrl+C)
npm run dev
``` 