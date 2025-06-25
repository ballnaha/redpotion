import GlobalLoading from '../components/GlobalLoading';

export default function RiderLoading() {
  return (
    <GlobalLoading 
      message="กำลังเข้าสู่ระบบไรเดอร์..." 
      subMessage="กำลังเตรียมข้อมูลการส่ง"
    />
  );
} 