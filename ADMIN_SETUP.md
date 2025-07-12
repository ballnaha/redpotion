# 🛡️ Admin System Setup

## 📋 Admin User Created Successfully

### 🔑 Default Admin Credentials
```
Email: admin@redpotion.com
Password: Admin123!
Role: ADMIN
```

⚠️ **สำคัญ**: กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก

---

## 🚀 การเข้าสู่ระบบ Admin

### 1. เข้าสู่หน้า Login
```
URL: /auth/signin
```

### 2. กรอกข้อมูลเข้าสู่ระบบ
- **Email**: admin@redpotion.com
- **Password**: Admin123!

### 3. เข้าสู่ Admin Panel
หลังจาก login สำเร็จจะ redirect ไป:
```
URL: /admin
```

---

## 🎛️ Admin Panel Features

### 📊 Dashboard (`/admin`)
- สถิติระบบโดยรวม
- ร้านอาหารรออนุมัติ
- การแจ้งเตือนสำคัญ

### 👥 จัดการผู้ใช้ (`/admin/users`)
- ดูรายการผู้ใช้ทั้งหมด
- ค้นหาและกรองตาม role
- เปลี่ยน role ผู้ใช้
- ดูข้อมูลโปรไฟล์

### 🏪 จัดการร้านอาหาร (`/admin/restaurants`)
- ดูรายการร้านอาหารทั้งหมด
- อนุมัติ/ปฏิเสธร้านใหม่
- เปลี่ยนสถานะร้าน (ACTIVE/SUSPENDED)
- ดูรายละเอียดร้านครบถ้วน

### 📦 จัดการออเดอร์ (`/admin/orders`)
- ดูออเดอร์จากทุกร้าน
- สถิติรายได้และยอดขาย
- กรองตามสถานะออเดอร์
- ดูรายละเอียดออเดอร์

### 💳 จัดการ Payment Slips (`/admin/payment-slips`)
- ดูหลักฐานการโอนเงินทั้งหมด
- อนุมัติ/ปฏิเสธการโอนเงิน
- ดูรูปหลักฐานการโอน
- จัดการรายการรออนุมัติ

### 📈 Analytics (`/admin/analytics`)
- สถิติและกราฟรายได้
- ร้านอาหารยอดนิยม
- การเติบโตเทียบเดือนก่อน
- กิจกรรมล่าสุด

---

## 🔧 การจัดการ Admin Users

### สร้าง Admin User เพิ่มเติม
```bash
node scripts/create-admin-user.js
```

### ทดสอบการเข้าสู่ระบบ
```bash
node scripts/test-admin-login.js
```

### เปลี่ยน Role ผู้ใช้เป็น Admin (ผ่าน Admin Panel)
1. เข้า `/admin/users`
2. ค้นหาผู้ใช้ที่ต้องการ
3. กดปุ่ม "แก้ไข Role"
4. เลือก "ผู้ดูแลระบบ (ADMIN)"
5. กดบันทึก

---

## 🛡️ ระบบความปลอดภัย

### 🔐 Authentication
- ใช้ NextAuth.js สำหรับการยืนยันตัวตน
- รองรับ Credentials Provider สำหรับ ADMIN และ RESTAURANT_OWNER
- Session-based authentication

### 🚪 Authorization
- ตรวจสอบ ADMIN role ทุก API endpoint
- Middleware ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต
- Protected routes สำหรับ admin pages

### 🔒 Password Security
- Hash password ด้วย bcryptjs (12 rounds)
- ไม่เก็บ password เป็น plain text
- Validate password strength

---

## 📱 Browser Support

### เข้าได้จาก Browser ทั่วไป:
- Chrome, Firefox, Safari, Edge
- Desktop และ Mobile
- ไม่จำเป็นต้องใช้ LINE App

### เข้าไม่ได้จาก:
- LINE LIFF (สำหรับลูกค้าเท่านั้น)
- Apps ที่ไม่รองรับ cookies

---

## 🆘 Troubleshooting

### ❌ ไม่สามารถเข้าสู่ระบบได้
1. ตรวจสอบ email/password
2. ตรวจสอบว่าผู้ใช้มี role เป็น ADMIN
3. ลองเคลียร์ browser cache
4. ตรวจสอบ console ใน browser developer tools

### ❌ ถูก redirect กลับไป homepage
- ตรวจสอบว่า user role เป็น ADMIN
- ตรวจสอบ session cookie
- ลอง login ใหม่

### ❌ API ส่งข้อผิดพลาด 403 Forbidden
- ตรวจสอบ authentication
- ตรวจสอบ ADMIN role
- ตรวจสอบ server logs

---

## 📞 Support

หากมีปัญหาการใช้งาน:
1. ตรวจสอบ browser console
2. ตรวจสอบ network requests
3. ตรวจสอบ server logs
4. รัน test scripts เพื่อตรวจสอบระบบ

---

*เอกสารนี้อัปเดตล่าสุด: ${new Date().toLocaleDateString('th-TH')}* 