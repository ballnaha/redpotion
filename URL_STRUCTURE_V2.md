# 🏗️ โครงสร้าง URL ใหม่สำหรับ Multi-Role System

## 📋 ปัญหาปัจจุบัน

โครงสร้าง `/r/{uuid}` ไม่ชัดเจนในการแยก role และอาจสร้างความสับสนได้:

```
❌ ปัญหา:
/r/550e8400-e29b-41d4-a716-446655440001
└── นี่คือหน้าลูกค้า หรือ admin หรือ rider?
```

## 🎯 โครงสร้างใหม่ที่แนะนำ

### 1. แยกตาม Role ก่อน แล้วค่อย Restaurant

```
📱 CUSTOMER (ลูกค้า)
/menu/{uuid}                    → หน้าเมนูร้าน (สำหรับลูกค้า)
/menu/{uuid}/cart              → ตะกร้าสินค้า
/menu/{uuid}/checkout          → สั่งซื้อ

🏪 RESTAURANT OWNER (เจ้าของร้าน)
/restaurant/{uuid}             → Dashboard เจ้าของร้าน
/restaurant/{uuid}/menu        → จัดการเมนู
/restaurant/{uuid}/orders      → จัดการออเดอร์
/restaurant/{uuid}/analytics   → รายงานยอดขาย
/restaurant/{uuid}/settings    → ตั้งค่าร้าน

🚴 RIDER (ไรเดอร์)
/rider                         → Dashboard ไรเดอร์
/rider/orders                  → รายการออเดอร์ที่รับ
/rider/delivery/{orderId}      → หน้าส่งของ
/rider/earnings                → รายได้

👑 ADMIN (ผู้ดูแลระบบ)
/admin                         → Dashboard admin ระบบ
/admin/restaurants             → จัดการร้านทั้งหมด
/admin/restaurants/{uuid}      → ดูรายละเอียดร้าน
/admin/riders                  → จัดการไรเดอร์
/admin/analytics               → รายงานระบบ
```

### 2. URL Examples

```
✅ ลูกค้าดูเมนู:
localhost:3000/menu/550e8400-e29b-41d4-a716-446655440001

✅ เจ้าของร้านจัดการ:
localhost:3000/restaurant/550e8400-e29b-41d4-a716-446655440001

✅ ไรเดอร์ส่งของ:
localhost:3000/rider/delivery/order-12345

✅ Admin ดูร้าน:
localhost:3000/admin/restaurants/550e8400-e29b-41d4-a716-446655440001
```

## 🔐 ระบบ Permission & Security

### 1. Route Protection

```typescript
// middleware.ts
const roleBasedRoutes = {
  '/menu/*': ['customer', 'guest'],
  '/restaurant/*': ['restaurant_owner'],
  '/rider/*': ['rider'],
  '/admin/*': ['admin']
};
```

### 2. Restaurant Access Control

```typescript
// ตรวจสอบว่า restaurant owner สามารถเข้าถึงร้านนี้ได้ไหม
const canAccessRestaurant = (userId: string, restaurantId: string) => {
  return restaurants[restaurantId]?.ownerId === userId;
};
```

## 🏗️ File Structure

```
src/app/
├── menu/[restaurantId]/
│   ├── layout.tsx              → Layout สำหรับลูกค้า
│   ├── page.tsx                → หน้าเมนู
│   ├── cart/
│   │   └── page.tsx            → ตะกร้าสินค้า
│   └── checkout/
│       └── page.tsx            → สั่งซื้อ
│
├── restaurant/[restaurantId]/
│   ├── layout.tsx              → Layout สำหรับเจ้าของร้าน
│   ├── page.tsx                → Dashboard
│   ├── menu/
│   │   └── page.tsx            → จัดการเมนู
│   ├── orders/
│   │   └── page.tsx            → จัดการออเดอร์
│   ├── analytics/
│   │   └── page.tsx            → รายงาน
│   └── settings/
│       └── page.tsx            → ตั้งค่า
│
├── rider/
│   ├── layout.tsx              → Layout สำหรับไรเดอร์
│   ├── page.tsx                → Dashboard ไรเดอร์
│   ├── orders/
│   │   └── page.tsx            → รายการออเดอร์
│   ├── delivery/[orderId]/
│   │   └── page.tsx            → หน้าส่งของ
│   └── earnings/
│       └── page.tsx            → รายได้
│
└── admin/
    ├── layout.tsx              → Layout สำหรับ Admin
    ├── page.tsx                → Dashboard Admin
    ├── restaurants/
    │   ├── page.tsx            → รายการร้าน
    │   └── [restaurantId]/
    │       └── page.tsx        → รายละเอียดร้าน
    ├── riders/
    │   └── page.tsx            → จัดการไรเดอร์
    └── analytics/
        └── page.tsx            → รายงานระบบ
```

