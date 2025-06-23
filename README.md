# Red Potion - Multi-Tenant Food Delivery Platform

แพลตฟอร์มสั่งอาหารออนไลน์แบบ Multi-tenant ที่รองรับการสร้าง subdomain สำหรับร้านอาหารแต่ละร้าน

## 🌟 ฟีเจอร์หลัก

- **Multi-tenant Architecture**: แต่ละร้านอาหารมี subdomain เป็นของตัวเอง
- **Responsive Design**: Mobile-first liquid glass design
- **ระบบจัดการเมนู**: เจ้าของร้านสามารถจัดการเมนูและราคาได้
- **Template ที่ยืดหยุ่น**: ใช้ template เดียวกันแต่ข้อมูลแตกต่างกัน

## 🏪 ระบบ Subdomain

### การเข้าถึงร้านอาหาร

```
Production:
- restaurant1.theredpotion.com → ร้านที่ 1
- restaurant2.theredpotion.com → ร้านที่ 2  
- restaurant3.theredpotion.com → ร้านที่ 3

Development:
- restaurant1.localhost:3000 → ร้านที่ 1
- restaurant2.localhost:3000 → ร้านที่ 2
- restaurant3.localhost:3000 → ร้านที่ 3
```

### ตัวอย่างร้านอาหาร

1. **restaurant1** - ข้าวแกงใต้แท้
   - อาหารใต้รสจัดจ้าน
   - แกงส้มปลาช่อน, แกงไตปลา
   
2. **restaurant2** - ซูชิ โตเกียว  
   - ซูชิสไตล์ญี่ปุ่นแท้
   - ซูชิแซลมอน, ซูชิทูน่า
   
3. **restaurant3** - เจ๊หนู ส้มตำ
   - อาหารอีสานต้นตำรับ
   - ส้มตำไทย, ลาบหมู

## 🚀 การติดตั้งและใช้งาน

### ติดตั้ง Dependencies

```bash
npm install --legacy-peer-deps
```

### รัน Development Server

```bash
npm run dev
```

### การทดสอบ Subdomain ใน Local

เพิ่ม hosts ในไฟล์ `C:\Windows\System32\drivers\etc\hosts` (Windows) หรือ `/etc/hosts` (Mac/Linux):

```
127.0.0.1 restaurant1.localhost
127.0.0.1 restaurant2.localhost  
127.0.0.1 restaurant3.localhost
```

แล้วเข้าถึงผ่าน:
- http://restaurant1.localhost:3000
- http://restaurant2.localhost:3000
- http://restaurant3.localhost:3000

## 📂 โครงสร้างไฟล์

```
src/
├── app/
│   ├── restaurant-site/
│   │   └── [restaurantId]/
│   │       ├── layout.tsx          # Layout สำหรับร้านอาหาร
│   │       ├── page.tsx            # หน้าหลักร้านอาหาร
│   │       ├── admin/
│   │       │   └── page.tsx        # หน้าจัดการเมนู
│   │       └── context/
│   │           └── RestaurantContext.tsx  # Context สำหรับข้อมูลร้าน
│   ├── customer/                   # หน้าลูกค้า (แอปหลัก)
│   ├── admin/                      # หน้า Admin ระบบ
│   └── ...
├── middleware.ts                   # Middleware สำหรับ subdomain routing
└── ...
```

## 🔧 การตั้งค่า

### Next.js Configuration (next.config.ts)

```typescript
async rewrites() {
  return [
    {
      source: '/(.*)',
      has: [
        {
          type: 'host',
          value: '(?<restaurant>restaurant\\d+)\\.theredpotion\\.com',
        },
      ],
      destination: '/restaurant-site/:restaurant/:path*',
    },
  ];
}
```

### Middleware (middleware.ts)

จัดการ subdomain routing และ rewrite URL ไปยัง path ที่ถูกต้อง

## 🎨 การปรับแต่ง Theme

แต่ละร้านสามารถมี theme สีที่แตกต่างกัน:

```typescript
theme: {
  primaryColor: '#e53e3e',    // สีหลัก
  secondaryColor: '#fc8181',  // สีรอง
}
```

## 📱 ฟีเจอร์สำหรับร้านอาหาร

- ✅ แสดงเมนูอาหารพร้อมรูปภาพ
- ✅ ระบบราคาและส่วนลด
- ✅ จัดการสถานะความพร้อมของเมนู
- ✅ ระบบแท็กและหมวดหมู่
- ✅ ข้อมูลติดต่อและเวลาเปิด-ปิด
- ✅ Shopping cart
- ✅ หน้า Admin จัดการเมนู

## 📱 ฟีเจอร์สำหรับลูกค้า

- ✅ เลือกดูร้านอาหารต่างๆ
- ✅ สั่งอาหารจากหลายร้าน
- ✅ ติดตาม order
- ✅ ระบบรีวิวและคะแนน

## 🚀 Deployment

### DNS Configuration

ตั้งค่า DNS wildcard record:

```
*.theredpotion.com CNAME yourapp.vercel.app
```

### Environment Variables

```
NEXT_PUBLIC_APP_URL=https://theredpotion.com
```

## 🔐 การรักษาความปลอดภัย

- ✅ Middleware validation
- ✅ Restaurant data isolation  
- ✅ Admin authentication (coming soon)
- ✅ API rate limiting (coming soon)

## 📄 License

MIT License
