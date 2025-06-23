# RedPotion - Food Delivery Platform

แพลตฟอร์มส่งอาหารครบวงจรที่รองรับ 4 กลุ่มผู้ใช้: ลูกค้า, ร้านอาหาร, ไรเดอร์, และผู้ดูแลระบบ

## ✨ คุณสมบัติหลัก

- 🛒 **Customer App**: สั่งอาหารจากร้านดังในพื้นที่
- 🍕 **Restaurant Dashboard**: จัดการร้านอาหาร เมนู และออเดอร์
- 🚴 **Rider App**: รับงานส่งอาหาร แผนที่ GPS
- 👨‍💼 **Admin Panel**: จัดการระบบ รายงาน และสถิติ
- 📱 **LINE LIFF Integration**: เชื่อมต่อกับ LINE สำหรับร้านอาหารแต่ละร้าน
- 🏪 **Multi-tenant**: แต่ละร้านอาหารมี subdomain แยกกัน

## 🏗️ โครงสร้างโปรเจค

```
src/
├── app/
│   ├── customer/              # หน้าลูกค้า
│   │   ├── components/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── restaurant/            # หน้าร้านอาหาร
│   │   ├── components/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── rider/                 # หน้าไรเดอร์
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/                 # หน้าแอดมิน
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Shared components
│   │   ├── ThemeRegistry.tsx
│   │   └── EmotionCache.tsx
│   ├── theme/                 # MUI Theme
│   │   └── theme.ts
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── types/                     # TypeScript types
│   └── liff.d.ts
└── ...
```

## 🎨 Design System

- **UI Library**: Material-UI (MUI) v7
- **Layout**: Liquid Glass Design
- **Components**: ใช้ Box แทน Grid เพื่อความกว้างเต็มพื้นที่
- **Theme**: Custom glassmorphism theme
- **Responsive**: Mobile-first approach

## 🚀 เริ่มต้นใช้งาน

### 1. Clone และติดตั้ง dependencies

```bash
git clone <repository-url>
cd redpotion
npm install
```

### 2. ตั้งค่า Environment Variables

```bash
cp .env.example .env.local
```

แก้ไขค่าตัวแปรใน `.env.local`:

```env
NEXT_PUBLIC_LIFF_ID=your-line-liff-id-here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. รันโปรเจค

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## 📱 LINE LIFF Integration

### การตั้งค่า LINE LIFF

1. สร้าง LINE Developers Account
2. สร้าง Provider และ Channel
3. เพิ่ม LIFF App สำหรับแต่ละร้านอาหาร
4. กำหนด Endpoint URL สำหรับแต่ละ subdomain

### Subdomain Structure

```
main.redpotion.com          # หน้าแรก
customer.redpotion.com      # ลูกค้า
admin.redpotion.com         # แอดมิน
rider.redpotion.com         # ไรเดอร์

# ร้านอาหารแต่ละร้าน
restaurant1.redpotion.com   # ร้านที่ 1
restaurant2.redpotion.com   # ร้านที่ 2
som-tam-nang-ram.redpotion.com  # ร้านส้มตำนางรำ
```

## 🛠️ การพัฒนา

### การเพิ่ม Component ใหม่

```tsx
// ใช้ Box แทน Grid
import { Box } from '@mui/material';

function MyComponent() {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* เนื้อหา */}
    </Box>
  );
}
```

### Glassmorphism Design

```tsx
// ใช้ theme.custom.glassmorphism
const theme = useTheme();

<Box sx={{
  ...theme.custom.glassmorphism,
  p: 3
}}>
  {/* เนื้อหา */}
</Box>
```

### ป้องกัน Hydration Issues

```tsx
'use client';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return <div>Component content</div>;
}
```

## 🌟 Features อนาคต

- [ ] Real-time order tracking
- [ ] Payment integration
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Chat support
- [ ] Inventory management
- [ ] Loyalty program

## 📋 To-Do List

- [ ] API Integration
- [ ] Database Schema
- [ ] Authentication System
- [ ] Payment Gateway
- [ ] Testing Setup
- [ ] Deployment Configuration
- [ ] Performance Optimization
- [ ] SEO Optimization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

- Email: support@redpotion.com
- Website: https://redpotion.com
- LINE: @redpotion
