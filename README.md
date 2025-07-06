# Red Potion - Food Delivery Platform

## สำคัญ: LIFF Configuration Troubleshooting

### LIFF ID Error แก้ไขแล้ว ✅

ระบบได้รับการปรับปรุงให้จัดการกับ LIFF ID error อย่างมีประสิทธิภาพ:

#### 🔧 การตั้งค่า LIFF ID ที่ถูกต้อง

1. **Environment Variable**: ตั้งค่า `NEXT_PUBLIC_LIFF_ID` ใน `.env.local`
   ```
   NEXT_PUBLIC_LIFF_ID=1234567890-AbCdEfGh
   ```

2. **LIFF ID Format**: ต้องเป็น format `nnnnnnnnnn-xxxxxxxx` (10 digits - 8 characters)

#### 🚨 Error Messages ที่แก้ไขแล้ว

- **Invalid LIFF ID format**: ระบบจะตรวจสอบ format ก่อน init
- **Network timeout**: เพิ่ม retry mechanism และ progressive backoff
- **Already initialized**: จัดการ case ที่ LIFF init ซ้ำ
- **Missing LIFF ID**: Fallback ไป development LIFF ID

#### 🛠 Validation Functions ใหม่

```typescript
// ตรวจสอบ LIFF ID format
import { validateLiffId, getValidatedLiffId } from '@/lib/liffUtils';

const { liffId, error } = getValidatedLiffId();
if (!liffId) {
  console.error('LIFF Config Error:', error);
}
```

#### 🔍 Debug Tools

- **Development Mode**: แสดง LIFF configuration status
- **LineAuthDebug Component**: แสดงสถานะ validation และ environment variables
- **Error Details**: แสดง error message ที่ชัดเจนและแนวทางแก้ไข

#### 📋 การแก้ไขสำคัญ

1. **Centralized LIFF Config**: รวม validation ไว้ใน `liffUtils.ts`
2. **Better Error Handling**: แยกประเภท error และให้คำแนะนำเฉพาะ
3. **Progressive Retry**: ลองใหม่แบบช้าลงเรื่อยๆ
4. **Fallback System**: ใช้ development LIFF ID เมื่อ production config ผิด

#### 🚀 วิธีการใช้งาน

```bash
# ตั้งค่า environment variable
echo "NEXT_PUBLIC_LIFF_ID=your-liff-id-here" >> .env.local

# รัน development server
npm run dev
```

หากยังพบปัญหา LIFF error สามารถเปิด Debug Mode ใน development เพื่อดูรายละเอียดการตั้งค่า

### 🔄 LIFF Session Persistence - แก้ไข LIFF Status หลุดหลัง Refresh ✅

ปัญหาที่ LIFF status หลุดหลังจาก refresh หน้าเว็บได้รับการแก้ไขด้วยระบบ auto-restore:

#### 🚨 ปัญหาที่แก้ไขแล้ว

- **LIFF Status หลุดหลัง refresh**: เพิ่ม auto-restore mechanism
- **LIFF SDK ไม่โหลด**: ระบบจะโหลด SDK ใหม่อัตโนมัติ
- **Session ไม่ persistent**: บันทึก LIFF session ใน localStorage
- **Debug information**: แสดงสถานะ LIFF แบบละเอียด

#### 🛠 Auto-Restore Features

1. **LIFF SDK Auto-Loading**: โหลด LIFF SDK ใหม่หลัง refresh
2. **Session Persistence**: บันทึก LIFF session ใน localStorage (24 ชั่วโมง)
3. **Smart Re-initialization**: ตรวจสอบและ initialize LIFF ใหม่เมื่อจำเป็น
4. **Activity Tracking**: รีเฟรช session timestamp เมื่อมี user activity

#### 🔍 Debug Tools ปรับปรุงใหม่

```typescript
// เปิด debug mode ใน development
process.env.NODE_ENV === 'development' && <LineAuthDebug show={true} />
```

**ฟีเจอร์ Debug:**
- ✅ **LIFF Status**: แสดงสถานะ initialization, login, methods
- 🧪 **Test Restore**: ทดสอบการกู้คืน session
- 🔄 **Re-init LIFF**: ทดสอบการ initialize LIFF ใหม่
- 📊 **Real-time Status**: อัพเดทสถานะแบบ real-time

#### 📋 การทำงานของระบบ

1. **หลัง Refresh**: ระบบจะตรวจสอบ LIFF session ที่บันทึกไว้
2. **Auto-Restore**: กู้คืน session หากยังไม่หมดอายุ
3. **LIFF Re-init**: Initialize LIFF SDK ใหม่หากจำเป็น
4. **Fallback**: Redirect ไป login หาก session หมดอายุ

#### 🔧 การใช้งาน

```bash
# ตรวจสอบสถานะ LIFF หลัง refresh
1. เปิด Debug Mode ใน development
2. Refresh หน้าเว็บ
3. ดูว่า LIFF status เปลี่ยนจาก "Not Ready" เป็น "Ready"
4. ตรวจสอบ console logs สำหรับ auto-restore process
```

ตอนนี้ LIFF จะไม่หลุดหลัง refresh แล้วและมี debug tools ให้ตรวจสอบสถานะได้แบบ real-time 🎯 