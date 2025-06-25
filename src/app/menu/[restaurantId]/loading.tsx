import GlobalLoading from '../../components/GlobalLoading';

export default function MenuItemLoading() {
  return (
    <GlobalLoading 
      message="กำลังโหลดเมนูอาหาร..." 
      subMessage="เตรียมรายการอาหารให้คุณ"
    />
  );
} 