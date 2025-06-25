'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRestaurant } from './context/RestaurantContext';
import MenuPageComponent from './MenuPageComponent';

export default function ClientMenuPage() {
  const [mounted, setMounted] = useState(false);
  const { loading, error } = useRestaurant();

  useEffect(() => {
    setMounted(true);
    
    // Force reload in development for better hot reloading
    if (process.env.NODE_ENV === 'development') {
      console.log('ClientMenuPage mounted');
    }
  }, []);

  // แสดง loading เฉพาะเมื่อยัง mount ไม่เสร็จ
  if (!mounted) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
      }}>
        <CircularProgress sx={{ color: '#10B981' }} />
        <Typography sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.9rem' }}>
          กำลังโหลดเมนูอาหาร...
        </Typography>
      </Box>
    );
  }

  return <MenuPageComponent />;
} 