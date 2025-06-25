import GlobalLoading from '../components/GlobalLoading';

export default function RestaurantLoading() {
  return (
    <GlobalLoading 
      message="กำลังโหลดข้อมูลร้านอาหาร..." 
      subMessage="กำลังเตรียมข้อมูลให้คุณ"
    />
  );
} 