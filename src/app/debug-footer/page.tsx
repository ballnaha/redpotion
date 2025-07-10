'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import FooterNavbar from '../components/FooterNavbar';
import { getDefaultRestaurant } from '@/lib/defaultRestaurant';

export default function DebugFooterPage() {
  const router = useRouter();
  const [defaultRestaurant, setDefaultRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaultRestaurant = async () => {
      try {
        setLoading(true);
        const restaurant = await getDefaultRestaurant();
        setDefaultRestaurant(restaurant);
        console.log('Default restaurant loaded:', restaurant);
      } catch (err) {
        setError('ไม่สามารถโหลด default restaurant ได้');
        console.error('Error loading default restaurant:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultRestaurant();
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)',
      pb: 10 // เว้นที่สำหรับ FooterNavbar
    }}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#065f46', fontWeight: 600 }}>
            🔧 Debug FooterNavbar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ทดสอบ FooterNavbar 3 ปุ่ม: เมนู | ประวัติ | โปรไฟล์
          </Typography>
        </Box>

        {/* Default Restaurant Info */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>Default Restaurant:</Typography>
          
          {loading && <Typography>กำลังโหลด...</Typography>}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {defaultRestaurant && (
            <Box>
              <Typography><strong>ID:</strong> {defaultRestaurant.restaurantId}</Typography>
              <Typography><strong>Name:</strong> {defaultRestaurant.restaurantName}</Typography>
              <Typography><strong>Status:</strong> {defaultRestaurant.status}</Typography>
              {defaultRestaurant.liffId && (
                <Typography><strong>LIFF ID:</strong> {defaultRestaurant.liffId}</Typography>
              )}
            </Box>
          )}
        </Paper>

        {/* Test Navigation */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>ทดสอบ Navigation:</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/orders')}
            >
              ไป /orders (ควรไฮไลท์ปุ่ม "ประวัติ")
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={() => router.push('/profile')}
            >
              ไป /profile (ควรไฮไลท์ปุ่ม "โปรไฟล์")
            </Button>
            
            {defaultRestaurant && (
              <Button 
                variant="contained" 
                onClick={() => router.push(`/menu/${defaultRestaurant.restaurantId}`)}
              >
                ไป /menu/{defaultRestaurant.restaurantId} (ควรไฮไลท์ปุ่ม "เมนู")
              </Button>
            )}
          </Box>
        </Paper>

        {/* Current Page Info */}
        <Paper sx={{ p: 2, mt: 3, borderRadius: 2, backgroundColor: '#f8fafc' }}>
          <Typography variant="caption" color="text.secondary">
            หน้าปัจจุบัน: /debug-footer (ไม่มีปุ่มไหนไฮไลท์)
          </Typography>
        </Paper>
      </Box>

      {/* FooterNavbar ที่ปรับปรุงแล้ว */}
      <FooterNavbar restaurantId={defaultRestaurant?.restaurantId} />
    </Box>
  );
} 