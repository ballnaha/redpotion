'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Card } from '@mui/material';

export default function LiffLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleRedirect = async () => {
      // ตรวจสอบ restaurant parameter จาก URL
      const restaurantId = searchParams.get('restaurant');
      
      if (restaurantId) {
        // ถ้ามี restaurant ID ให้ redirect ไปยังร้านนั้น
        const targetUrl = `/menu/${restaurantId}?liff=true`;
        console.log('🚀 LIFF Landing: Redirecting to specific restaurant', targetUrl);
        router.replace(targetUrl);
      } else {
        // ถ้าไม่มี restaurant ID ให้หาร้าน default จาก API
        try {
          const response = await fetch('/api/restaurant/default');
          if (response.ok) {
            const defaultRestaurant = await response.json();
            const redirectUrl = `/api/liff/redirect?restaurant=${defaultRestaurant.restaurantId}`;
            console.log('🚀 LIFF Landing: Using default restaurant from DB', redirectUrl);
            router.replace(redirectUrl);
          } else {
            // ถ้าไม่หาร้าน default ได้ ให้ไปหน้าแรก
            console.log('🚀 LIFF Landing: No default restaurant, redirecting to home');
            router.replace('/');
          }
        } catch (error) {
          console.error('Error fetching default restaurant:', error);
          router.replace('/');
        }
      }
    };

    handleRedirect();
  }, [router, searchParams]);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.1) 0%, rgba(5, 176, 74, 0.05) 100%)',
          filter: 'blur(40px)',
          animation: 'liquidFloat 6s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.1) 0%, rgba(5, 176, 74, 0.05) 100%)',
          filter: 'blur(60px)',
          animation: 'liquidFloat 8s ease-in-out infinite reverse'
        }}
      />

      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
          p: 5,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInUp 0.6s ease-out both'
        }}
      >
        {/* Shimmer effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            animation: 'shimmer 2s infinite'
          }}
        />

        {/* Loading Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.2) 0%, rgba(5, 176, 74, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '2px solid rgba(6, 199, 85, 0.2)',
            animation: 'liquidFloat 3s ease-in-out infinite'
          }}
        >
          <CircularProgress 
            size={40} 
            sx={{ 
              color: '#06C755',
              filter: 'drop-shadow(0 2px 8px rgba(6, 199, 85, 0.3))'
            }} 
          />
        </Box>

        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            mb: 2,
            color: 'rgba(0, 0, 0, 0.9)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            '@media (max-width: 600px)': {
              fontSize: '1.25rem'
            }
          }}
        >
          เริ่มต้นใช้งาน
        </Typography>

        <Typography 
          sx={{ 
            color: 'rgba(0, 0, 0, 0.7)',
            lineHeight: 1.6,
            fontSize: '1rem',
            '@media (max-width: 600px)': {
              fontSize: '0.9rem'
            }
          }}
        >
          กำลังเตรียมความพร้อม...
        </Typography>
      </Card>
    </Box>
  );
} 