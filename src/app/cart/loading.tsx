import GlobalLoading from '../components/GlobalLoading';

export default function CartLoading() {
  return (
    <GlobalLoading 
      message="กำลังโหลดตะกร้าสินค้า..." 
      subMessage="กำลังเตรียมรายการอาหารของคุณ"
    />
  );
} 