## 🎨 UI/UX Design

### 1. Navigation Bar แยกตาม Role

```typescript
// Customer Navigation
const CustomerNav = () => (
  <nav>
    <Link href="/menu/{restaurantId}">เมนู</Link>
    <Link href="/menu/{restaurantId}/cart">ตะกร้า</Link>
    <Link href="/orders">ออเดอร์ของฉัน</Link>
  </nav>
);

// Restaurant Owner Navigation  
const RestaurantNav = () => (
  <nav>
    <Link href="/restaurant/{restaurantId}">Dashboard</Link>
    <Link href="/restaurant/{restaurantId}/menu">จัดการเมนู</Link>
    <Link href="/restaurant/{restaurantId}/orders">ออเดอร์</Link>
    <Link href="/restaurant/{restaurantId}/analytics">รายงาน</Link>
  </nav>
);
```

### 2. Theme แยกตาม Role

```typescript
const themes = {
  customer: {
    primaryColor: '#10b981',    // เขียว - เน้นการสั่งอาหาร
    layout: 'mobile-first'
  },
  restaurant: {
    primaryColor: '#3b82f6',    // น้ำเงิน - เน้นการจัดการ
    layout: 'dashboard'
  },
  rider: {
    primaryColor: '#f59e0b',    // ส้ม - เน้นการส่งของ
    layout: 'mobile-optimized'
  },
  admin: {
    primaryColor: '#6366f1',    // ม่วง - เน้นการควบคุม
    layout: 'full-dashboard'
  }
};
```

## 🔄 Migration Path

### Phase 1: สร้าง Structure ใหม่
```bash
# สร้าง folders ใหม่
mkdir -p src/app/menu/[restaurantId]
mkdir -p src/app/restaurant/[restaurantId]  
mkdir -p src/app/rider
mkdir -p src/app/admin
```

### Phase 2: Redirect เก่าไปใหม่
```typescript
// middleware.ts
if (pathname.startsWith('/r/')) {
  // Redirect /r/{uuid} → /menu/{uuid}
  return NextResponse.redirect(`/menu/${restaurantId}`);
}
```

### Phase 3: ลบ /r/ Structure เก่า
```bash
# หลังจากทดสอบแล้ว
rm -rf src/app/r
```

## 📊 เปรียบเทียบ URL Structures

| Scenario | ปัจจุบัน (❌) | ใหม่ (✅) |
|----------|-------------|---------|
| ลูกค้าดูเมนู | /r/{uuid} | /menu/{uuid} |
| เจ้าของร้านจัดการ | /r/{uuid}/admin | /restaurant/{uuid} |
| ไรเดอร์ส่งของ | ??? | /rider/delivery/{orderId} |
| Admin ดูร้าน | /admin/restaurants/{uuid} | /admin/restaurants/{uuid} |

## 🎯 ประโยชน์

### 1. ชัดเจนขึ้น
- URL บอกได้ทันทีว่าหน้านี้สำหรับ role ไหน
- ลดความสับสน Developer และ User

### 2. ปลอดภัยขึ้น  
- แยก permission ตาม role ได้ง่าย
- ป้องกันการเข้าถึงข้ามสิทธิ์

### 3. Scalable
- เพิ่ม role ใหม่ได้ง่าย
- แยก feature ตาม business logic

### 4. SEO Friendly
- URL meaningful และอ่านเข้าใจง่าย
- เหมาะกับ search engine

## 💡 Recommendation

ควรใช้โครงสร้างใหม่นี้เพราะ:

1. **ชัดเจน**: แต่ละ URL บอกได้ทันทีว่าใครใช้
2. **ปลอดภัย**: แยก permission ได้ดี
3. **บำรุงรักษาง่าย**: แยก concern ชัดเจน
4. **ขยายได้**: เพิ่ม role ใหม่ง่าย

---

**สรุป**: โครงสร้าง URL ควรเริ่มด้วย role ก่อน แล้วค่อยระบุ resource ที่เฉพาะเจาะจง นี่จะทำให้ระบบมีความชัดเจนและปลอดภัยมากขึ้น 