'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Container,
  Avatar,
  Chip,
  CircularProgress
} from '@mui/material';
import { Restaurant, Person, Store } from '@mui/icons-material';

export default function RoleSelectionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect ถ้าไม่ได้ login หรือมี role แล้ว
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
      return;
    }
    
    if (session?.user?.role && session.user.role !== 'USER') {
      // ถ้ามี role แล้วให้ redirect ตาม role
      if (session.user.role === 'RESTAURANT_OWNER') {
        router.replace('/restaurant');
      } else if (session.user.role === 'ADMIN') {
        router.replace('/admin');
      } else if (session.user.role === 'CUSTOMER') {
        router.replace('/');
      } else {
        router.replace('/');
      }
    }
  }, [status, session, router]);

  const updateRole = async (newRole: 'RESTAURANT_OWNER' | 'CUSTOMER') => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาด');
      }

      // Update session with new role
      await update();
      
      // Redirect based on role
      if (newRole === 'RESTAURANT_OWNER') {
        router.replace('/restaurant');
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Role update error:', error);
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Don't render if redirecting - ตอนนี้ USER role ไม่ควรมีแล้ว เพราะ default เป็น CUSTOMER
  if (status === 'unauthenticated' || 
      (session?.user?.role && session.user.role !== 'USER')) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3
      }}>
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            {/* User Info */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2
            }}>
              <Avatar 
                src={session?.user?.image || undefined}
                sx={{ 
                  width: 60, 
                  height: 60,
                  backgroundColor: '#06C755'
                }}
              >
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  สวัสดี {session?.user?.name}
                </Typography>
                <Chip 
                  label="LINE" 
                  size="small"
                  sx={{ 
                    background: 'rgba(6, 199, 85, 0.15)',
                    color: '#06C755',
                    fontSize: '0.7rem',
                    border: '1px solid rgba(6, 199, 85, 0.25)'
                  }}
                />
              </Box>
            </Box>

            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
              เลือกประเภทการใช้งาน
            </Typography>

            <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
              กรุณาเลือกประเภทการใช้งานที่เหมาะสมกับคุณ
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Role Options */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Restaurant Owner */}
              <Button
                variant="outlined"
                onClick={() => updateRole('RESTAURANT_OWNER')}
                disabled={loading}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  border: '2px solid',
                  borderColor: '#f97316',
                  color: '#f97316',
                  '&:hover': {
                    backgroundColor: 'rgba(249, 115, 22, 0.05)',
                    borderColor: '#f97316'
                  }
                }}
              >
                <Restaurant sx={{ fontSize: 40 }} />
                <Typography variant="h6" fontWeight={600}>
                  เจ้าของร้านอาหาร
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  จัดการร้านอาหาร เมนู และรับออเดอร์
                </Typography>
              </Button>

              {/* Customer */}
              <Button
                variant="outlined"
                onClick={() => updateRole('CUSTOMER')}
                disabled={loading}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  border: '2px solid',
                  borderColor: '#10B981',
                  color: '#10B981',
                  '&:hover': {
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderColor: '#10B981'
                  }
                }}
              >
                <Person sx={{ fontSize: 40 }} />
                <Typography variant="h6" fontWeight={600}>
                  ลูกค้า
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  สั่งอาหารจากร้านต่างๆ ในระบบ
                </Typography>
              </Button>
            </Box>

            {/* Logout Option */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="text"
                color="secondary"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                size="small"
              >
                ออกจากระบบ
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
} 