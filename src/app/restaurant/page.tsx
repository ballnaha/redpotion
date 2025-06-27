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
      throw new Error('ไม่พบข้อมูลร้านอาหาร กรุณาติดต่อผู้ดูแลระบบ');
    }
    throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลร้าน');
  }
  return response.json();
};

export default function RestaurantPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
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
      onSuccess: () => console.log('🚀 Restaurant data loaded with SWR'),
      onError: (err) => console.error('❌ SWR Error:', err)
    }
  );


  // SWR จัดการทุกอย่างแล้ว - ไม่ต้องใช้ useEffect, fetchData function อีกต่อไป!





  if (loading) {
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
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'}
        </Alert>
      </Box>
    );
  }

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
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            ข้อมูลร้านที่ส่งไป
          </Typography>
          <Card sx={{ 
            p: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            {/* Header with restaurant image and basic info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                src={restaurant.imageUrl || undefined}
                alt={restaurant.name}
                sx={{ width: 60, height: 60 }}
              >
                {restaurant.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {restaurant.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  รหัสร้าน: {restaurant.id.slice(-8).toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  สถานะ: {restaurant.status === 'PENDING' ? 'รอการอนุมัติ' : 
                           restaurant.status === 'ACTIVE' ? 'ใช้งานได้' :
                           restaurant.status === 'SUSPENDED' ? 'ระงับการใช้งาน' :
                           restaurant.status === 'REJECTED' ? 'ไม่ได้รับอนุมัติ' : 
                           restaurant.status}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* ข้อมูลพื้นฐาน */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  📋 ข้อมูลพื้นฐาน
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>ที่อยู่:</strong> {restaurant.address}
                  </Typography>
                  <Typography variant="body2">
                    <strong>โทรศัพท์:</strong> {restaurant.phone}
                  </Typography>
                  {restaurant.email && (
                    <Typography variant="body2">
                      <strong>อีเมล:</strong> {restaurant.email}
                    </Typography>
                  )}
                  {restaurant.description && (
                    <Typography variant="body2">
                      <strong>คำอธิบาย:</strong> {restaurant.description}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* ข้อมูลธุรกิจ */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  🏢 ข้อมูลธุรกิจ
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {restaurant.businessType ? (
                    <Typography variant="body2">
                      <strong>ประเภทธุรกิจ:</strong> {restaurant.businessType}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      ประเภทธุรกิจ: ไม่ระบุ
                    </Typography>
                  )}
                  {restaurant.taxId ? (
                    <Typography variant="body2">
                      <strong>เลขประจำตัวผู้เสียภาษี:</strong> {restaurant.taxId}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      เลขประจำตัวผู้เสียภาษี: ไม่ระบุ
                    </Typography>
                  )}
                  {restaurant.bankAccount ? (
                    <Typography variant="body2">
                      <strong>เลขบัญชีธนาคาร:</strong> {restaurant.bankAccount}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      เลขบัญชีธนาคาร: ไม่ระบุ
                    </Typography>
                  )}
                  {restaurant.bankName ? (
                    <Typography variant="body2">
                      <strong>ชื่อธนาคาร:</strong> {restaurant.bankName}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      ชื่อธนาคาร: ไม่ระบุ
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* ข้อมูลที่ตั้ง */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  📍 ข้อมูลที่ตั้ง
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {restaurant.locationName ? (
                    <Typography variant="body2">
                      <strong>ชื่อสถานที่:</strong> {restaurant.locationName}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      ชื่อสถานที่: ไม่ระบุ
                    </Typography>
                  )}
                  {restaurant.latitude && restaurant.longitude ? (
                    <Typography variant="body2">
                      <strong>พิกัด:</strong> {restaurant.latitude}, {restaurant.longitude}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      พิกัด: ไม่ระบุ
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* เอกสารที่แนบ */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  📎 เอกสารที่แนบ
                </Typography>
                {restaurant.documents && restaurant.documents.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                      เอกสารทั้งหมด: {restaurant.documents.length} ไฟล์
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {restaurant.documents.map((doc, index) => (
                        <Box
                          key={doc.id}
                          sx={{
                            p: 2,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
                            backgroundColor: doc.mimeType.startsWith('image/') 
                              ? 'rgba(76, 175, 80, 0.1)' 
                              : doc.mimeType === 'application/pdf'
                                ? 'rgba(244, 67, 54, 0.1)'
                                : 'rgba(33, 150, 243, 0.1)',
                            color: doc.mimeType.startsWith('image/') 
                              ? 'success.main' 
                              : doc.mimeType === 'application/pdf'
                                ? 'error.main'
                                : 'primary.main'
                          }}>
                            {doc.mimeType.startsWith('image/') ? '🖼️' : 
                             doc.mimeType === 'application/pdf' ? '📄' : '📋'}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              {doc.fileName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doc.documentType.replace('_', ' ')} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                            {doc.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {doc.description}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              minWidth: 'auto',
                              px: 1.5,
                              fontSize: '0.75rem',
                              textTransform: 'none'
                            }}
                          >
                            ดูไฟล์
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    ไม่มีเอกสารที่แนบ
                  </Typography>
                )}
              </Box>

            </Box>

            {/* Submission info */}
            <Box sx={{ 
              mt: 3, 
              pt: 2, 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Typography variant="body2" color="text.secondary">
                📅 ส่งข้อมูลเมื่อ: {new Date((restaurant as any).createdAt || Date.now()).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
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