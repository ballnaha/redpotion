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
  Skeleton
} from '@mui/material'
import { 
  Phone,
  Email
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
    if (sessionStatus === 'loading') return // รอ session loading เสร็จก่อน
    
    if (sessionStatus === 'unauthenticated') {
      router.replace('/auth/signin')
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER') {
      router.replace('/')
    }
  }, [sessionStatus, session?.user?.role, router])

  // Show loading while session is loading or while redirecting
  if (sessionStatus === 'loading') {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    )
  }

  // Don't render anything if not authenticated or wrong role (will redirect)
  if (sessionStatus === 'unauthenticated' || 
      (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER')) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
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
            {isPending ? '🎉 สมัครสมาชิกสำเร็จแล้ว!' : '⚠️ ร้านอาหารไม่ได้รับการอนุมัติ'}
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        🏪 Dashboard ร้าน {restaurant.name}
      </Typography>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ✅ ร้านอาหารของคุณได้รับการอนุมัติแล้ว
        </Typography>
        <Typography variant="body1">
          คุณสามารถเริ่มจัดการร้านอาหารของคุณได้แล้ว
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={() => router.push('/restaurant/menu')}
          sx={{ minWidth: 150 }}
        >
          จัดการเมนู
        </Button>
        <Button
          variant="outlined"
          onClick={() => router.push('/restaurant/settings')}
          sx={{ minWidth: 150 }}
        >
          ตั้งค่าร้าน
        </Button>
      </Box>
    </Box>
  )
} 