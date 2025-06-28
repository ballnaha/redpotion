# การใช้งาน Global Notification

## วิธีใช้งาน

### 1. Import hook
```typescript
import { useNotification } from '../contexts/NotificationContext';
// หรือ
import { useNotification } from '../hooks/useGlobalNotification';
```

### 2. ใช้งานใน component
```typescript
function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const handleSave = async () => {
    try {
      showInfo('กำลังบันทึกข้อมูล...');
      
      // API call here
      await saveData();
      
      showSuccess('บันทึกข้อมูลสำเร็จ!');
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  return (
    <button onClick={handleSave}>
      บันทึก
    </button>
  );
}
```

### 3. ประเภทการแจ้งเตือน

- **showSuccess(message, duration?)** - แจ้งเตือนสำเร็จ (สีเขียว)
- **showError(message, duration?)** - แจ้งเตือนข้อผิดพลาด (สีแดง)  
- **showWarning(message, duration?)** - แจ้งเตือนคำเตือน (สีส้ม)
- **showInfo(message, duration?)** - แจ้งเตือนข้อมูล (สีน้ำเงิน)

### 4. กำหนดระยะเวลาแสดง (Optional)
```typescript
showSuccess('บันทึกสำเร็จ', 3000); // แสดง 3 วินาที
showError('เกิดข้อผิดพลาด', 10000); // แสดง 10 วินาที
```

## ข้อดีของระบบนี้

✅ **Global State** - snackbar เดียวกันทั้งแอป  
✅ **ใช้งานง่าย** - เรียกใช้ผ่าน hook ได้ทุกที่  
✅ **Performance ดี** - render เพียงครั้งเดียว  
✅ **Consistent Design** - สไตล์เดียวกันทั้งแอป  
✅ **TypeScript Support** - type safety ครบถ้วน  
✅ **Customizable** - ปรับแต่งระยะเวลาได้  

## การปรับแต่ง

### เปลี่ยนตำแหน่งแสดง
แก้ไขใน `NotificationContext.tsx`:
```typescript
anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
```

### เปลี่ยนสไตล์
แก้ไข `sx` props ใน Alert component:
```typescript
sx={{ 
  minWidth: 400,
  fontSize: '1rem',
  // เพิ่ม style ตามต้องการ
}}
``` 