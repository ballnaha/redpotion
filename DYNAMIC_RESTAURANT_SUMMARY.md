# สรุปการแก้ไข Hardcode Restaurant ID เป็น Dynamic

## ปัญหาเดิม
- ระบบมี hardcode restaurant ID = `cmcg20f2i00029hu8p2am75df` อยู่ในหลายจุด
- ไม่สามารถขยายระบบให้รองรับร้านอาหารหลายร้านได้
- การเปลี่ยนร้าน default ต้องแก้โค้ดและ deploy ใหม่

## การแก้ไข

### 1. สร้าง Default Restaurant API
**File**: `src/app/api/restaurant/default/route.ts`
- API สำหรับหาร้านอาหารที่มีสถานะ ACTIVE
- เรียงตาม `createdAt` ASC เพื่อเอาร้านแรกที่สร้าง
- Return ข้อมูล: `restaurantId`, `restaurantName`, `status`, `liffId`, `liffUrl`

```typescript
GET /api/restaurant/default
Response: {
  "restaurantId": "cmcg20f2i00029hu8p2am75df",
  "restaurantName": "อุดหนุนชุบ",
  "status": "ACTIVE",
  "liffId": "2007609360-3Z0L8Ekg",
  "liffUrl": "https://liff.line.me/2007609360-3Z0L8Ekg?restaurant=cmcg20f2i00029hu8p2am75df"
}
```

### 2. สร้าง Utility Library
**File**: `src/lib/defaultRestaurant.ts`
- `getDefaultRestaurant()`: ดึงข้อมูลร้าน default
- `getDefaultMenuUrl()`: สร้าง menu URL แบบ dynamic
- `getDefaultLiffUrl()`: สร้าง LIFF URL แบบ dynamic
- `useDefaultRestaurant()`: React hook สำหรับ client-side

### 3. แก้ไขไฟล์ที่มี Hardcode

#### NextAuth Redirect Callback
**File**: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
// เดิม
const defaultMenuUrl = `${baseUrl}/menu/cmcg20f2i00029hu8p2am75df`;

// ใหม่
const defaultRestaurantResponse = await fetch(`${baseUrl}/api/restaurant/default`);
if (defaultRestaurantResponse.ok) {
  const defaultRestaurant = await defaultRestaurantResponse.json();
  const defaultMenuUrl = `${baseUrl}/menu/${defaultRestaurant.restaurantId}`;
}
```

#### LIFF Landing Page
**File**: `src/app/liff/page.tsx`
```typescript
// เดิม
const redirectUrl = '/api/liff/redirect?restaurant=cmcg20f2i00029hu8p2am75df';

// ใหม่
const response = await fetch('/api/restaurant/default');
if (response.ok) {
  const defaultRestaurant = await response.json();
  const redirectUrl = `/api/liff/redirect?restaurant=${defaultRestaurant.restaurantId}`;
}
```

#### Middleware
**File**: `src/middleware.ts`
```typescript
// เดิม
const defaultRestaurantId = 'cmcg20f2i00029hu8p2am75df'
const url = new URL(`/menu/${defaultRestaurantId}`, req.url)

// ใหม่
const url = new URL('/liff', req.url) // ให้ LIFF page หา default restaurant
```

#### LiffHandler Component
**File**: `src/components/LiffHandler.tsx`
```typescript
// เดิม
function LiffLogic({ defaultRestaurantId = 'cmcg20f2i00029hu8p2am75df', children })

// ใหม่
// ดึง default restaurant จาก API ถ้าไม่ได้ส่ง defaultRestaurantId มา
useEffect(() => {
  const fetchDefaultRestaurant = async () => {
    if (defaultRestaurantId) {
      setActualDefaultRestaurantId(defaultRestaurantId);
      return;
    }
    const response = await fetch('/api/restaurant/default');
    if (response.ok) {
      const data = await response.json();
      setActualDefaultRestaurantId(data.restaurantId);
    }
  };
  fetchDefaultRestaurant();
}, [defaultRestaurantId]);
```

#### Test Line Page
**File**: `src/app/test-line/page.tsx`
```typescript
// เดิม
const lineLoginUrl = `/api/auth/signin/line?callbackUrl=${encodeURIComponent('/menu/cmcg20f2i00029hu8p2am75df')}`

// ใหม่
const response = await fetch('/api/restaurant/default');
if (response.ok) {
  const data = await response.json();
  const lineLoginUrl = `/api/auth/signin/line?callbackUrl=${encodeURIComponent(`/menu/${data.restaurantId}`)}`
}
```

## ประโยชน์ที่ได้

### 1. ความยืดหยุ่น (Flexibility)
- เปลี่ยนร้าน default ได้ผ่าน database โดยไม่ต้องแก้โค้ด
- รองรับการมีร้านอาหารหลายร้านใน database

### 2. การขยายระบบ (Scalability)
- เพิ่มร้านใหม่ได้โดยไม่กระทบระบบเดิม
- ร้านที่สร้างก่อนจะเป็น default อัตโนมัติ

### 3. การบำรุงรักษา (Maintainability)
- ลด hardcode values ในโค้ด
- การแก้ไขระบบทำได้ง่ายขึ้น

### 4. Error Handling
- มี fallback กรณีไม่หาร้าน default ได้
- ป้องกัน error จากการไม่มีข้อมูลร้าน

## API Endpoint ใหม่

### GET /api/restaurant/default
ดึงข้อมูลร้านอาหาร default (ACTIVE status)

**Response Success (200)**:
```json
{
  "restaurantId": "cmcg20f2i00029hu8p2am75df",
  "restaurantName": "อุดหนุนชุบ", 
  "status": "ACTIVE",
  "liffId": "2007609360-3Z0L8Ekg",
  "liffUrl": "https://liff.line.me/2007609360-3Z0L8Ekg?restaurant=cmcg20f2i00029hu8p2am75df"
}
```

**Response Error (404)**:
```json
{
  "error": "No active restaurant found"
}
```

## การทดสอบ

```bash
# ทดสอบ API
curl http://localhost:3000/api/restaurant/default

# ทดสอบ LIFF flow
https://liff.line.me/2007609360-3Z0L8Ekg

# ทดสอบ menu redirect
http://localhost:3000/liff
```

## สถานะปัจจุบัน
✅ **เสร็จสิ้น** - ระบบทำงานแบบ dynamic แล้ว
- ไม่มี hardcode restaurant ID แล้ว
- ระบบใช้ API เพื่อหาร้าน default
- รองรับการขยายระบบในอนาคต 