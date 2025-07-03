'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { 
  Box, 
  Card, 
  Typography, 
  Button, 
  Alert,
  Skeleton,
  Chip,
  Paper,
  Grid
} from '@mui/material'
import { 
  Phone,
  Email,
  Restaurant,
  Settings,
  MenuBook,
  TrendingUp,
  Category,
  ShoppingCart
} from '@mui/icons-material'
import { useNotification } from '@/hooks/useGlobalNotification'

interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  status: string;
  statusMessage?: string;
  
  // Location information
  latitude?: number;
  longitude?: number;
  locationName?: string;
  
  // Business information
  businessType?: string;
  taxId?: string;
  bankAccount?: string;
  bankName?: string;
  
  // Opening hours
  openTime?: string;
  closeTime?: string;
  isOpen: boolean;
  
  // Settings
  minOrderAmount?: number;
  deliveryFee?: number;
  deliveryRadius?: number;
  
  // Documents
  documents?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    documentType: string;
    description?: string;
  }[];
  
  _count: {
    categories: number;
    menuItems: number;
    orders: number;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorData = await res.json()
    const error = new Error(errorData.message || 'เกิดข้อผิดพลาด')
    ;(error as any).code = errorData.code
    throw error
  }
  return res.json()
}

export default function RestaurantPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const { showSuccess, showError, showInfo, showWarning } = useNotification()

  const { data: restaurant, error, isLoading } = useSWR<RestaurantData>(
    sessionStatus === 'authenticated' && session?.user?.role === 'RESTAURANT_OWNER' 
      ? '/api/restaurant/my-restaurant' 
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false
    }
  )

  // Redirect if not authenticated or not restaurant owner
  // แต่ให้รอ session loading เสร็จก่อน
  useEffect(() => {
    console.log('🏪 Restaurant page auth check:', {
      sessionStatus,
      userRole: session?.user?.role,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'undefined'
    });
    
    if (sessionStatus === 'loading') {
      console.log('⏳ Session still loading, waiting...');
      return; // รอ session loading เสร็จก่อน
    }
    
    if (sessionStatus === 'unauthenticated') {
      console.log('❌ User not authenticated, redirecting to signin');
      // เพิ่ม callbackUrl เพื่อกลับมาหน้า restaurant หลัง login
      const callbackUrl = encodeURIComponent('/restaurant');
      router.replace(`/auth/signin?callbackUrl=${callbackUrl}`);
    } else if (sessionStatus === 'authenticated') {
      // เพิ่มการตรวจสอบ role อย่างละเอียด
      const userRole = session?.user?.role;
      
      if (!userRole) {
        console.log('⚠️ User role not found in session, might be loading issue');
        // ลองรอเล็กน้อยแล้วตรวจสอบใหม่
        setTimeout(() => {
          if (!session?.user?.role) {
            console.log('❌ User role still not found, forcing logout');
            router.replace('/auth/signin');
          }
        }, 2000);
        return;
      }
      
      if (userRole !== 'RESTAURANT_OWNER') {
        console.log('⚠️ User not restaurant owner, redirecting to home', { role: userRole });
        router.replace('/');
      } else {
        console.log('✅ Restaurant owner authenticated, staying on page');
      }
    }
  }, [sessionStatus, session?.user?.role, session?.user?.id, router])

  // Show loading while session is loading or while redirecting
  if (sessionStatus === 'loading') {
    console.log('🔄 Rendering loading skeleton - session loading');
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>กำลังตรวจสอบสิทธิ์...</Typography>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    )
  }

  // Don't render anything if not authenticated or wrong role (will redirect)
  if (sessionStatus === 'unauthenticated') {
    console.log('🔄 User unauthenticated, rendering loading skeleton while redirecting');
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>กำลังเข้าสู่ระบบ...</Typography>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    )
  }
  
  if (sessionStatus === 'authenticated' && (!session?.user?.role || session?.user?.role !== 'RESTAURANT_OWNER')) {
    console.log('🔄 Wrong user role or role loading, rendering loading skeleton while redirecting', {
      hasRole: !!session?.user?.role,
      role: session?.user?.role
    });
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {!session?.user?.role ? 'กำลังตรวจสอบสิทธิ์...' : 'กำลังเปลี่ยนหน้า...'}
        </Typography>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    )
  }

  // Show loading while fetching restaurant data
  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    )
  }

  // ถ้ามีข้อมูลร้านแต่อยู่ในสถานะ PENDING หรือ REJECTED
  if (restaurant && (restaurant.status === 'PENDING' || restaurant.status === 'REJECTED')) {
    const isPending = restaurant.status === 'PENDING';
    
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity={isPending ? "info" : "warning"} 
          sx={{ mb: 3, p: 3, borderRadius: 2 }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: isPending ? 'info.main' : 'warning.main' }}>
            {isPending ? '🎉 รอการตรวจสอบ!' : '⚠️ ร้านอาหารไม่ได้รับการอนุมัติ'}
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
            🏪 {restaurant.statusMessage || (isPending ? 'ร้านอาหารของคุณอยู่ในระหว่างการตรวจสอบ รอการอนุมัติจากผู้ดูแลระบบ' : 'กรุณาติดต่อผู้ดูแลระบบ')}
          </Typography>
          
          {isPending && (
            <>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                ขอบคุณที่สมัครเป็นพาร์ทเนอร์กับเรา! ระบบกำลังตรวจสอบเอกสารและข้อมูลร้านอาหารของคุณ
              </Typography>
              <Box sx={{ 
                background: 'rgba(255, 255, 255, 0.7)', 
                p: 2, 
                borderRadius: 1, 
                mt: 2 
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  📋 <strong>สถานะปัจจุบัน:</strong> รอการอนุมัติจากผู้ดูแลระบบ<br/>
                  ⏰ <strong>ระยะเวลาดำเนินการ:</strong> ภายใน 1-2 วันทำการ<br/>
                  📧 <strong>การแจ้งผล:</strong> เราจะแจ้งผลผ่านอีเมลเมื่อการตรวจสอบเสร็จสิ้น<br/>
                  🔍 <strong>การตรวจสอบ:</strong> เอกสาร, ข้อมูลร้าน, และความถูกต้องของข้อมูล
                </Typography>
              </Box>
            </>
          )}
        </Alert>

        {/* Contact Admin Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            ติดต่อผู้ดูแลระบบ
          </Typography>
          <Card sx={{ 
            p: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="body1">
                  <strong>line id:</strong> @theredpotion
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="body1">
                  <strong>อีเมล:</strong> admin@theredpotion.com
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>
    );
  }

  if (error) {
    // ถ้า error เป็น 404 และเป็น RESTAURANT_OWNER ให้แสดงสถานะรอสมัคร
    if ((error as any).code === 'RESTAURANT_NOT_FOUND' && sessionStatus === 'authenticated' && session?.user?.role === 'RESTAURANT_OWNER') {
      return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Alert severity="warning" sx={{ mb: 3, p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'warning.main' }}>
              📝 ยังไม่ได้สมัครร้านอาหาร
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              คุณยังไม่ได้สมัครร้านอาหารในระบบ กรุณาสมัครเพื่อเริ่มต้นธุรกิจของคุณ
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => router.push('/auth/register/restaurant')}
              sx={{ mt: 2 }}
            >
              สมัครร้านอาหาร
            </Button>
          </Alert>

          {/* Contact Admin Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              ติดต่อผู้ดูแลระบบ
            </Typography>
            <Card sx={{ 
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body1">
                    <strong>line id:</strong> @theredpotion
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body1">
                    <strong>อีเมล:</strong> admin@theredpotion.com
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'}
        </Alert>
      </Box>
    );
  }

  // ตรวจสอบว่ามี restaurant หรือไม่
  if (!restaurant) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          ไม่พบข้อมูลร้านอาหาร
        </Alert>
      </Box>
    );
  }

  // Check restaurant approval status - จัดการสถานะอื่นๆ ที่ไม่ใช่ PENDING/REJECTED
  if (restaurant.status === 'SUSPENDED') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="warning" sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ ร้านอาหารของคุณถูกระงับการใช้งาน
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            กรุณาติดต่อผู้ดูแลระบบสำหรับข้อมูลเพิ่มเติม
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (restaurant.status === 'CLOSED') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔒 ร้านอาหารปิดปรับปรุง
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ร้านอาหารของคุณปิดปรับปรุงชั่วคราว
          </Typography>
        </Alert>
      </Box>
    );
  }

  // ถ้าร้านได้รับการอนุมัติแล้ว (APPROVED/ACTIVE) ให้แสดงหน้า dashboard ปกติ
  if (restaurant.status !== 'APPROVED' && restaurant.status !== 'ACTIVE') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="info" sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            🏪 สถานะร้านอาหาร: {restaurant.status}
          </Typography>
          <Typography variant="body1">
            กรุณาติดต่อผู้ดูแลระบบหากมีข้อสงสัย
          </Typography>
        </Alert>
      </Box>
    );
  }

  // แสดงหน้า dashboard ปกติสำหรับร้านที่ได้รับการอนุมัติแล้ว
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Restaurant sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {restaurant.name}
            </Typography>
            <Chip 
              label={restaurant.status === 'ACTIVE' ? 'อนุมัติแล้ว' : 'อนุมัติแล้ว'} 
              color="success"
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
          <Typography variant="body1" color="text.secondary">
            จัดการร้านอาหารของคุณได้ทุกอย่างในที่เดียว
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2, 
          mb: 4 
        }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              background: '#ffffff',
              border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease',
              '&:hover': { 
                borderColor: '#667eea',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
              }
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#667eea', mb: 0.5 }}>
                {restaurant._count.categories}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                หมวดหมู่
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              background: '#ffffff',
              border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease',
              '&:hover': { 
                borderColor: '#f5576c',
                boxShadow: '0 4px 12px rgba(245, 87, 108, 0.15)'
              }
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#f5576c', mb: 0.5 }}>
                {restaurant._count.menuItems}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                เมนูอาหาร
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              background: '#ffffff',
              border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease',
              '&:hover': { 
                borderColor: '#00f2fe',
                boxShadow: '0 4px 12px rgba(0, 242, 254, 0.15)'
              }
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#00d4aa', mb: 0.5 }}>
                {restaurant._count.orders}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                คำสั่งซื้อ
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Quick Actions */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
            การจัดการร้าน
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2 
          }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<MenuBook />}
              onClick={() => router.push('/restaurant/menu')}
              sx={{
                py: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              จัดการเมนู
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Settings />}
              onClick={() => router.push('/restaurant/settings')}
              sx={{
                py: 2,
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  background: 'rgba(102, 126, 234, 0.04)'
                }
              }}
            >
              ตั้งค่าร้าน
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<TrendingUp />}
              onClick={() => router.push('/restaurant/gallery')}
              sx={{
                py: 2,
                borderRadius: 2,
                borderColor: 'secondary.main',
                color: 'secondary.main',
                '&:hover': {
                  borderColor: 'secondary.dark',
                  background: 'rgba(245, 87, 108, 0.04)'
                }
              }}
            >
              แกลเลอรี่
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
} 