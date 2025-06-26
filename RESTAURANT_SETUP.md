# คู่มือติดตั้งระบบจัดการร้านอาหาร - เดอะ เรด โพชั่น

## ฟีเจอร์ที่เพิ่มเข้ามา

✅ **ระบบ Authentication ด้วย NextAuth**
- เข้าสู่ระบบด้วย email/password  
- สมัครสมาชิกสำหรับเจ้าของร้านอาหาร
- จัดการ session และ JWT tokens

✅ **Database Schema ด้วย Prisma + PostgreSQL**
- User management (เจ้าของร้าน, admin)
- Restaurant management 
- Menu categories และ items
- Order management system
- Order items tracking

✅ **Dashboard สำหรับเจ้าของร้าน**
- หน้าแสดงภาพรวมร้าน
- สถิติยอดขาย, จำนวนเมนู, ออเดอร์
- เมนูลิงค์ไปยังหน้าจัดการต่างๆ

✅ **API Routes**
- Authentication endpoints
- Restaurant data management
- Protected routes ด้วย middleware

## การติดตั้ง

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` จาก `env.example`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/redpotion_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here-change-in-production"
```

### 3. ตั้งค่า PostgreSQL Database
ให้แน่ใจว่าคุณมี PostgreSQL server ที่ทำงานอยู่และสร้าง database:

```sql
CREATE DATABASE redpotion_db;
```

### 4. Generate Prisma Client และ Migrate Database
```bash
npm run db:generate
npm run db:push
```

หรือสำหรับ development:
```bash
npm run db:migrate
```

### 5. เริ่มต้น Development Server
```bash
npm run dev
```

## การใช้งาน

### 1. สมัครสมาชิกเจ้าของร้าน
- ไปที่ `http://localhost:3000/auth/signin`
- เลือกแท็บ "สมัครสมาชิก"
- กรอกข้อมูลส่วนตัวและข้อมูลร้าน
- ระบบจะสร้างบัญชีเจ้าของร้านให้อัตโนมัติ

### 2. เข้าสู่ระบบ Dashboard
- หลังสมัครสมาชิกเสร็จ ระบบจะนำไปหน้า Dashboard อัตโนมัติ
- หรือไปที่ `http://localhost:3000/dashboard`

### 3. ฟีเจอร์ที่พร้อมใช้งาน
- ✅ **ดูข้อมูลร้าน**: สถานะร้าน, ที่อยู่, เบอร์โทร
- ✅ **สถิติร้าน**: จำนวนหมวดหมู่, เมนู, ออเดอร์ (ยังเป็น 0 เพราะยังไม่มีข้อมูล)
- ✅ **เมนูนำทาง**: ไปยังหน้าจัดการเมนู, ออเดอร์, รายงาน, ตั้งค่า
- ✅ **ออกจากระบบ**: ผ่านเมนู profile

### 4. ฟีเจอร์ที่กำลังพัฒนา (ลิงค์พร้อมแล้วแต่หน้ายังไม่มี)
- 🔄 จัดการเมนูอาหาร (`/dashboard/menu`)
- 🔄 จัดการออเดอร์ (`/dashboard/orders`) 
- 🔄 รายงานยอดขาย (`/dashboard/reports`)
- 🔄 ตั้งค่าร้าน (`/dashboard/settings`)

## Database Schema Overview

```
User (ผู้ใช้)
├── id, name, email, password
├── role: USER | RESTAURANT_OWNER | ADMIN
└── restaurant (1:1 relationship)

Restaurant (ร้านอาหาร)
├── id, name, description, address, phone
├── status: PENDING | ACTIVE | SUSPENDED | CLOSED
├── settings: openTime, closeTime, deliveryFee, etc.
├── ownerId (FK to User)
├── categories (1:many)
├── menuItems (1:many)
└── orders (1:many)

Category (หมวดหมู่เมนู)
├── id, name, description, imageUrl
├── restaurantId (FK to Restaurant)
└── menuItems (1:many)

MenuItem (รายการอาหาร)
├── id, name, description, price, imageUrl
├── restaurantId (FK to Restaurant)
├── categoryId (FK to Category)
└── orderItems (1:many)

Order (ออเดอร์)
├── id, orderNumber, status, customer info
├── totals: subtotal, deliveryFee, tax, total
├── restaurantId (FK to Restaurant)
└── items (1:many OrderItem)

OrderItem (รายการในออเดอร์)
├── id, quantity, price, notes
├── orderId (FK to Order)
└── menuItemId (FK to MenuItem)
```

## การพัฒนาต่อ

### เพิ่มหน้าจัดการเมนู
1. สร้าง `/dashboard/menu/page.tsx`
2. สร้าง API สำหรับ CRUD categories และ menu items
3. สร้าง forms สำหรับเพิ่ม/แก้ไข เมนู

### เพิ่มระบบออเดอร์
1. สร้าง `/dashboard/orders/page.tsx` 
2. สร้าง API สำหรับจัดการสถานะออเดอร์
3. เพิ่ม real-time notifications

### เพิ่มรายงาน
1. สร้าง `/dashboard/reports/page.tsx`
2. สร้าง API สำหรับ analytics
3. เพิ่มกราฟและชาร์ท

## Scripts ที่มีให้ใช้

```bash
# Development
npm run dev                 # เริ่ม dev server
npm run build              # build สำหรับ production
npm run start              # เริ่ม production server

# Database
npm run db:generate        # generate Prisma client
npm run db:push           # push schema ไป DB (dev)
npm run db:migrate        # create และ run migrations
npm run db:studio         # เปิด Prisma Studio GUI

# Utility
npm run lint              # ตรวจสอบ code style
npm run build:clean       # build แบบ clean cache
```

## หมายเหตุสำคัญ

1. **Database**: ต้องมี PostgreSQL server ทำงานอยู่
2. **Environment**: ต้องสร้าง `.env.local` ก่อนใช้งาน
3. **Security**: เปลี่ยน `NEXTAUTH_SECRET` ใน production
4. **Status**: ร้านใหม่จะมีสถานะ `PENDING` รอการอนุมัติ
5. **Roles**: มี 3 roles - `USER`, `RESTAURANT_OWNER`, `ADMIN`

## การแก้ไขปัญหา

### ถ้า Database connection ไม่ได้
1. ตรวจสอบ PostgreSQL server ทำงานไหม
2. ตรวจสอบ `DATABASE_URL` ใน `.env.local`
3. ลอง `npm run db:push` ใหม่

### ถ้า Authentication ไม่ทำงาน  
1. ตรวจสอบ `NEXTAUTH_SECRET` ใน `.env.local`
2. ตรวจสอบ `NEXTAUTH_URL` ให้ตรงกับ domain ที่ใช้
3. ลบ browser cookies แล้วลองใหม่

### ถ้า Pages ไม่แสดง
1. ตรวจสอบ role ของ user ในฐานข้อมูล
2. ตรวจสอบ middleware.ts configuration
3. ดู console logs สำหรับ error messages 