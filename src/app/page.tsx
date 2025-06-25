'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Prompt } from 'next/font/google';

// Configure Prompt font
const prompt = Prompt({
  weight: ['200', '300', '400', '500'],
  subsets: ['thai', 'latin'],
  display: 'swap'
});
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Paper,
  Avatar,
  Chip,
  IconButton
} from '@mui/material';
import { 
  LocalDining,
  Nature,
  Timer,
  LocalShipping,
  StarBorder,
  FitnessCenter,
  ArrowForward,
  PlayArrow,
  Favorite,
  Restaurant,
  ShoppingBag,
  Phone,
  Instagram,
  Twitter,
  Facebook,
  YouTube,
  Close
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function HomePage() {
  const router = useRouter();
  const theme = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const categories = [
    {
      icon: Nature,
      title: 'อาหารออร์แกนิก',
      description: 'วัตถุดิบสดใหม่ ปลอดสารพิษ',
      color: '#F87171',
      image: ''
    },
    {
      icon: FitnessCenter,
      title: 'โปรตีนคลีน',
      description: 'เนื้อสัตว์คุณภาพสูง สดใหม่',
      color: '#FDA4AF',
      image: ''
    },
    {
      icon: LocalDining,
      title: 'เมนูคีโต',
      description: 'อาหารคีโตเจนิก ลดน้ำหนัก',
      color: '#FECACA',
      image: ''
    },
    {
      icon: StarBorder,
      title: 'เมนูพิเศษ',
      description: 'อาหารเฉพาะทาง สุขภาพดี',
      color: '#FEE2E2',
      image: ''
    }
  ];

  const features = [
    { 
      icon: Timer, 
      title: 'ส่งเร็ว 30 นาที', 
      description: 'จัดส่งสดใหม่ทุกออเดอร์'
    },
    { 
      icon: Nature, 
      title: 'ออร์แกนิก 100%', 
      description: 'วัตถุดิบคุณภาพสูง'
    },
    { 
      icon: Favorite, 
      title: 'ดีต่อสุขภาพ', 
      description: 'โภชนาการครบครัน'
    },
    { 
      icon: LocalShipping, 
      title: 'ฟรีค่าส่ง', 
      description: 'สั่งครบ 299 บาท'
    }
  ];

  const stats = [
    { number: '50K+', label: 'ลูกค้าที่ไว้วางใจ' },
    { number: '500+', label: 'เมนูสุขภาพ' },
    { number: '4.9', label: 'คะแนนรีวิว' },
    { number: '24/7', label: 'บริการตลอดเวลา' }
  ];

  if (!isMounted) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)'
      }}>
        <Typography sx={{ color: '#64748B', fontWeight: 300, fontSize: '0.875rem' }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1920&h=1080&fit=crop&crop=center') center/cover,
          radial-gradient(circle at 20% 80%, rgba(251, 113, 133, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(253, 164, 175, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(254, 202, 202, 0.04) 0%, transparent 50%),
          linear-gradient(to bottom, #FEFEFE 0%, #FDFDFD 100%)
        `,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0
        }
      }}
    >
            {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 4, sm: 6, md: 8, lg: 16 },
          overflow: 'hidden',
          minHeight: { xs: '70vh', sm: '80vh', md: 'auto' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.1)',
            opacity: 0.3,
            pointerEvents: 'none',
            zIndex: 2
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at center, 
                rgba(251, 113, 133, 0.1) 0%, 
                rgba(253, 164, 175, 0.05) 50%,
                transparent 100%
              )
            `,
            pointerEvents: 'none',
            zIndex: 3
          }
        }}
      >
        {/* Background Video */}
        <Box
          component="video"
          autoPlay
          loop
          muted
          playsInline
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            opacity: 0.6
          }}
        >
          <source src="/images/bg_clip.mp4" type="video/mp4" />
          {/* Fallback for unsupported browsers */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: `
                linear-gradient(135deg, 
                  rgba(251, 113, 133, 0.1) 0%, 
                  rgba(253, 164, 175, 0.1) 100%
                ),
                url('/images/bg.png')
              `,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </Box>
        <Container 
          maxWidth="lg" 
          sx={{ 
            position: 'relative', 
            zIndex: 4,
            px: { xs: 2, sm: 3, md: 4 }
          }}
        >
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: { xs: '100%', sm: 600, md: 800 },
            mx: 'auto'
          }}>
            {/* Glass Morphism Card for Brand */}
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: { xs: 4, sm: 5, md: 6 },
              p: { xs: 3, sm: 4, md: 6, lg: 10 },
              mb: { xs: 4, sm: 6, md: 8 },
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.1) 0%, 
                    rgba(255, 255, 255, 0.05) 100%
                  )
                `,
                pointerEvents: 'none'
              }
            }}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>

                <Box sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: { xs: 2, sm: 3, md: 4 }
                }}>
                  <img 
                    src="/images/logo_trim.png" 
                    alt="logo" 
                    style={{ 
                      width: '40%', 
                      maxWidth: '120px',
                      height: 'auto' 
                    }} 
                  />
                </Box>
                
                            <Typography 
                  variant="h1" 
                  className={prompt.className}
                  sx={{ 
                    fontWeight: 200,
                    mb: { xs: 2, sm: 2.5, md: 3 },
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem', lg: '4rem', xl: '5rem' },
                    color: '#1E293B',
                    lineHeight: 1.1,
                    letterSpacing: '-0.04em'
                  }}
                >
                  เดอะ 
                  <br />
                  <span style={{ 
                    fontWeight: 500, 
                    background: 'linear-gradient(135deg, #ff3131, #a11717)',
                    backgroundClip: 'text', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent'
                  }}>
                   เรด โพชั่น
                  </span>
            </Typography>
                
                            <Typography 
                  variant="h5" 
                  className={prompt.className}
                  sx={{ 
                    mb: { xs: 3, sm: 4, md: 6 },
                    color: '#64748B',
                    fontWeight: 300,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
                    lineHeight: 1.6,
                    maxWidth: { xs: '100%', sm: 500, md: 600 },
                    mx: 'auto',
                    px: { xs: 1, sm: 0 }
                  }}
                >
                  ระบบ web application 
                  <br />
                  สำหรับจัดการร้านอาหาร
                  <br />
                  เพื่อร้านอาหารของคุณ
            </Typography>
            
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 2, sm: 2.5, md: 3 }, 
                  justifyContent: 'center', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  mb: { xs: 3, sm: 4, md: 6 }
                }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{
                      background: 'rgba(251, 113, 133, 0.8)',
                      backdropFilter: 'blur(20px)',
                      color: 'white',
                      fontWeight: 500,
                      px: { xs: 4, sm: 5, md: 6 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                      borderRadius: { xs: 2, sm: 2.5, md: 3 },
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 10px 25px rgba(251, 113, 133, 0.15)',
                      width: { xs: '100%', sm: 'auto' },
                      '&:hover': {
                        background: 'rgba(251, 113, 133, 0.9)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 20px 40px rgba(251, 113, 133, 0.2)'
                      },
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    ขอทดลองใช้งานฟรี
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={() => setIsVideoPlaying(true)}
                    sx={{
                      color: '#64748B',
                      borderColor: 'rgba(100, 116, 139, 0.2)',
                      fontWeight: 500,
                      px: { xs: 4, sm: 5, md: 6 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                      borderRadius: { xs: 2, sm: 2.5, md: 3 },
                      background: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(20px)',
                      width: { xs: '100%', sm: 'auto' },
                      '&:hover': {
                        borderColor: 'rgba(100, 116, 139, 0.4)',
                        background: 'rgba(255, 255, 255, 0.7)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    ดูวิดีโอแนะนำ
                  </Button>
                </Box>

                <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 300 }}>
                  ⭐ คะแนน 4.9/5 จากลูกค้ามากกว่า 50,000 รีวิว
                </Typography>
              </Box>
            </Card>

            {/* Video Modal */}
            {isVideoPlaying && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  cursor: 'pointer'
                }}
                onClick={() => setIsVideoPlaying(false)}
              >
                <Card sx={{
                  width: '90%',
                  maxWidth: 1000,
                  aspectRatio: '16/9',
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {/* Close Button */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoPlaying(false);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 10,
                      background: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        background: 'rgba(0, 0, 0, 0.7)'
                      }
                    }}
                  >
                    <Close />
                  </IconButton>

                  {/* Actual Video */}
                  <video
                    width="100%"
                    height="100%"
                    controls
                    autoPlay
                    style={{
                      objectFit: 'cover',
                      borderRadius: '16px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <source src="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4" type="video/mp4" />
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                    {/* Fallback for browsers that don't support video */}
                    <Box sx={{
                      width: '100%',
                      height: '100%',
                      background: `
                        linear-gradient(135deg, 
                          rgba(251, 113, 133, 0.15) 0%, 
                          rgba(253, 164, 175, 0.15) 100%
                        ),
                        url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&h=600&fit=crop&crop=center')
                      `,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <Box sx={{
                        textAlign: 'center',
                        color: 'white'
                      }}>
                        <Box sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                          backdropFilter: 'blur(10px)'
                        }}>
                          <PlayArrow sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 300 }}>
                          เรื่องราวของเดอะ เรด โพชั่น
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                          การเดินทางสู่อาหารสุขภาพระดับพรีเมียม
                        </Typography>
                      </Box>
                      
                      {/* Floating Food Elements */}
                      <Box sx={{ position: 'absolute', top: '20%', left: '15%', fontSize: '2rem', opacity: 0.6 }}>🥗</Box>
                      <Box sx={{ position: 'absolute', top: '30%', right: '20%', fontSize: '1.5rem', opacity: 0.5 }}>🥑</Box>
                      <Box sx={{ position: 'absolute', bottom: '25%', left: '25%', fontSize: '1.8rem', opacity: 0.4 }}>🍓</Box>
                      <Box sx={{ position: 'absolute', bottom: '35%', right: '15%', fontSize: '1.3rem', opacity: 0.6 }}>🥬</Box>
                    </Box>
                  </video>
                </Card>
              </Box>
            )}

                        {/* Stats Glass Cards */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
              gap: { xs: 2, sm: 2.5, md: 3 },
              width: '100%',
              maxWidth: { xs: '100%', sm: 500, md: 600 }
            }}>
              {stats.map((stat, index) => (
                                  <Card
                    key={index}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.4)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: { xs: 2, sm: 2.5, md: 3 },
                      p: { xs: 2, sm: 2.5, md: 3 },
                      textAlign: 'center',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        background: 'rgba(255, 255, 255, 0.6)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                                    <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#1E293B',
                      mb: 0.5,
                      fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.75rem', lg: '2rem' }
                    }}
                  >
                    {stat.number}
                    </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#64748B',
                      fontWeight: 400,
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                    }}
                  >
                    {stat.label}
                    </Typography>
                </Card>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 4, sm: 5, md: 6, lg: 8 }, 
          position: 'relative', 
          zIndex: 1,
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5, md: 6, lg: 8 } }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 300,
              mb: { xs: 2, sm: 2.5, md: 3 },
              color: '#1E293B',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem', lg: '2.5rem' },
              letterSpacing: '-0.02em'
            }}
          >
            หมวดหมู่อาหารสุขภาพ
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#64748B',
              maxWidth: { xs: '100%', sm: 400, md: 500 },
              mx: 'auto',
              fontWeight: 300,
              fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
              lineHeight: 1.6,
              px: { xs: 2, sm: 0 }
            }}
          >
            เลือกอาหารสุขภาพที่เหมาะกับคุณ
            <br />
            จากผู้เชี่ยวชาญด้านโภชนาการ
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2, md: 2.5 }
        }}>
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
                <Card
                key={index}
                  sx={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 3,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                    transform: 'translateY(-4px)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: `0 12px 24px ${category.color}15`,
                    borderColor: `${category.color}30`,
                  },
                  height: '100%',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${category.color}, transparent)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover::before': {
                    opacity: 1
                  }
                }}
              >
                <CardContent 
                  sx={{ 
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  {/* Food Emoji Background */}
                  <Box sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    fontSize: '1.5rem',
                    opacity: 0.4,
                    zIndex: 0
                  }}>
                    {category.image}
                  </Box>
                  
                  <Box 
                    sx={{ 
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${category.color}20, ${category.color}10)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      border: `1px solid ${category.color}25`,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <IconComponent sx={{ fontSize: 20, color: category.color }} />
                  </Box>

                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 500,
                      mb: 1,
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {category.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#64748B',
                      lineHeight: 1.4,
                      fontSize: '0.75rem',
                      fontWeight: 300,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {category.description}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Container>

      {/* Features Section */}
      <Box sx={{ 
        py: { xs: 6, md: 8 },
        position: 'relative',
        zIndex: 1,
        background: `
          url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop&crop=center&overlay=gradient&overlay-color=ffffff&overlay-opacity=0.9')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(100px)',
          pointerEvents: 'none'
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography 
              variant="h2" 
                        sx={{ 
                fontWeight: 300,
                          mb: 3,
                color: '#1E293B',
                fontSize: { xs: '2rem', md: '2.5rem' },
                letterSpacing: '-0.02em'
              }}
            >
              ทำไมต้องเลือกเรา
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#64748B',
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 300,
                fontSize: '1rem',
                lineHeight: 1.6,
                mb: 2
              }}
            >
              มาตรฐานระดับโลก เพื่อสุขภาพที่ดีของคุณ
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 3,
            maxWidth: 800,
            mx: 'auto'
          }}>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 3,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.7)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
                  }
                }}>
                        <Box
                          sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: 'rgba(251, 113, 133, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid rgba(251, 113, 133, 0.2)'
                          }}
                        >
                    <IconComponent sx={{ fontSize: 18, color: '#F472B6' }} />
                        </Box>
                  <Box>
                      <Typography 
                      variant="h6" 
                        sx={{ 
                          fontWeight: 500,
                        mb: 0.5,
                        color: '#1E293B',
                        fontSize: '0.875rem'
                        }}
                      >
                      {feature.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                        color: '#64748B',
                        lineHeight: 1.4,
                        fontSize: '0.75rem',
                        fontWeight: 300
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
        <Card sx={{ 
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.8) 0%, 
              rgba(255, 255, 255, 0.8) 100%
            ),
            url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&h=600&fit=crop&crop=center')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          textAlign: 'center',
          p: { xs: 8, md: 12 },
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(251, 113, 133, 0.15)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(1px)',
          }
        }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 300, 
                mb: 3,
                fontSize: { xs: '1.875rem', md: '2.25rem' },
                letterSpacing: '-0.02em'
              }}
            >
              เริ่มต้นการเดินทางสู่สุขภาพดี
          </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 6, 
                opacity: 0.9, 
                maxWidth: 500, 
                mx: 'auto',
                fontSize: '1rem',
                fontWeight: 300,
                lineHeight: 1.6
              }}
            >
              อาหารสุขภาพระดับพรีเมียม ส่งตรงความสดใหม่
              <br />
              ถึงหน้าประตูบ้านคุณ
          </Typography>
            <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
                size="large"
                endIcon={<ShoppingBag />}
                sx={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  color: '#1E293B',
                  fontWeight: 500,
                  px: 6,
                  py: 2.5,
                  fontSize: '0.875rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                              >
                  สั่งอาหารเลย
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  endIcon={<Phone />}
            sx={{
                    color: '#1E293B',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    fontWeight: 500,
                    px: 6,
                    py: 2.5,
                    fontSize: '0.875rem',
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
              '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      background: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-2px)'
              },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
                  ติดต่อเรา
          </Button>
            </Box>
          </Box>
        </Card>
      </Container>

      {/* Minimal Footer */}
      <Box sx={{ 
        background: `
          linear-gradient(135deg, 
            rgba(30, 41, 59, 0.02) 0%, 
            rgba(51, 65, 85, 0.02) 100%
          ),
          rgba(255, 255, 255, 0.8)
        `,
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        py: { xs: 6, md: 8 },
        position: 'relative',
        zIndex: 1
      }}>
        <Container maxWidth="lg">
          {/* Main Footer Content */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-start' },
            gap: { xs: 6, md: 8 },
            mb: { xs: 6, md: 8 },
            textAlign: { xs: 'center', md: 'left' }
          }}>
            {/* Brand Section */}
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 300,
                  mb: 2,
                  fontSize: '1.5rem',
                  background: 'linear-gradient(135deg, #F472B6, #FDA4AF)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                เดอะ เรด โพชั่น
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748B',
                  lineHeight: 1.6,
                  maxWidth: 300,
                  fontSize: '0.875rem',
                  fontWeight: 300,
                  mb: 3
                }}
              >
                แพลตฟอร์มจัดส่งอาหารสุขภาพระดับพรีเมียม
                ที่สร้างขึ้นด้วยความใส่ใจในสุขภาพของคุณ
              </Typography>
              
              {/* Social Icons */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                {[Instagram, Twitter, Facebook, YouTube].map((Icon, index) => (
                  <IconButton
                    key={index}
                    size="small"
                    sx={{
                      width: 36,
                      height: 36,
                      background: 'rgba(251, 113, 133, 0.08)',
                      color: '#F472B6',
                      border: '1px solid rgba(251, 113, 133, 0.15)',
                      '&:hover': {
                        background: 'rgba(251, 113, 133, 0.15)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </IconButton>
                ))}
              </Box>
            </Box>

            {/* Contact Info */}
            <Box sx={{ flex: 1, maxWidth: 200 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 500, 
                  fontSize: '1rem',
                  color: '#1E293B'
                }}
              >
                ติดต่อเรา
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 300 }}>
                  📞 02-123-4567
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 300 }}>
                  📧 info@theredpotion.co.th
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 300 }}>
                  📍 กรุงเทพมหานคร ประเทศไทย
                </Typography>
              </Box>
            </Box>

            {/* Quick Links */}
            <Box sx={{ flex: 1, maxWidth: 200 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 500, 
                  fontSize: '1rem',
                  color: '#1E293B'
                }}
              >
                ลิงก์ด่วน
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {['เมนูอาหาร', 'เกี่ยวกับเรา', 'ติดต่อเรา', 'นโยบายความเป็นส่วนตัว'].map((link) => (
                  <Typography 
                    key={link}
                    variant="body2" 
                    sx={{ 
                      color: '#64748B', 
                      fontSize: '0.75rem', 
                      fontWeight: 300,
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#F472B6'
                      },
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {link}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Bottom Bar */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            pt: 6,
            borderTop: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 300
              }}
            >
              © 2024 เดอะ เรด โพชั่น สงวนลิขสิทธิ์ทุกประการ
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip 
                label="🌱 ออร์แกนิก" 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(251, 113, 133, 0.08)',
                  color: '#BE185D',
                  fontSize: '0.65rem',
                  height: 24,
                  border: '1px solid rgba(251, 113, 133, 0.15)'
                }} 
              />
              <Chip 
                label="🚚 ส่งเร็ว" 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(253, 164, 175, 0.08)',
                  color: '#E11D48',
                  fontSize: '0.65rem',
                  height: 24,
                  border: '1px solid rgba(253, 164, 175, 0.15)'
                }} 
              />
              <Chip 
                label="❤️ สุขภาพดี" 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(254, 202, 202, 0.08)',
                  color: '#F472B6',
                  fontSize: '0.65rem',
                  height: 24,
                  border: '1px solid rgba(254, 202, 202, 0.15)'
                }} 
              />
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 