# 🧪 URLs สำหรับทดสอบ LINE Login ด้วย User จริง

## 📱 URLs สำหรับทดสอบใน LINE Application

### 1. หน้าทดสอบ LINE Login Real User (ใหม่)
```
https://your-domain.com/debug-line-real-user
```
**ฟีเจอร์:**
- ทดสอบ LIFF SDK initialization อัตโนมัติ
- ดึง access token จาก LINE App จริง
- ทดสอบ backend authentication
- แสดงข้อมูล user profile จาก LINE
- ทดสอบ session check
- แสดงผลลัพธ์แบบ real-time

### 2. หน้า LIFF หลัก
```
https://your-domain.com/liff
```
**ใช้สำหรับ:**
- การเข้าสู่ระบบปกติจาก LINE App
- ทดสอบ auto-login flow
- ทดสอบ redirect ไปยังเมนูร้านอาหาร

### 3. หน้าทดสอบ Manual (สำหรับ Developers)
```
https://your-domain.com/debug-line-login-test
```
**ใช้สำหรับ:**
- ใส่ access token manual
- ทดสอบ API endpoint โดยตรง
- ทดสอบ error cases

## 🔧 วิธีการทดสอบ

### ขั้นตอนที่ 1: เตรียมการทดสอบ
1. เปิด LINE App บนมือถือ
2. ไปที่หน้าการพูดคุยใดก็ได้
3. ส่งลิงก์ทดสอบให้ตัวเอง หรือ
4. เปิด Browser ใน LINE App

### ขั้นตอนที่ 2: ทดสอบด้วย Real User
1. เข้าไปที่: `https://your-domain.com/debug-line-real-user`
2. ระบบจะ:
   - ตรวจจับว่าอยู่ใน LINE App หรือไม่
   - โหลด LIFF SDK อัตโนมัติ
   - ดึง access token และ user profile
3. กดปุ่ม "🚀 ทดสอบเต็ม" เพื่อทดสอบการทำงานทั้งหมด
4. ตรวจสอบผลลัพธ์ว่ามีข้อผิดพลาดหรือไม่

### ขั้นตอนที่ 3: ทดสอบ LIFF ปกติ
1. เข้าไปที่: `https://your-domain.com/liff`
2. ระบบจะทำ auto-login
3. ควรจะ redirect ไปยังเมนูร้านอาหารโดยอัตโนมัติ

## 🐛 การ Debug ปัญหา

### ปัญหาที่พบบ่อย:

#### 1. LIFF SDK ไม่โหลด
**อาการ:** ❌ ไม่สามารถโหลด LIFF SDK ได้  
**แก้ไข:** ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือลองเปิดหน้าใหม่

#### 2. Access Token ไม่ได้
**อาการ:** ⚠️ ยังไม่ได้ล็อกอิน LINE  
**แก้ไข:** กดปุ่ม "🔐 เข้าสู่ระบบ LINE" แล้วอนุญาต permissions

#### 3. Backend Authentication ล้มเหลว
**อาการ:** ❌ Backend Authentication ล้มเหลว (401/400)  
**แก้ไข:** 
- ตรวจสอบว่า user มีในฐานข้อมูลหรือไม่
- รัน `node scripts/fix-missing-users.js check`
- หาก user หายไป รัน `node scripts/fix-missing-users.js recreate <LINE_USER_ID>`

#### 4. Session หมดอายุ
**อาการ:** ⚠️ Session ไม่ถูกต้อง (401)  
**แก้ไข:** ระบบจะลบ cookies อัตโนมัติและสร้าง session ใหม่

## 📊 ข้อมูลที่ควรเก็บเมื่อทดสอบ

### ข้อมูลพื้นฐาน:
- LINE User ID
- Display Name
- Platform (iOS/Android/Browser)
- Access Token (20 ตัวอักษรแรก)

### ข้อมูล Debug:
- LIFF Context
- User Agent String
- ผลลัพธ์ Backend Authentication
- Error Messages (ถ้ามี)

## 🚀 URLs อื่น ๆ ที่เป็นประโยชน์

### Health Check
```
https://your-domain.com/api/health
```

### Environment Debug
```
https://your-domain.com/api/debug/env
```

### Production Status
```
https://your-domain.com/api/debug/production-status
```

### Session Check
```
https://your-domain.com/api/auth/line-session
```

## 📝 บันทึกการทดสอบ

**วันที่:** _______________  
**ผู้ทดสอบ:** _______________  
**LINE User ID:** _______________  
**Platform:** _______________  

**ผลการทดสอบ:**
- [ ] LIFF SDK โหลดสำเร็จ
- [ ] ได้ Access Token สำเร็จ
- [ ] ได้ User Profile สำเร็จ
- [ ] Backend Authentication สำเร็จ
- [ ] Session Check สำเร็จ
- [ ] Redirect ไปเมนูสำเร็จ

**ปัญหาที่พบ:**
_______________
_______________
_______________

**การแก้ไข:**
_______________
_______________
_______________ 