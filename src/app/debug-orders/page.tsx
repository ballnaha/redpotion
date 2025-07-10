'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function DebugOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const router = useRouter();

  const loginTestUser = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/debug/login-test-user', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Login สำเร็จ: ${data.user.name} (${data.user.lineUserId})`);
        
        // ตรวจสอบ session หลัง login
        setTimeout(checkSession, 1000);
      } else {
        setMessage(`❌ Login ล้มเหลว: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/line-session', {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      setSessionInfo(data);

      if (data.authenticated) {
        setMessage(`✅ Session ถูกต้อง: ${data.user.name} (lineUserId: ${data.user.lineUserId})`);
      } else {
        setMessage(`❌ Session ไม่ถูกต้อง: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ ตรวจสอบ session ล้มเหลว: ${error}`);
    }
  };

  const testOrdersAPI = async () => {
    try {
      setLoading(true);
      
      if (!sessionInfo?.authenticated) {
        setMessage('❌ กรุณา login ก่อนทดสอบ Orders API');
        return;
      }

      // ทดสอบ Session API แบบมืออาชีพ - ไม่ต้องส่ง parameters
      const response = await fetch('/api/order/my-orders', {
        method: 'GET',
        credentials: 'include', // ส่ง session cookies
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Orders API (Session-based) ทำงาน: พบ ${data.orders.length} ออเดอร์`);
        console.log('Orders data:', data.orders);
      } else {
        setMessage(`❌ Orders API ล้มเหลว: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const goToOrdersPage = () => {
    router.push('/orders');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔧 Debug Orders System
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        ทดสอบระบบ Orders ที่ใช้ Session API แบบมืออาชีพ (ไม่ต้องส่ง user ID ผ่าน URL)
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={loginTestUser}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'กำลัง Login...' : '1. Login Test User'}
        </Button>

        <Button 
          variant="outlined" 
          onClick={checkSession}
          disabled={!sessionInfo?.authenticated}
        >
          2. ตรวจสอบ Session
        </Button>

        <Button 
          variant="outlined" 
          onClick={testOrdersAPI}
          disabled={!sessionInfo?.authenticated}
        >
          3. ทดสอบ Orders API (Session-based)
        </Button>

        <Button 
          variant="contained" 
          color="success"
          onClick={goToOrdersPage}
          disabled={!sessionInfo?.authenticated}
        >
          4. ไปหน้า Orders
        </Button>
      </Box>

      {message && (
        <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {sessionInfo && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Session Info:</Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );
} 