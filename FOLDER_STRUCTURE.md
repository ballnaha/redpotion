# โครงสร้างการจัดเก็บรูปภาพใน Red Potion

## โครงสร้าง Folder

รูปภาพทั้งหมดจะถูกจัดเก็บในโครงสร้าง folder ที่เป็นระเบียบดังนี้:

```
restaurants/
├── {restaurantId}/
│   ├── profile/           # รูปโลโก้และรูปโปรไฟล์ร้าน
│   │   ├── avatar_*.jpg   # รูปโลโก้ร้าน (400x400px)
│   │   └── ...
│   ├── banner/            # รูปหน้าปกร้าน
│   │   ├── banner_*.jpg   # รูปหน้าปก (1920x1080px, 16:9)
│   │   └── ...
│   ├── menu/              # รูปภาพเมนูอาหาร
│   │   ├── avatar_*.jpg   # รูปเมนู (400x400px)
│   │   └── ...
│   └── general/           # รูปภาพทั่วไป
│       └── ...
└── temp/                  # ไฟล์ชั่วคราว (สำหรับกรณีไม่ระบุ restaurantId)
    └── ...
```

## รูปแบบการตั้งชื่อไฟล์

```
{variant}_{timestamp}_{random}.jpg
```

### ตัวอย่าง:
- `avatar_1703123456789_a1b2c3.jpg`
- `banner_1703123456789_d4e5f6.jpg`

## ขนาดรูปภาพมาตรฐาน

### Profile Avatar
- **ขนาด**: 400x400px (สี่เหลี่ยมจัตุรัส)
- **ใช้สำหรับ**: โลโก้ร้าน, รูปเมนู
- **Quality**: 85% JPEG

### Banner
- **ขนาด**: 1920x1080px (อัตราส่วน 16:9)
- **ใช้สำหรับ**: หน้าปกร้าน
- **Quality**: 85% JPEG

## API Endpoint

### Upload Image
```
POST /api/restaurant/upload-image
Content-Type: multipart/form-data

Body:
- file: File (รูปภาพ)
- category: string ('profile' | 'menu' | 'banner' | 'temp')
- variant: string ('avatar' | 'banner')
```

### Response
```json
{
  "success": true,
  "imageUrl": "data:image/jpeg;base64,...",
  "metadata": {
    "restaurantId": "rest_123",
    "category": "banner", 
    "variant": "banner",
    "fileName": "banner_1703123456789_a1b2c3.jpg",
    "folder": "restaurants/rest_123/banner",
    "fullPath": "restaurants/rest_123/banner/banner_1703123456789_a1b2c3.jpg"
  }
}
```

## การใช้งาน

### ใน RestaurantProfileModal
```tsx
<ImageUpload
  currentImageUrl={formData.imageUrl}
  onImageChange={(url) => setFormData({...formData, imageUrl: url})}
  restaurantId={restaurant?.id}
  category="banner"
  variant="banner"
/>
```

### ใน AddMenuModal  
```tsx
<ImageUpload
  currentImageUrl={formData.imageUrl}
  onImageChange={(url) => setFormData({...formData, imageUrl: url})}
  category="menu"
  variant="avatar"
/>
```

## การตั้งค่า Cloudinary (Production)

เมื่อพร้อมใช้งานจริง แก้ไข environment variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret
```

และเปิดใช้งานโค้ด Cloudinary ใน `/api/restaurant/upload-image/route.ts`

## ข้อดีของโครงสร้างนี้

1. **เป็นระเบียบ**: แยกไฟล์ตามร้านและประเภท
2. **ง่ายต่อการจัดการ**: สามารถลบไฟล์ทั้งร้านได้ง่าย
3. **รองรับการขยาย**: เพิ่ม category ใหม่ได้
4. **ประสิทธิภาพ**: จัดกลุ่มไฟล์ที่เกี่ยวข้องกัน
5. **ความปลอดภัย**: แยกข้อมูลร้านชัดเจน 