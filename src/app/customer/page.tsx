'use client';

import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip,
  IconButton,
  Avatar
} from '@mui/material';
import { 
  Star,
  Fastfood,
  LocalPizza,
  RamenDining,
  SoupKitchen,
  LocalFlorist,
  Cake,
  LocalBar,
  MoreHoriz,
  NotificationsNone,
  ShoppingBag,
  Search,
  LocationOn,
  AccessTime,
  Add
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CustomerPage() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = [
    { name: 'Hamburger', icon: <Fastfood sx={{ fontSize: 20 }} />, color: '#f59e0b' },
    { name: 'Pizza', icon: <LocalPizza sx={{ fontSize: 20 }} />, color: '#ef4444' },
    { name: 'Noodles', icon: <RamenDining sx={{ fontSize: 20 }} />, color: '#8b5cf6' },
    { name: 'Meat', icon: <SoupKitchen sx={{ fontSize: 20 }} />, color: '#f97316' },
    { name: 'Vegeta..', icon: <LocalFlorist sx={{ fontSize: 20 }} />, color: '#10b981' },
    { name: 'Dessert', icon: <Cake sx={{ fontSize: 20 }} />, color: '#ec4899' },
    { name: 'Drink', icon: <LocalBar sx={{ fontSize: 20 }} />, color: '#3b82f6' },
    { name: 'More', icon: <MoreHoriz sx={{ fontSize: 20 }} />, color: '#6b7280' },
  ];

  const bannerSlides = [
    {
      id: 1,
      title: '30% OFF',
      subtitle: 'Special Discount',
      description: 'All premium meals today',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(52, 211, 153, 0.85) 100%)',
    },
    {
      id: 2,
      title: 'FREE DELIVERY',
      subtitle: 'Orders Over ฿300',
      description: 'Fast & reliable service',
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=400&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.85) 100%)',
    },
    {
      id: 3,
      title: 'NEW MENU',
      subtitle: 'Fresh & Healthy',
      description: 'Japanese fusion cuisine',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=400&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.95) 0%, rgba(244, 114, 182, 0.85) 100%)',
    },
  ];



  const cleanKetoFoodDeals = [
    {
      id: 1,
      name: 'ข้าวโพดคินัวคลีน',
      description: 'คินัวออร์แกนิก อโวคาโด เคล และเมล็ดงา',
      healthBenefits: 'โปรตีนสูง ไฟเบอร์ โอเมก้า 3',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
      originalPrice: 280,
      discountedPrice: 210,
      discountPercent: 25,
      rating: 4.8,
      reviewCount: 324,
      cookingTime: 8,
      restaurant: 'คลีนอีท แคเฟ่',
      calories: 450,
      carbs: 35,
      protein: 18,
      fat: 22,
      isClean: true,
      isVegan: true
    },
    {
      id: 2,
      name: 'แซลมอนย่างคีโต',
      description: 'แซลมอนนอร์เวย์ย่าง ผักโบรคโคลี่ อโวคาโด',
      healthBenefits: 'โอเมก้า 3 วิตามินดี ไขมันดี',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=200&fit=crop',
      originalPrice: 420,
      discountedPrice: 315,
      discountPercent: 25,
      rating: 4.9,
      reviewCount: 567,
      cookingTime: 15,
      restaurant: 'คีโต คิทเช่น',
      calories: 380,
      carbs: 8,
      protein: 35,
      fat: 28,
      isKeto: true,
      isGlutenFree: true
    },
    {
      id: 3,
      name: 'สมูทตี้ดีท็อกเขียว',
      description: 'ผักโขม เคล แตงกวา แอปเปิ้ลเขียว ขิง',
      healthBenefits: 'ล้างพิษ วิตามินซี เพิ่มพลังงาน',
      image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=300&h=200&fit=crop',
      originalPrice: 120,
      discountedPrice: 84,
      discountPercent: 30,
      rating: 4.6,
      reviewCount: 289,
      cookingTime: 3,
      restaurant: 'เพียว จูส บาร์',
      calories: 150,
      carbs: 25,
      protein: 8,
      fat: 3,
      isClean: true,
      isVegan: true
    },
    {
      id: 4,
      name: 'ไก่ขมิ้นข้าวดำคลีน',
      description: 'ไก่อินทรีย์ย่าง ข้าวดำงอก ผักรวมนึ่ง',
      healthBenefits: 'ต้านอักเสบ โปรตีนสูง ไฟเบอร์',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
      originalPrice: 250,
      discountedPrice: 200,
      discountPercent: 20,
      rating: 4.7,
      reviewCount: 412,
      cookingTime: 12,
      restaurant: 'สไปซ์ เฮลท์',
      calories: 420,
      carbs: 45,
      protein: 32,
      fat: 8,
      isClean: true,
      isGlutenFree: true
    },
    {
      id: 5,
      name: 'เนื้อวากิวคีโต',
      description: 'เนื้อวากิวย่าง เห็ดโชกุน ผักกาดแก้ว',
      healthBenefits: 'โปรตีนคุณภาพสูง ไขมันดี เซลีเนียม',
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=300&h=200&fit=crop',
      originalPrice: 580,
      discountedPrice: 435,
      discountPercent: 25,
      rating: 4.9,
      reviewCount: 198,
      cookingTime: 18,
      restaurant: 'พรีเมี่ยม กริลล์',
      calories: 520,
      carbs: 5,
      protein: 45,
      fat: 38,
      isKeto: true,
      isPremium: true
    },
    {
      id: 6,
      name: 'สลัดโปรตีนคลีน',
      description: 'ไข่ไก่ใส่อกไก่ย่าง ผักใบเขียว นัตส์รวม',
      healthBenefits: 'โปรตีนครบถ้วน วิตามินอี มิเนอรัล',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=200&fit=crop',
      originalPrice: 180,
      discountedPrice: 144,
      discountPercent: 20,
      rating: 4.5,
      reviewCount: 256,
      cookingTime: 5,
      restaurant: 'เฟรช การ์เดน',
      calories: 320,
      carbs: 12,
      protein: 28,
      fat: 18,
      isClean: true,
      isGlutenFree: true
    }
  ];

  if (!mounted) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#ffffff',
      }}>
        <Typography>กำลังโหลด...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, 
          rgba(255, 255, 255, 0.95) 0%,
          rgba(248, 250, 252, 0.9) 50%,
          rgba(241, 245, 249, 0.85) 100%
        )
      `,
      position: 'relative',
      // Hide scrollbar
      '& ::-webkit-scrollbar': {
        display: 'none',
      },
      '& *': {
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 50%)
        `,
        zIndex: 0,
      }
    }}>
      {/* Fixed Header */}
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 2px 8px rgba(31, 38, 135, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        pt: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32,
            background: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <Image 
              src="https://images.unsplash.com/photo-1494790108755-2616b612b784?w=100&h=100&fit=crop&crop=face" 
              width={32}
              height={32}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              alt="Profile"
            />
          </Avatar>
          <Box>
            <Typography variant="caption" sx={{ 
              color: 'rgba(0, 0, 0, 0.6)', 
              fontSize: '0.7rem',
              fontWeight: 500,
            }}>
              Deliver to
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                fontSize: '0.85rem',
                color: 'rgba(0, 0, 0, 0.9)',
              }}>
                Current Location
              </Typography>
              <LocationOn sx={{ 
                fontSize: 12, 
                color: theme.palette.primary.main,
              }} />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[Search, NotificationsNone, ShoppingBag].map((Icon, index) => (
            <IconButton 
              key={index}
              size="small" 
              sx={{ 
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                                  '&:hover': { 
                    background: 'rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }
              }}
            >
              <Icon sx={{ fontSize: 20, color: 'rgba(0, 0, 0, 0.7)' }} />
            </IconButton>
          ))}
        </Box>
      </Box>

      {/* Scrollable Body Content */}
      <Box sx={{ 
        pt: '80px',
        width: '100%',
        overflowX: 'hidden',
        position: 'relative',
        zIndex: 1,
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Full Width Banner Swiper */}
        <Box sx={{ mb: 2 }}>
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active',
            }}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
            }}
            style={{ 
              width: '100%',
              paddingBottom: '40px'
            }}
          >
            {bannerSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 180,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      '& .banner-overlay': {
                        opacity: 0.8,
                      },
                      '& .banner-content': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  {/* Full Background Image */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${slide.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'brightness(0.7)',
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <Box
                    className="banner-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: slide.gradient,
                      opacity: 0.75,
                      transition: 'opacity 0.3s ease',
                    }}
                  />
                  
                  {/* Content */}
                  <Box
                    className="banner-content"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      textAlign: 'center',
                      zIndex: 2,
                      px: 3,
                    }}
                  >
                    <Typography variant="h1" sx={{ 
                      fontWeight: 900, 
                      mb: 1, 
                      fontSize: '2.2rem',
                      lineHeight: 0.9,
                      textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                      letterSpacing: '-0.02em',
                    }}>
                      {slide.title}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      mb: 0.5, 
                      fontSize: '1rem',
                      opacity: 0.95,
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                    }}>
                      {slide.subtitle}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500, 
                      fontSize: '0.85rem',
                      opacity: 0.9,
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                      maxWidth: '80%',
                    }}>
                      {slide.description}
                    </Typography>
                  </Box>
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>

        {/* Categories */}
        <Box sx={{ 
          px: 2,
          mb: 2,
        }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 2,
            scrollBehavior: 'smooth',
          }}>
            {categories.map((category, index) => (
              <Box key={index} sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(25px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.6)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <Box sx={{ 
                    color: category.color,
                    filter: `drop-shadow(0 1px 2px ${category.color}30)`,
                  }}>
                    {category.icon}
                  </Box>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    color: 'rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {category.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Clean & Keto Food Deals */}
        <Box sx={{ 
          px: 2,
          mb: 3,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                fontSize: '1.1rem',
                color: 'rgba(0, 0, 0, 0.9)',
              }}>
                อาหารคลีน & คีโต
              </Typography>
              <Typography sx={{ 
                fontSize: '1.2rem',
                filter: 'drop-shadow(0 2px 4px rgba(76, 175, 80, 0.5))',
              }}>🥗</Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.8rem',
            }}>
              ดูทั้งหมด
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            scrollBehavior: 'smooth',
          }}>
            {cleanKetoFoodDeals.map((item) => (
              <Card
                key={item.id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(25px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                    background: 'rgba(255, 255, 255, 0.6)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="150"
                  image={item.image}
                  alt={item.name}
                  sx={{ 
                    objectFit: 'cover',
                  }}
                />
                {/* Discount Badge */}
                <Chip
                  label={`-${item.discountPercent}%`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: 'linear-gradient(135deg, #ef4444, #f87171)',
                    backdropFilter: 'blur(20px)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 24,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                    zIndex: 2,
                  }}
                />
                
                {/* Health Badge */}
                {(item.isClean || item.isKeto || item.isVegan || item.isPremium) && (
                  <Chip
                    label={
                      item.isPremium ? 'PREMIUM' :
                      item.isKeto ? 'KETO' :
                      item.isClean ? 'CLEAN' :
                      item.isVegan ? 'VEGAN' : 'HEALTHY'
                    }
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: item.isPremium 
                        ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                        : item.isKeto 
                        ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
                        : 'linear-gradient(135deg, #10b981, #34d399)',
                      backdropFilter: 'blur(20px)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.6rem',
                      height: 20,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                      zIndex: 2,
                    }}
                  />
                )}

                <CardContent sx={{ 
                  p: 1.5,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 600, 
                    mb: 0.5, 
                    fontSize: '0.8rem',
                    color: 'rgba(0, 0, 0, 0.9)',
                    lineHeight: 1.2,
                  }}>
                    {item.name}
                  </Typography>
                  
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontSize: '0.65rem',
                    mb: 0.8,
                    display: 'block',
                  }}>
                    {item.restaurant}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Star sx={{ 
                      fontSize: 12, 
                      color: '#fbbf24',
                    }} />
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.65rem',
                      color: 'rgba(0, 0, 0, 0.7)',
                    }}>
                      {item.rating}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, ml: 'auto' }}>
                      <AccessTime sx={{ fontSize: 10, color: 'rgba(0, 0, 0, 0.5)' }} />
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.65rem',
                        color: 'rgba(0, 0, 0, 0.6)',
                      }}>
                        {item.cookingTime} นาที
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.primary.main,
                        fontSize: '0.9rem',
                      }}>
                        ฿{item.discountedPrice}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          textDecoration: 'line-through',
                          color: 'rgba(0, 0, 0, 0.5)',
                          fontSize: '0.7rem'
                        }}
                      >
                        ฿{item.originalPrice}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        backdropFilter: 'blur(20px)',
                        color: 'white',
                        width: 28,
                        height: 28,
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                        },
                      }}
                    >
                      <Add sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 