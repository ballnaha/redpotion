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
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  ContentCopy, 
  OpenInNew, 
  QrCode, 
  Save,
  PhoneAndroid,
  Link as LinkIcon,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNotification } from '../../../contexts/NotificationContext';

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

  const [liffId, setLiffId] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-populate LIFF ID when data loads
  useEffect(() => {
    if (liffData?.liffId) {
      setLiffId(liffData.liffId);
    }
  }, [liffData]);

  // Redirect if not authenticated or not restaurant owner
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (sessionStatus === 'unauthenticated') {
      router.replace('/auth/signin');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER') {
      router.replace('/');
    }
  }, [sessionStatus, session?.user?.role, router]);

  const handleSave = async () => {
    if (!restaurant?.id) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/restaurant/${restaurant.id}/liff`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ liffId: liffId.trim() }),
      });

      if (response.ok) {
        await refreshLiff(); // รีเฟรช LIFF data
        showSuccess('บันทึก LIFF ID สำเร็จ!');
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Save error:', error);
      showError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('คัดลอกแล้ว!');
  };

  const generateLiffUrl = () => {
    if (!liffId || !restaurant) return '';
    return `https://liff.line.me/${liffId}?restaurant=${restaurant.id}`;
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
            คุณจะสามารถใช้งาน LINE LIFF Setup ได้เมื่อร้านอาหารได้รับการอนุมัติแล้ว
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
            LINE LIFF Setup
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          จัดการ LINE LIFF สำหรับร้าน "{restaurant.name}"
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

      {/* LIFF Configuration Card */}
      <Card sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            LIFF Configuration
          </Typography>
          
          <TextField
            fullWidth
            label="LIFF ID"
            placeholder="เช่น 2007609360-3Z0L8Ekg"
            value={liffId}
            onChange={(e) => setLiffId(e.target.value)}
            helperText="ใส่ LIFF ID ที่ได้จาก LINE Developers Console"
            sx={{ mb: 3 }}
            variant="outlined"
          />

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSave}
            disabled={saving || !liffId.trim()}
            sx={{ mb: 3 }}
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>

          {liffId && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                LIFF URL สำหรับร้านของคุณ
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(0, 0, 0, 0.05)', 
                borderRadius: 1, 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                mb: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                <LinkIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flexGrow: 1, 
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}
                >
                  {generateLiffUrl()}
                </Typography>
                <Tooltip title="คัดลอก URL">
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

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  วิธีการใช้งาน:
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  <strong>1.</strong> นำ URL นี้ไปตั้งเป็น Endpoint URL ใน LINE Developers Console<br/>
                  <strong>2.</strong> ตั้งค่า Rich Menu หรือ Flex Message เพื่อเปิด LIFF<br/>
                  <strong>3.</strong> ลูกค้าจะถูก redirect มายังหน้าเมนูของร้านโดยอัตโนมัติ
                </Typography>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
} 