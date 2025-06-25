'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRestaurant } from './context/RestaurantContext';
import MenuPageComponent from './MenuPageComponent';
import GlobalLoading from '../../components/GlobalLoading';

export default function ClientMenuPage() {
  const [mounted, setMounted] = useState(false);
  const { loading, error, restaurant } = useRestaurant();

  useEffect(() => {
    setMounted(true);
    
    // Force reload in development for better hot reloading
    if (process.env.NODE_ENV === 'development') {
      console.log('ClientMenuPage mounted');
    }
  }, []);

  // แสดง GlobalLoading ที่มี Red Potion logo เฉพาะเมื่อยัง mount ไม่เสร็จ หรือกำลังโหลดข้อมูลร้าน
  if (!mounted || loading) {
    return (
      <GlobalLoading 
        message="กำลังโหลดเมนูอาหาร..." 
        subMessage="เตรียมรายการอาหารให้คุณ"
      />
    );
  }

  return <MenuPageComponent />;
} 