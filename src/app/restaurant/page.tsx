'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Paper, 
  CircularProgress, 
  Alert, 
  Avatar, 
  Button,
  useMediaQuery
} from '@mui/material';
import { 
  TrendingUp, 
  Restaurant, 
  DeliveryDining, 
  AttachMoney, 
  Store, 
  Phone, 
  Email, 
  Settings
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useNotification } from '../../contexts/NotificationContext';


interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  status: string;
  
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

// SWR fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('RESTAURANT_NOT_FOUND');
    }
    throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลร้าน');
  }
  return response.json();
};

export default function RestaurantPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // Global notification
  const { showSuccess, showInfo } = useNotification();
  
  // ใช้ SWR แทน useState + useEffect
  const { 
    data: restaurant, 
    error, 
    isLoading: loading,
    mutate: refreshRestaurant
  } = useSWR<RestaurantData>(
    session?.user?.id ? '/api/restaurant/my-restaurant' : null,
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // refresh ทุก 5 นาที
      revalidateOnFocus: true, // refresh เมื่อกลับมาที่ tab
      revalidateOnReconnect: true, // refresh เมื่อ internet กลับมา
      dedupingInterval: 2 * 60 * 1000, // ไม่ส่ง request ซ้ำใน 2 นาที
      onSuccess: () => {
        console.log('🚀 Restaurant data loaded with SWR');
        // แสดง notification เมื่อโหลดข้อมูลสำเร็จ (เฉพาะครั้งแรก)
        if (!restaurant) {
          showInfo('โหลดข้อมูลร้านอาหารสำเร็จ');
        }
      },
      onError: (err) => console.error('❌ SWR Error:', err)
    }
  );

  // แสดง loading ถ้า session ยังไม่โหลดเสร็จหรือ SWR กำลังโหลด
  if (sessionStatus === 'loading' || loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    // ถ้า error เป็น 404 และเป็น RESTAURANT_OWNER ให้แสดงสถานะรอสมัคร
    if (error.message === 'RESTAURANT_NOT_FOUND' && sessionStatus === 'authenticated' && session?.user?.role === 'RESTAURANT_OWNER') {
      return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Alert severity="info" sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🏪 ร้านอาหารของคุณอยู่ในระหว่างการตรวจสอบ
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ระบบกำลังตรวจสอบเอกสารและข้อมูลร้านอาหารของคุณ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📋 สถานะ: รอการอนุมัติจากผู้ดูแลระบบ<br/>
              ⏰ ระยะเวลา: ภายใน 1-2 วันทำการ<br/>
              📧 เราจะแจ้งผลผ่านอีเมลเมื่อการตรวจสอบเสร็จสิ้น
            </Typography>
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

  // Check restaurant approval status - only show full interface if ACTIVE
  if (restaurant.status !== 'ACTIVE') {
    let statusInfo: {
      severity: 'info' | 'warning' | 'error';
      icon: string;
      title: string;
      message: string;
      details: string[];
    } = {
      severity: 'info',
      icon: '🏪',
      title: 'ร้านอาหารของคุณอยู่ในระหว่างการตรวจสอบ',
      message: 'ระบบกำลังตรวจสอบเอกสารและข้อมูลร้านอาหารของคุณ',
      details: [
        '📋 สถานะ: รอการอนุมัติจากผู้ดูแลระบบ',
        '⏰ ระยะเวลา: ภายใน 1-2 วันทำการ',
        '📧 เราจะแจ้งผลผ่านอีเมลเมื่อการตรวจสอบเสร็จสิ้น'
      ]
    };

    if (restaurant.status === 'SUSPENDED') {
      statusInfo = {
        severity: 'warning',
        icon: '⚠️',
        title: 'ร้านอาหารของคุณถูกระงับการใช้งาน',
        message: 'กรุณาติดต่อผู้ดูแลระบบสำหรับข้อมูลเพิ่มเติม',
        details: ['📞 สามารถติดต่อผู้ดูแลระบบเพื่อสอบถามรายละเอียด']
      };
    } else if (restaurant.status === 'CLOSED') {
      statusInfo = {
        severity: 'error',
        icon: '🔒',
        title: 'ร้านอาหารปิดปรับปรุง',
        message: 'ร้านอาหารของคุณปิดปรับปรุงชั่วคราว',
        details: ['🔧 หากต้องการเปิดร้านใหม่ กรุณาติดต่อผู้ดูแลระบบ']
      };
    } else if (restaurant.status === 'REJECTED') {
      statusInfo = {
        severity: 'error',
        icon: '❌',
        title: 'คำขอสมัครร้านอาหารไม่ได้รับการอนุมัติ',
        message: 'เอกสารหรือข้อมูลของคุณไม่ผ่านการตรวจสอบ',
        details: [
          '📄 กรุณาตรวจสอบเอกสารและข้อมูลที่ส่งมา',
          '✉️ ติดต่อผู้ดูแลระบบเพื่อสอบถามรายละเอียด',
          '🔄 สามารถสมัครใหม่ได้หลังจากแก้ไขข้อมูล'
        ]
      };
    }

    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity={statusInfo.severity} sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {statusInfo.icon} {statusInfo.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {statusInfo.message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusInfo.details.map((detail, index) => (
              <span key={index}>
                {detail}
                {index < statusInfo.details.length - 1 && <><br/></>}
              </span>
            ))}
          </Typography>
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

        {/* Restaurant Complete Info (Read-only) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            ข้อมูลร้านที่ส่งไป
          </Typography>
          
          {/* Simple Status Card */}
          <Card sx={{ 
            border: '1px solid #e0e0e0',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            mb: 3
          }}>
            {/* Status Header */}
            <Box sx={{ 
              p: 2.5, 
              bgcolor: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Avatar
                src={restaurant.imageUrl || undefined}
                alt={restaurant.name}
                sx={{ width: 50, height: 50 }}
              >
                {restaurant.name.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {restaurant.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                  รหัสร้าน: {restaurant.id.slice(-8).toUpperCase()}
                </Typography>
              </Box>
              <Box sx={{ 
                px: 2, 
                py: 0.5, 
                bgcolor: '#fff3cd', 
                borderRadius: 2,
                border: '1px solid #ffeaa7'
              }}>
                <Typography variant="caption" sx={{ color: '#856404', fontWeight: 600 }}>
                  รอการอนุมัติ
                </Typography>
              </Box>
            </Box>

            {/* Restaurant Information */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
                
                {/* Basic Info */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#333' }}>
                    ข้อมูลพื้นฐาน
                  </Typography>
                  <Box sx={{ pl: 2, borderLeft: '3px solid #e0e0e0' }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                        ที่อยู่
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {restaurant.address}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                        เบอร์โทร
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {restaurant.phone}
                      </Typography>
                    </Box>
                    {restaurant.email && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                          อีเมล
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {restaurant.email}
                        </Typography>
                      </Box>
                    )}
                    {restaurant.description && (
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                          คำอธิบาย
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {restaurant.description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Business Info */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#333' }}>
                    ข้อมูลธุรกิจ
                  </Typography>
                  <Box sx={{ pl: 2, borderLeft: '3px solid #e0e0e0' }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                        ประเภทธุรกิจ
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {restaurant.businessType || 'ไม่ระบุ'}
                      </Typography>
                    </Box>
                    {restaurant.taxId && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                          เลขประจำตัวผู้เสียภาษี
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          {restaurant.taxId}
                        </Typography>
                      </Box>
                    )}
                    {restaurant.bankName && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                          ธนาคาร
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {restaurant.bankName}
                        </Typography>
                      </Box>
                    )}
                    {restaurant.bankAccount && (
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                          เลขบัญชี
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          {restaurant.bankAccount}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Location Info */}
                {restaurant.locationName && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#333' }}>
                      ตำแหน่งที่ตั้ง
                    </Typography>
                    <Box sx={{ pl: 2, borderLeft: '3px solid #e0e0e0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        📍 {restaurant.locationName}
                      </Typography>
                    </Box>
                  </Box>
                )}

              </Box>
            </Box>
          </Card>

          {/* Documents Section - Separate Card */}
          {restaurant?.documents && restaurant.documents.length > 0 && (
            <Card sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                p: 2.5, 
                bgcolor: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                  📎 เอกสารที่แนบ ({restaurant.documents.length} ไฟล์)
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {restaurant.documents.map((doc) => (
                    <Box
                      key={doc.id}
                      sx={{
                        p: 2,
                        border: '1px solid #f0f0f0',
                        borderRadius: 2,
                        bgcolor: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: doc.mimeType.startsWith('image/') ? '#e8f5e8' : '#fff3cd',
                        color: doc.mimeType.startsWith('image/') ? '#4caf50' : '#f57c00'
                      }}>
                        {doc.mimeType.startsWith('image/') ? '🖼️' : '📄'}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                          {doc.fileName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          minWidth: 'auto',
                          px: 2,
                          fontSize: '0.8rem',
                          textTransform: 'none',
                          borderColor: '#e0e0e0',
                          color: '#666'
                        }}
                      >
                        ดูไฟล์
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Card>
          )}

          {/* Submission Date Card */}
          <Card sx={{ 
            border: '1px solid #e0e0e0',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            p: 2.5,
            textAlign: 'center',
            bgcolor: '#fafafa'
          }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
              วันที่ส่งข้อมูล
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              📅 {new Date((restaurant as any)?.createdAt || Date.now()).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              เวลา {new Date((restaurant as any)?.createdAt || Date.now()).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              })} น.
            </Typography>
          </Card>
        </Box>
      </Box>
    );
  }

  const stats = [
    { 
      title: 'Orders Today', 
      value: '0',
      icon: <DeliveryDining />, 
      color: theme.palette.primary.main,
      change: 'Today'
    },
    { 
      title: 'Menu Items', 
      value: restaurant._count?.menuItems?.toString() || '0', 
      icon: <Restaurant />, 
      color: 'rgba(255, 149, 0, 0.85)',
      change: 'Active items'
    },
    { 
      title: 'Categories', 
      value: restaurant._count?.categories?.toString() || '0', 
      icon: <Store />, 
      color: 'rgba(52, 199, 89, 0.85)',
      change: 'Menu categories'
    },
    { 
      title: 'Total Orders', 
      value: restaurant._count?.orders?.toString() || '0', 
      icon: <TrendingUp />, 
      color: 'rgba(175, 82, 222, 0.85)',
      change: 'All time'
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Restaurant Header */}
      <Box sx={{ mb: { xs: 4, md: 6 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          gap: { xs: 3, md: 4 }, 
          mb: 4,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 2.5, md: 3 },
            width: isMobile ? '100%' : 'auto'
          }}>
            <Avatar
              src={restaurant.imageUrl || undefined}
              alt={restaurant.name}
              sx={{ 
                width: { xs: 70, sm: 85, md: 100 }, 
                height: { xs: 70, sm: 85, md: 100 },
                bgcolor: theme.palette.primary.main,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                fontWeight: 700,
                border: '3px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}
            >
              {restaurant.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h3"
                component="h1" 
                sx={{ 
                  fontWeight: 900, 
                  mb: { xs: 1, md: 1.5 },
                  fontSize: { xs: '1.75rem', sm: '2.1rem', md: '2.25rem' },
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                  color: 'text.primary'
                }}
              >
                {restaurant.name}
              </Typography>
              <Typography 
                variant="h6"
                component="p"
                sx={{ 
                  color: theme.palette.text.secondary, 
                  mb: { xs: 1.5, md: 2 },
                  fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
                  fontWeight: 500,
                  letterSpacing: '0.01em'
                }}
              >
                ระบบจัดการร้านอาหาร
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    backgroundColor: restaurant.isOpen ? 'success.main' : 'error.main',
                    boxShadow: restaurant.isOpen ? '0 0 8px rgba(76, 175, 80, 0.4)' : '0 0 8px rgba(244, 67, 54, 0.4)'
                  }} 
                />
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                  }}
                >
                  {restaurant.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
                  {restaurant.openTime && restaurant.closeTime && 
                    ` • ${restaurant.openTime} - ${restaurant.closeTime}`
                  }
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => router.push('/restaurant/settings')}
            size={isMobile ? "medium" : "large"}
            sx={{ 
              alignSelf: isMobile ? 'flex-end' : 'flex-start',
              minWidth: isMobile ? 'auto' : 'unset',
              fontSize: { xs: '0.875rem', md: '1rem' },
              fontWeight: 600,
              px: { xs: 3, md: 4 },
              py: { xs: 1.25, md: 1.5 },
              borderRadius: 2.5,
              textTransform: 'none',
              letterSpacing: '0.02em',
              borderColor: 'rgba(25, 118, 210, 0.5)',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                transform: isMobile ? 'none' : 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
              }
            }}
          >
            {isMobile ? 'ตั้งค่า' : 'ตั้งค่าร้าน'}
          </Button>
        </Box>

        {/* Restaurant Info Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexWrap: 'wrap',
          '& > *': {
            flex: { xs: '1 1 calc(100% - 4px)', sm: '1 1 200px' }
          }
        }}>
          <Card sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            backgroundColor: 'rgba(255, 255, 255, 0.1)' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 24 } }} />
              <Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.7rem', md: '0.75rem' },
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600
                  }}
                >
                  โทรศัพท์
                </Typography>
                <Typography 
                  variant="body2" 
                                      sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.85rem', md: '0.875rem' },
                      letterSpacing: '0.01em',
                      mt: 0.25
                    }}
                >
                  {restaurant.phone}
                </Typography>
              </Box>
            </Box>
          </Card>
          
          {restaurant.email && (
            <Card sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              backgroundColor: 'rgba(255, 255, 255, 0.1)' 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 24 } }} />
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600
                    }}
                  >
                    อีเมล
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.85rem', md: '0.875rem' },
                      letterSpacing: '0.01em',
                      mt: 0.25
                    }}
                  >
                    {restaurant.email}
                  </Typography>
                </Box>
              </Box>
            </Card>
          )}

          <Card sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            flex: { xs: '1 1 100%', sm: '1 1 300px' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Store sx={{ color: theme.palette.primary.main, mt: 0.5, fontSize: { xs: 20, sm: 24 } }} />
              <Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.7rem', md: '0.75rem' },
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600
                  }}
                >
                  ที่อยู่
                </Typography>
                <Typography 
                  variant="body2" 
                                     sx={{ 
                     fontWeight: 600,
                     fontSize: { xs: '0.85rem', md: '0.875rem' },
                     letterSpacing: '0.01em',
                     lineHeight: 1.4,
                     mt: 0.25
                   }}
                >
                  {restaurant.address}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)'
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 3, md: 4 }
      }}>
        {stats.map((stat, index) => (
            <Card
            key={index}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                transform: isMobile ? 'none' : 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                    width: { xs: 40, sm: 50 },
                    height: { xs: 40, sm: 50 },
                      borderRadius: 2,
                      backgroundColor: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800, 
                  mb: { xs: 1, md: 1.5 },
                  fontSize: { xs: '1.75rem', sm: '1.9rem', md: '2rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1
                }}
              >
                {stat.value}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.text.secondary, 
                  mb: { xs: 0.75, md: 1 },
                  fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                  fontWeight: 600,
                  letterSpacing: '0.01em'
                }}
              >
                {stat.title}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: stat.color,
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', md: '0.85rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {stat.change}
              </Typography>
              </CardContent>
            </Card>
        ))}
      </Box>

      {/* Recent Activity */}
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 2, md: 3 }, 
        flexDirection: { xs: 'column', lg: 'row' }
      }}>
        <Box sx={{ flex: { lg: '2 1 500px' } }}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 3,
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                fontWeight: 700,
                fontSize: { xs: '1.25rem', md: '1.35rem' },
                letterSpacing: '0.01em'
              }}
            >
              Recent Orders
            </Typography>
            {(restaurant._count?.orders || 0) > 0 ? (
              <Box sx={{ 
                p: 3,
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
              }}>
                <DeliveryDining sx={{ 
                  fontSize: { xs: 32, sm: 48 }, 
                  color: theme.palette.text.secondary, 
                  mb: 1 
                }} />
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  กำลังพัฒนาระบบแสดง Orders
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Orders ทั้งหมด: {restaurant._count?.orders || 0} รายการ
                    </Typography>
                  </Box>
            ) : (
              <Box sx={{ 
                p: 3,
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}>
                <DeliveryDining sx={{ 
                  fontSize: { xs: 32, sm: 48 }, 
                  color: theme.palette.text.secondary, 
                  mb: 1 
                }} />
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  ยังไม่มี Orders
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  เมื่อมีลูกค้าสั่งอาหาร จะแสดงที่นี่
                  </Typography>
                </Box>
            )}
          </Paper>
        </Box>

        <Box sx={{ flex: { lg: '1 1 300px' } }}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 3,
            }}
          >
            <Typography 
              variant={isMobile ? "h6" : "h6"} 
              sx={{ mb: 3, fontWeight: 500 }}
            >
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { 
                  title: 'จัดการเมนู', 
                  desc: `${restaurant._count?.menuItems || 0} รายการ • ${restaurant._count?.categories || 0} หมวดหมู่`,
                  available: true,
                  action: () => router.push('/restaurant/menu')
                },
                { 
                  title: 'ดูรายงาน', 
                  desc: 'รายงานยอดขายและสถิติ',
                  available: false
                },
                { 
                  title: 'จัดการออร์เดอร์', 
                  desc: `${restaurant._count?.orders || 0} ออร์เดอร์ทั้งหมด`,
                  available: false
                },
                { 
                  title: 'ตั้งค่าร้าน', 
                  desc: 'แก้ไขข้อมูลร้านอาหาร',
                  available: true,
                  action: () => router.push('/restaurant/settings')
                },
              ].map((action, index) => (
                <Box 
                  key={index}
                  onClick={action.available && action.action ? action.action : undefined}
                  sx={{ 
                    p: { xs: 1.5, sm: 2 },
                    backgroundColor: action.available 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    cursor: action.available ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    opacity: action.available ? 1 : 0.6,
                    '&:hover': action.available ? {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      transform: isMobile ? 'none' : 'translateX(4px)',
                    } : {},
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant={isMobile ? "body2" : "body1"} 
                        sx={{ fontWeight: 500, mb: 0.5 }}
                      >
                    {action.title}
                  </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        sx={{ color: theme.palette.text.secondary }}
                      >
                    {action.desc}
                  </Typography>
                    </Box>
                    {!action.available && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          color: theme.palette.text.secondary,
                          fontSize: isMobile ? '0.7rem' : '0.75rem'
                        }}
                      >
                        เร็วๆ นี้
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>


    </Box>
  );
} 