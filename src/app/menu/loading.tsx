import GlobalLoading from '../components/GlobalLoading';

export default function MenuLoading() {
  return (
    <GlobalLoading 
      message="กำลังโหลดเมนูอาหาร..." 
      subMessage="เตรียมรายการอาหารให้คุณ"
    />
  );
} 