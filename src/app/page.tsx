'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Paper
} from '@mui/material';
import { 
  Person,
  AdminPanelSettings,
  Restaurant,
  TwoWheeler,
  ArrowForward,
  LocationOn,
  Star,
  ShoppingCart,
  Notifications
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function HomePage() {
  const router = useRouter();
  const theme = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userTypes = [
    {
      type: 'customer',
      title: 'ลูกค้า',
      subtitle: 'สั่งอาหารจากร้านโปรด',
      icon: Person,
      description: 'เลือกอาหารจากร้านที่ชื่นชอบ ติดตามคำสั่งซื้อแบบเรียลไทม์',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
      route: '/customer',
    },
    {
      type: 'admin',
      title: 'ผู้ดูแลระบบ',
      subtitle: 'จัดการระบบและผู้ใช้งาน',
      icon: AdminPanelSettings,
      description: 'ควบคุมระบบทั้งหมด จัดการผู้ใช้งาน และรายงานการใช้งาน',
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
      route: '/admin',
    },
    {
      type: 'restaurant',
      title: 'ร้านอาหาร',
      subtitle: 'จัดการเมนูและคำสั่งซื้อ',
      icon: Restaurant,
      description: 'อัปเดตเมนู จัดการคำสั่งซื้อ และติดตามยอดขาย',
      gradient: `linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)`,
      route: '/restaurant',
    },
    {
      type: 'rider',
      title: 'นักส่งอาหาร',
      subtitle: 'รับงานส่งอาหาร',
      icon: TwoWheeler,
      description: 'รับงานส่งอาหาร ติดตามเส้นทาง และจัดการการจัดส่ง',
      gradient: `linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)`,
      route: '/rider',
    },
  ];

  const features = [
    { icon: LocationOn, title: 'จัดส่งเร็ว', description: 'ส่งฟรีเมื่อสั่งครบ 300 บาท' },
    { icon: Star, title: 'คุณภาพดี', description: 'อาหารคุณภาพจากร้านชื่อดัง' },
    { icon: ShoppingCart, title: 'สั่งง่าย', description: 'สั่งอาหารได้ทุกที่ ทุกเวลา' },
    { icon: Notifications, title: 'แจ้งเตือน', description: 'ติดตามสถานะออเดอร์แบบเรียลไทม์' },
  ];

  if (!isMounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>กำลังโหลด...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          linear-gradient(135deg, 
            rgba(74, 144, 226, 0.1) 0%, 
            rgba(102, 126, 234, 0.1) 100%
          )
        `,
        pb: 4,
      }}
    >
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          borderRadius: 0,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900,
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              RedPotion
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4,
                opacity: 0.9,
                fontSize: { xs: '1.2rem', md: '1.5rem' }
              }}
            >
              แพลตฟอร์มสั่งอาหารออนไลน์ที่ครบครัน
            </Typography>
            
            {/* Features Grid */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 3,
              mt: 4
            }}>
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Box key={index} sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <IconComponent sx={{ fontSize: 30 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* User Types Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              color: theme.palette.text.primary,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            เลือกประเภทผู้ใช้งาน
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme.palette.text.secondary,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            ระบบของเราออกแบบมาเพื่อรองรับทุกกลุ่มผู้ใช้งาน
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 4
        }}>
          {userTypes.map((user) => {
            const IconComponent = user.icon;
            
            return (
              <Box key={user.type}>
                <Card
                  sx={{
                    height: '100%',
                    background: user.gradient,
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                    },
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                    },
                  }}
                  onClick={() => router.push(user.route)}
                >
                  <CardContent 
                    sx={{ 
                      p: 4,
                      color: 'white',
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Box 
                        sx={{ 
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 3,
                        }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          <IconComponent sx={{ fontSize: 40 }} />
                        </Box>
                      </Box>

                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700,
                          mb: 1,
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {user.title}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          opacity: 0.9,
                          fontWeight: 500,
                          mb: 2,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        {user.subtitle}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          opacity: 0.8,
                          lineHeight: 1.5,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        {user.description}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      fullWidth
                      sx={{
                        mt: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 600,
                        py: 1.5,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    >
                      เริ่มใช้งาน
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 4, mt: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              RedPotion
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                opacity: 0.6,
              }}
            >
              © 2024 RedPotion Technology. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 