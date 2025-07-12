'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  ContentCopy, 
  OpenInNew, 
  PhoneAndroid,
  Link as LinkIcon,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNotification } from '../../../contexts/NotificationContext';
import { createLiffUrl, createQRCodeUrl } from '@/lib/liffUtils';

interface RestaurantData {
  id: string;
  name: string;
  status: string;
  liffId?: string;
}

interface LiffData {
  restaurantId: string;
  restaurantName: string;
  liffId?: string;
  liffUrl?: string;
  status: string;
}

// SWR fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('ไม่พบข้อมูลร้านอาหาร กรุณาติดต่อผู้ดูแลระบบ');
    }
    throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลร้าน');
  }
  return response.json();
};

export default function LiffSetupPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  
  // SWR for restaurant data
  const { 
    data: restaurant, 
    error: restaurantError, 
    isLoading: loadingRestaurant 
  } = useSWR<RestaurantData>(
    session?.user?.id ? '/api/restaurant/my-restaurant' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60 * 1000,
    }
  );

  // SWR for LIFF data
  const { 
    data: liffData, 
    error: liffError, 
    isLoading: loadingLiff,
    mutate: refreshLiff
  } = useSWR<LiffData>(
    restaurant?.id ? `/api/restaurant/${restaurant.id}/liff` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60 * 1000,
    }
  );

  // Redirect if not authenticated or not restaurant owner
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (sessionStatus === 'unauthenticated') {
      router.replace('/auth/signin');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER') {
      router.replace('/');
    }
  }, [sessionStatus, session?.user?.role, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('คัดลอกแล้ว!');
  };

  const generateLiffUrl = () => {
    if (!liffData?.liffId || !restaurant) return '';
    return `https://liff.line.me/${liffData.liffId}?restaurant=${restaurant.id}`;
  };

  // Show loading while session is loading
  if (sessionStatus === 'loading') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Don't render if not authenticated or wrong role
  if (sessionStatus === 'unauthenticated' || 
      (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER')) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Show loading while fetching data
  if (loadingRestaurant || loadingLiff) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Show error if restaurant not found
  if (restaurantError || !restaurant) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">
          {restaurantError?.message || 'ไม่พบข้อมูลร้านอาหาร กรุณาสร้างร้านอาหารก่อน'}
        </Alert>
      </Box>
    );
  }

  // Show simplified view for non-active restaurants
  if (restaurant.status !== 'ACTIVE') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ร้านอาหารยังไม่ได้รับการอนุมัติ
          </Typography>
          <Typography>
            คุณจะสามารถดูข้อมูล LINE LIFF ได้เมื่อร้านอาหารได้รับการอนุมัติแล้ว
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <PhoneAndroid sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            LINE LIFF Information
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          ข้อมูล LINE LIFF สำหรับร้าน "{restaurant.name}"
        </Typography>
      </Box>

      {/* Restaurant Info Card */}
      <Card sx={{ 
        mb: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            ข้อมูลร้านอาหาร
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label={`ID: ${restaurant.id}`} 
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`สถานะ: ${restaurant.status}`} 
              color={restaurant.status === 'ACTIVE' ? 'success' : 'warning'}
              size="small"
            />
            {liffData?.liffId && (
              <Chip 
                icon={<CheckCircle />}
                label="LIFF Configured" 
                color="success"
                size="small"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* LIFF Information Card */}
      <Card sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            LIFF Information
          </Typography>
          
          {/* Check if LIFF is configured */}
          {!liffData?.liffId ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                ยังไม่ได้ตั้งค่า LIFF ID
              </Typography>
              <Typography variant="body2">
                กรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่า LIFF ID สำหรับร้านของคุณ
              </Typography>
            </Alert>
          ) : (
            <>
              {/* LIFF ID Display */}
              <TextField
                fullWidth
                label="LIFF ID"
                value={liffData.liffId}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Tooltip title="คัดลอก LIFF ID">
                      <IconButton 
                        onClick={() => copyToClipboard(liffData.liffId!)}
                        size="small"
                      >
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                  )
                }}
                sx={{ mb: 3 }}
                variant="outlined"
              />

              {/* LIFF URL Display */}
              <TextField
                fullWidth
                label="LIFF URL"
                value={generateLiffUrl()}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="คัดลอก LIFF URL">
                        <IconButton 
                          onClick={() => copyToClipboard(generateLiffUrl())}
                          size="small"
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="เปิดในแท็บใหม่">
                        <IconButton 
                          onClick={() => window.open(generateLiffUrl(), '_blank')}
                          size="small"
                        >
                          <OpenInNew />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )
                }}
                sx={{ mb: 3 }}
                variant="outlined"
              />
              
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                  ข้อมูลการใช้งาน:
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  <strong>•</strong> LIFF ID และ URL นี้ถูกตั้งค่าโดยผู้ดูแลระบบ<br/>
                  <strong>•</strong> ลูกค้าสามารถใช้ LIFF URL หรือ QR Code เพื่อเข้าถึงเมนูร้านของคุณ<br/>
                  <strong>•</strong> หากต้องการแก้ไขข้อมูล กรุณาติดต่อผู้ดูแลระบบ
                </Typography>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
} 