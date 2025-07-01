'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Card, Alert, Button } from '@mui/material';

export default function LiffLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            // ตรวจสอบสาเหตุที่ไม่มีร้าน default
            const errorData = await response.json().catch(() => ({}));
            console.log('🚀 LIFF Landing: No default restaurant, checking for pending restaurants');
            
            // ตรวจสอบว่ามีร้านอาหารที่ยังรออนุมัติหรือไม่
            const pendingResponse = await fetch('/api/admin/restaurants/pending').catch(() => null);
            if (pendingResponse?.ok) {
              const pendingRestaurants = await pendingResponse.json();
              if (pendingRestaurants.length > 0) {
                setError('pending');
                setIsLoading(false);
                return;
              }
            }
            
            // ถ้าไม่มีร้านเลย
            setError('no_restaurant');
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error fetching default restaurant:', error);
          setError('connection_error');
          setIsLoading(false);
        }
      }
    };

    handleRedirect();
  }, [router, searchParams]);

  // แสดง error state ตามสถานการณ์
  if (error) {
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
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
            filter: 'blur(40px)',
            animation: 'liquidFloat 6s ease-in-out infinite'
          }}
        />

        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            p: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {error === 'pending' && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.2)',
                '& .MuiAlert-icon': { color: '#2196f3' }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                🎉 ขอบคุณที่สมัครร่วมกับเรา!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ร้านอาหารของคุณอยู่ในระหว่างการตรวจสอบ<br/>
                <strong>กำลังรอการอนุมัติจาก admin</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                📋 ระยะเวลาดำเนินการ: ภายใน 1-2 วันทำการ<br/>
                📧 เราจะแจ้งผลผ่านอีเมลเมื่อการตรวจสอบเสร็จสิ้น<br/>
                🔍 กำลังตรวจสอบ: เอกสาร, ข้อมูลร้าน, และความถูกต้องของข้อมูล
              </Typography>
            </Alert>
          )}

          {error === 'no_restaurant' && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3,
                background: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                '& .MuiAlert-icon': { color: '#ff9800' }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                🏪 ยังไม่มีร้านอาหารในระบบ
              </Typography>
              <Typography variant="body1">
                ขณะนี้ยังไม่มีร้านอาหารที่เปิดให้บริการ<br/>
                กรุณาลองใหม่อีกครั้งในภายหลัง
              </Typography>
            </Alert>
          )}

          {error === 'connection_error' && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.2)',
                '& .MuiAlert-icon': { color: '#f44336' }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                ⚠️ เกิดข้อผิดพลาด
              </Typography>
              <Typography variant="body1">
                ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้<br/>
                กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
              sx={{ 
                background: 'linear-gradient(135deg, #06C755 0%, #05B04A 100%)',
                boxShadow: '0 4px 16px rgba(6, 199, 85, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #05B04A 0%, #049A3F 100%)',
                }
              }}
            >
              ลองใหม่อีกครั้ง
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/')}
              sx={{ 
                borderColor: 'rgba(6, 199, 85, 0.5)',
                color: '#06C755',
                '&:hover': {
                  borderColor: '#06C755',
                  background: 'rgba(6, 199, 85, 0.1)'
                }
              }}
            >
              ไปหน้าแรก
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  // แสดง loading state
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