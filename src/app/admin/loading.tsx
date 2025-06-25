import GlobalLoading from '../components/GlobalLoading';

export default function AdminLoading() {
  return (
    <GlobalLoading 
      message="กำลังเข้าสู่ระบบผู้ดูแล..." 
      subMessage="กำลังตรวจสอบสิทธิ์"
    />
  );
} 