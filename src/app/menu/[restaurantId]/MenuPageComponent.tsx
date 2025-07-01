'use client';

import { useRestaurant } from './context/RestaurantContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Box, Typography, Card, CardContent, CardMedia, Button, Chip, 
         CircularProgress, Alert, IconButton, Drawer, List, ListItem, ListItemText,
         ListItemSecondaryAction, ButtonGroup, Avatar, InputBase, Badge, Paper,
         Container } from '@mui/material';
import NoSSR from '../../components/NoSSR';
import FooterNavbar from '../../components/FooterNavbar';
import { ShoppingCart, Add, Remove, Delete, Favorite, FavoriteBorder,
         Search, NotificationsNone, Restaurant, LocalPizza, RamenDining, 
         LocalBar, Category, Star, LocationOn, AccessTime, Visibility,
         TrendingUp, Recommend, Fastfood, LocalDining, LunchDining,
         LocalCafe, Icecream, PhotoLibrary } from '@mui/icons-material';
// Swiper imports for smooth carousels (for special offers)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Add custom styles for animations and smooth scrolling
const globalStyles = `
  html {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scaleX(0);
    }
    to {
      opacity: 1;
      transform: scaleX(1);
    }
  }
  
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(8px) scale(0.99);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .menu-items-container {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity, transform;
  }
  
  .menu-items-container.changing {
    opacity: 0;
    transform: translateY(5px);
  }
`;

// Inject styles only once
if (typeof document !== 'undefined' && !document.getElementById('menu-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'menu-animations';
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}

interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  available: boolean;
  cookingTime: number;
  isPopular?: boolean;
  isPromotion?: boolean;
  tags?: string[];
  isHit?: boolean;
}

interface GalleryImage {
  id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Cart Badge Component ที่ป้องกัน hydration mismatch
function CartBadge({ cart }: { cart: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted ? cart.reduce((total, item) => total + item.quantity, 0) : 0;

  return (
    <Badge 
      badgeContent={cartCount} 
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: '#10B981',
          color: 'white',
          fontSize: '0.65rem',
          minWidth: '16px',
          height: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
          fontWeight: 500,
          display: mounted && cartCount > 0 ? 'flex' : 'none'
        }
      }}
    >
      <ShoppingCart sx={{ fontSize: 18 }} />
    </Badge>
  );
}

// Gallery Skeleton Component
function GallerySkeleton() {
  return (
    <Box 
      sx={{ 
        px: 2,
        pb: '45px', // เหมือน Swiper padding
        overflow: 'hidden' 
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        gap: 2,
        overflowX: 'hidden',
        width: '100%'
      }}>
        {[1, 2, 3].map((index) => (
          <Box
            key={index}
            sx={{
              flex: '0 0 auto',
              width: { 
                xs: 'calc(100vw - 40px)', // เหมือน slidesPerView 1.05
                sm: 'calc(90vw - 40px)',   // เหมือน slidesPerView 1.1
                md: 'calc(55vw - 40px)',   // เหมือน slidesPerView 1.8
                lg: 'calc(45vw - 40px)'    // เหมือน slidesPerView 2.2
              },
              height: { xs: 200, sm: 220, md: 240, lg: 260 },
              borderRadius: 1,
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              '@keyframes shimmer': {
                '0%': {
                  backgroundPosition: '-200% 0'
                },
                '100%': {
                  backgroundPosition: '200% 0'
                }
              }
            }}
          >
            {/* Skeleton overlay pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 56,
                height: 56,
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <PhotoLibrary sx={{ 
                fontSize: 28, 
                color: '#cbd5e1',
                opacity: 0.7
              }} />
            </Box>
            
            {/* Skeleton pagination dots */}
            {index === 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 1
                }}
              >
                {[1, 2, 3].map((dot) => (
                  <Box
                    key={dot}
                    sx={{
                      width: dot === 2 ? 12 : 8,
                      height: 8,
                      borderRadius: '4px',
                      background: dot === 2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Function to render category icons
function CategoryIcon({ iconName, selected, size = '18px' }: { iconName: string; selected: boolean; size?: string }) {
  const iconProps = {
    sx: { 
      fontSize: size,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: selected ? 1 : 0.75,
      color: selected 
        ? 'rgba(16, 185, 129, 0.9)' 
        : 'rgba(71, 85, 105, 0.7)',
      filter: selected 
        ? 'drop-shadow(0 2px 6px rgba(16, 185, 129, 0.25))' 
        : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
    }
  };

  switch (iconName) {
    case 'TrendingUp':
      return <TrendingUp {...iconProps} />;
    case 'Recommend':
      return <Recommend {...iconProps} />;
    case 'Fastfood':
      return <Fastfood {...iconProps} />;
    case 'LocalDining':
      return <LocalDining {...iconProps} />;
    case 'LocalPizza':
      return <LocalPizza {...iconProps} />;
    case 'LunchDining':
      return <LunchDining {...iconProps} />;
    case 'LocalCafe':
      return <LocalCafe {...iconProps} />;
    case 'Icecream':
      return <Icecream {...iconProps} />;
    default:
      return <Category {...iconProps} />;
  }
}

// ฟังก์ชันตรวจสอบว่าร้านเปิดอยู่หรือไม่
const isRestaurantOpen = (hours: string, currentDate: Date = new Date()): boolean => {
  if (!hours || hours === '-') return false;
  
  try {
    // แยกเวลาเปิดและปิด เช่น "16:19 - 04:19"
    const [openTime, closeTime] = hours.split(' - ').map(time => time.trim());
    if (!openTime || !closeTime) return false;
    
    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes(); // แปลงเป็นนาที
    
    // แปลงเวลาเปิดและปิดเป็นนาที
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    // กรณีปิดข้ามวัน (เช่น เปิด 16:19 - 04:19)
    if (closeMinutes < openMinutes) {
      return currentTime >= openMinutes || currentTime <= closeMinutes;
    }
    // กรณีปกติ (เช่น เปิด 08:00 - 22:00)
    else {
      return currentTime >= openMinutes && currentTime <= closeMinutes;
    }
  } catch (error) {
    console.error('Error parsing restaurant hours:', error);
    return false;
  }
};

export default function MenuPageComponent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { restaurant, loading, error, cart, cartTotal, addToCart, 
          removeFromCart, updateCartItemQuantity } = useRestaurant();
  
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);

  // แปลงข้อมูลจาก restaurant context ให้เข้ากับ MenuCategory interface
  // และกรองเฉพาะ category ที่มีอาหารอย่างน้อย 1 รายการ
  const categories: MenuCategory[] = restaurant?.menu?.map(category => ({
    id: category.id,
    name: category.name,
    icon: 'LocalDining', // ใช้ icon เริ่มต้น
    items: (category.items || []).map(item => ({
      ...item,
      category: category.id // ตั้งค่า category เป็น category ID ที่ถูกต้อง
    }))
  })).filter(category => category.items.length > 0) || [];

  // รวมรายการอาหารจากทุกหมวดหมู่
  const menuItems: MenuItem[] = categories.flatMap(category => category.items || []);
  
  // ดึงข้อมูล gallery พร้อมกับการโหลดหน้า (ไม่ต้องรอ)
  useEffect(() => {
    if (restaurant?.id) {
      // เรียก fetchGallery ทันทีโดยไม่บล็อก UI และไม่รอผลลัพธ์
      fetchGallery().catch(console.error);
    }
  }, [restaurant?.id]);

  const fetchGallery = async () => {
    try {
      // Background loading with optimized settings
      const url = `/api/restaurant/${restaurant?.id}/gallery`;
      console.log('🚀 Fast gallery fetch:', url);
      
      const response = await fetch(url, {
        // Optimized for speed
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes cache
        },
        // Fast cache strategy
        cache: 'default',
        next: { 
          revalidate: 300, // 5 minutes
          tags: [`gallery-${restaurant?.id}`] 
        },
        // Faster timeout
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        const galleryData = await response.json();
        console.log('⚡ Gallery loaded fast:', galleryData.length, 'images');
        // Immediate update
        setGalleryImages(galleryData);
      } else {
        console.warn('⚠️ Gallery unavailable, continuing without:', response.status);
        setGalleryImages([]);
      }
    } catch (error) {
      // Silent fail - don't block the UI
      console.warn('⚠️ Gallery fetch skipped:', error instanceof Error ? error.message : 'Unknown error');
      setGalleryImages([]);
    } finally {
      setGalleryLoaded(true);
    }
  };

  // อัปเดต selectedCategory เมื่อมีข้อมูลร้าน (เฉพาะครั้งแรกเท่านั้น)
  useEffect(() => {
    if (restaurant && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
      setActiveTab(categories[0].id);
    } else if (restaurant && categories.length === 0) {
      // กรณีไม่มี category ใดที่มีอาหาร
      setSelectedCategory('');
      setActiveTab('');
    }
    
    // Debug: แสดงข้อมูลร้าน (เปิดเมื่อต้องการ debug)
    if (restaurant && categories.length > 0) {
      console.log('🏪 Categories:', categories.map(cat => ({ id: cat.id, name: cat.name, itemCount: cat.items.length })));
      console.log('🍽️ Menu Items:', menuItems.map(item => ({ id: item.id, name: item.name, category: item.category })));
      console.log('📋 Selected Category:', selectedCategory);
    }
  }, [restaurant, categories, selectedCategory]);

  // อัปเดตเวลาปัจจุบันทุกนาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // อัปเดตทุก 1 นาที

    return () => clearInterval(timer);
  }, []);

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getItemQuantityInCart = (itemId: string) => {
    const cartItem = cart.find(item => item.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Handle category change with smooth animation
  const handleCategoryChange = (categoryId: string) => {
    console.log('🔄 Category Change:', { from: selectedCategory, to: categoryId, isAnimating });
    
    if (categoryId === selectedCategory || isAnimating) return;
    
    setIsAnimating(true);
    
    // Smooth transition with optimized timing
    requestAnimationFrame(() => {
      setTimeout(() => {
        console.log('✅ Setting new category:', categoryId);
        setSelectedCategory(categoryId);
        setAnimationKey(prev => prev + 1);
        
        // Reset animation state after transition completes
        requestAnimationFrame(() => {
          setTimeout(() => {
            setIsAnimating(false);
          }, 50);
        });
      }, 200);
    });
  };

  const filteredItems = categories.length > 0 && selectedCategory && selectedCategory !== 'all'
    ? menuItems.filter(item => item.category === selectedCategory)
    : menuItems;

  const searchFilteredItems = searchQuery 
    ? filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredItems;

  // Debug การกรองรายการอาหาร
  console.log('🔍 Filter Debug:', {
    selectedCategory,
    totalMenuItems: menuItems.length,
    filteredItemsCount: filteredItems.length,
    filteredItems: filteredItems.map(item => ({ name: item.name, category: item.category }))
  });

  // หลังจากมี redirect ใน RestaurantContext แล้ว 
  // ไม่จำเป็นต้องแสดง error state ที่นี่อีก เพราะจะ redirect ไปหน้าหลักแล้ว
  // จัดการเฉพาะกรณี !restaurant (กำลังรอ redirect)
  if (!restaurant) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            filter: 'blur(40px)',
            animation: 'liquidFloat 6s ease-in-out infinite'
          }}
        />

        {/* Redirect Loading Card */}
        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            p: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeInUp 0.6s ease-out both'
          }}
        >
          {/* Loading Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '2px solid rgba(251, 191, 36, 0.2)',
              animation: 'pulseGlow 2s ease-in-out infinite'
            }}
          >
            <Search 
              sx={{ 
                fontSize: 40, 
                color: '#f59e0b',
                filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.3))'
              }} 
            />
          </Box>

          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              color: 'rgba(0, 0, 0, 0.9)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            กำลังตรวจสอบข้อมูล...
          </Typography>

          <Typography 
            sx={{ 
              color: 'rgba(0, 0, 0, 0.7)',
              mb: 3,
              fontSize: '1rem'
            }}
          >
            กรุณารอสักครู่
          </Typography>

          <CircularProgress 
            sx={{ 
              color: '#10B981',
              '& .MuiCircularProgress-circle': {
                filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.3))'
              }
            }} 
          />
        </Card>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth'
      }}
    >
      {/* Fixed Header with Glass Effect */}
      <Box
        sx={{
          p: 2,
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Customer Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            {/* User Avatar or Login Button */}
            {session?.user ? (
              <IconButton 
                onClick={() => signOut({ callbackUrl: '/' })}
                sx={{ 
                  width: 40,
                  height: 40,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  p: 0,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  },
                  transition: 'all 0.2s ease-out'
                }}
              >
                <Avatar 
                  src={session.user.image || undefined}
                  alt={session.user.name || 'User'}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    fontSize: '0.875rem',
                    bgcolor: '#10B981',
                    color: 'white'
                  }}
                >
                  {!session.user.image && session.user.name ? 
                    session.user.name.charAt(0).toUpperCase() : 
                    'U'
                  }
                </Avatar>
              </IconButton>
            ) : (
              <IconButton 
                onClick={() => signIn()}
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.7)',
                  width: 40,
                  height: 40,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  p: 0,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  },
                  transition: 'all 0.2s ease-out'
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: '#6B7280',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  ?
                </Avatar>
              </IconButton>
            )}
            <Box>
              <Typography 
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                จัดส่งไปที่
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationOn sx={{ fontSize: 16, color: '#10B981' }} />
                <Typography 
                  sx={{ 
                    color: 'rgba(0, 0, 0, 0.9)',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  สุขุมวิท, กรุงเทพฯ
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box display="flex" gap={1}>
            <IconButton 
              onClick={() => setSearchOpen(!searchOpen)}
              sx={{ 
                color: 'rgba(0, 0, 0, 0.7)',
                width: 40,
                height: 40,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                },
                transition: 'all 0.2s ease-out'
              }}
            >
              <Search sx={{ fontSize: 20 }} />
            </IconButton>
            
            <IconButton 
              onClick={() => router.push(`/cart/${restaurant?.id}`)}
              sx={{
                color: 'rgba(0, 0, 0, 0.7)',
                width: 40,
                height: 40,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                position: 'relative',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                },
                transition: 'all 0.2s ease-out'
              }}
            >
              <NoSSR fallback={<ShoppingCart sx={{ fontSize: 18 }} />}>
                <CartBadge cart={cart}  />
              </NoSSR>
            </IconButton>

            {/* Notification Icon */}
            <IconButton 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.7)',
                width: 40,
                height: 40,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                },
                transition: 'all 0.2s ease-out'
              }}
            >
              <NotificationsNone sx={{ fontSize: 20 }} />
            </IconButton>

            {/* User Profile & Logout */}
            {session?.user && (
              <IconButton 
                onClick={() => signOut({ callbackUrl: '/' })}
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.7)',
                  width: 40,
                  height: 40,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  },
                  transition: 'all 0.2s ease-out'
                }}
              >
                <Avatar 
                  src={session.user.image || undefined}
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    fontSize: '0.7rem',
                    backgroundColor: '#10B981',
                    color: 'white'
                  }}
                >
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ pt: 10, pb: 8 }}>
        {/* Restaurant Info Card with Glass Effect */}
        <Box sx={{ mb: 3 }}>
          <Card 
            sx={{ 
              borderRadius: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              width: '100vw',
              marginLeft: 'calc(-50vw + 50%)',
              marginRight: 'calc(-50vw + 50%)'
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="150"
                image={restaurant?.banner || "/images/default_restaurant1.jpg"}
                alt={restaurant?.name || "Restaurant"}
                sx={{ 
                  objectFit: 'cover',
                  filter: 'brightness(0.9)',                  
                }}
              />
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(5px)',
                  borderRadius: '20px',
                  px: 2,
                  py: 1,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                
                <Typography sx={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 500, 
                  color: 'rgba(0, 0, 0, 0.85)',
                  letterSpacing: '0.01em'
                }}>
                  {restaurant?.name}
                </Typography>
              </Box>
            </Box>
            
            <CardContent sx={{ px: 3, py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                
                <Box sx={{ flex: 1 }}>
                  
                  {/* Welcome Message */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography sx={{ fontSize: '0.95rem', color: 'rgba(0, 0, 0, 0.65)', fontWeight: 500, letterSpacing: '0.005em' }}>
                      สวัสดี{session?.user?.name ? ` คุณ${session.user.name}` : ''}
                    </Typography>
                    {session?.user && (
                      <Chip 
                        label="LINE" 
                        size="small"
                        sx={{ 
                          background: 'rgba(6, 199, 85, 0.15)',
                          color: '#06C755',
                          fontSize: '0.65rem',
                          height: '18px',
                          border: '1px solid rgba(6, 199, 85, 0.25)',
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    )}
                  </Box>
                  
                  {/* Status and Time */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    
                    {(() => {
                      const isOpen = isRestaurantOpen(restaurant?.contact?.hours || '', currentTime);
                      return (
                    <Chip 
                          label={isOpen ? "เปิดอยู่" : "ปิดอยู่"} 
                      size="small"
                      sx={{ 
                            background: isOpen 
                              ? 'rgba(16, 185, 129, 0.15)' 
                              : 'rgba(239, 68, 68, 0.15)',
                            backdropFilter: 'blur(4px)',
                            color: isOpen ? '#10B981' : '#EF4444',
                            fontSize: '0.75rem',
                        height: '22px',
                            border: isOpen 
                              ? '1px solid rgba(16, 185, 129, 0.25)' 
                              : '1px solid rgba(239, 68, 68, 0.25)',
                            fontWeight: 500,
                            letterSpacing: '0.005em'
                          }}
                        />
                      );
                    })()}
                                          <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0, 0, 0, 0.65)', letterSpacing: '0.005em' }}>
                        เวลาเปิด : {restaurant?.contact?.hours || '-'} น.
                    </Typography>
                      
                  </Box>
                  
                  {/* Address */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                    <LocationOn sx={{ 
                      color: '#10B981', 
                      fontSize: 16, 
                      mt: 0.1,
                      flexShrink: 0
                    }} />
                    <Typography sx={{ 
                      fontSize: '0.9rem', 
                      color: 'rgba(0, 0, 0, 0.7)',
                      lineHeight: 1.5,
                      fontWeight: 500,
                      letterSpacing: '0.005em'
                    }}>
                      {restaurant?.contact?.address || '456 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240'}
                    </Typography>
                  </Box>
                  
                  {/* Phone */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{
                      width: 16,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography sx={{ 
                        fontSize: '14px', 
                        color: '#10B981',
                        fontWeight: 600
                      }}>
                        📞
                      </Typography>
                    </Box>
                    <Typography sx={{ 
                      fontSize: '0.9rem', 
                      color: 'rgba(0, 0, 0, 0.7)',
                      fontWeight: 500,
                      letterSpacing: '0.01em'
                    }}>
                      {restaurant?.contact?.phone || '02-123-4567'}
                    </Typography>
                  </Box>
                  
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Gallery Swiper Slider - แสดงเฉพาะเมื่อมีข้อมูล */}
        {(!galleryLoaded || galleryImages.length > 0) && (
          <Box sx={{ px: 2, mb: 4 }}>
            {/* Gallery with Skeleton Loading */}
            {!galleryLoaded ? (
              <GallerySkeleton />
            ) : galleryImages.length > 0 ? (
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={16}
            slidesPerView={1.05}
            speed={800}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            loop={true}
            grabCursor={true}
            touchRatio={1}
            touchAngle={45}
            threshold={10}
            longSwipes={true}
            longSwipesRatio={0.5}
            breakpoints={{
              480: {
                slidesPerView: 1.1,
                spaceBetween: 18,
              },
              640: {
                slidesPerView: 1.2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 1.8,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 2.2,
                spaceBetween: 24,
              }
            }}
            style={{ 
              paddingBottom: '45px',
              overflow: 'visible'
            }}
          >
            {galleryImages.map((galleryItem) => (
              <SwiperSlide key={galleryItem.id}>
                <Card 
                  sx={{ 
                    borderRadius: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    aspectRatio: '16/9',
                    width: '100%',
                    height: { xs: 200, sm: 220, md: 240, lg: 260 }, // ขนาดที่เหมาะสม
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 16px 32px rgba(0, 0, 0, 0.18)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    },
                    '&:active': {
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={galleryItem.imageUrl}
                    alt={galleryItem.title || 'Gallery image'}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover', // ให้รูปภาพเต็มกรอบแต่ไม่บิดเบี้ยว
                      objectPosition: 'center',
                      display: 'block',
                      transition: 'transform 0.3s ease-out',
                      '&:hover': {
                        transform: 'scale(1.05)' // zoom เล็กน้อยเมื่อ hover
                      }
                    }}
                    loading="lazy" // lazy loading สำหรับประสิทธิภาพ
                    onError={(e) => {
                      // ซ่อนรูปภาพและแสดง minimal professional fallback
                      e.currentTarget.style.display = 'none';
                      const card = e.currentTarget.parentElement;
                      if (card) {
                        card.innerHTML = `
                          <div style="
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            padding: 24px 16px;
                            position: relative;
                            border: 1px solid #e2e8f0;
                          ">
                            <!-- Subtle pattern background -->
                            <div style="
                              position: absolute;
                              top: 0;
                              left: 0;
                              right: 0;
                              bottom: 0;
                              background: radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.03) 0%, transparent 50%);
                              pointer-events: none;
                            "></div>
                            
                            <!-- Professional icon container -->
                            <div style="
                              width: 48px;
                              height: 48px;
                              border-radius: 12px;
                              background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              margin-bottom: 12px;
                              box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
                              position: relative;
                              z-index: 1;
                            ">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: white;">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/>
                              </svg>
                            </div>
                            
                            <div style="
                              font-size: 16px;
                              font-weight: 700;
                              color: #1e293b;
                              margin-bottom: 4px;
                              letter-spacing: -0.02em;
                              line-height: 1.3;
                              position: relative;
                              z-index: 1;
                            ">${galleryItem.title || 'Gallery'}</div>
                            
                            ${galleryItem.description ? `
                              <div style="
                                font-size: 13px;
                                color: #64748b;
                                line-height: 1.4;
                                font-weight: 400;
                                position: relative;
                                z-index: 1;
                              ">${galleryItem.description.length > 40 ? galleryItem.description.substring(0, 40) + '...' : galleryItem.description}</div>
                            ` : ''}
                            
                            <!-- Subtle indicator -->
                            <div style="
                              position: absolute;
                              bottom: 8px;
                              right: 8px;
                              width: 4px;
                              height: 4px;
                              border-radius: 50%;
                              background: #6366f1;
                              opacity: 0.3;
                            "></div>
                          </div>
                        `;
                      }
                    }}
                  />
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
          ) : (
            // Minimal empty state
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              px: 3,
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e2e8f0',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle background pattern */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 30% 70%, rgba(79, 70, 229, 0.03) 0%, transparent 50%)',
                pointerEvents: 'none'
              }} />
              
              {/* Professional icon */}
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                position: 'relative',
                zIndex: 1
              }}>
                <PhotoLibrary sx={{ 
                  fontSize: 32, 
                  color: '#64748b'
                }} />
              </Box>
              
              <Typography 
                variant="body1" 
                sx={{
                  color: '#64748b',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                ยังไม่มีรูปภาพในแกลเลอรี่
              </Typography>
            </Box>
          )}
        </Box>
        )}

        {/* Premium Category Grid */}
        <Box sx={{ px: 2, mb: 3 }}>
          {categories.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1.2,
              maxWidth: '100%'
            }}
          >
            {categories.map((category) => (
              <Box
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 1.5,
                  px: 0.8,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  background: selectedCategory === category.id 
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(255, 255, 255, 0.9)',
                  border: selectedCategory === category.id 
                    ? '1.5px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                  minHeight: '40px',
                  backdropFilter: 'blur(5px)',
                  boxShadow: selectedCategory === category.id
                    ? '0 2px 8px rgba(16, 185, 129, 0.15)'
                    : '0 1px 4px rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    background: selectedCategory === category.id 
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(255, 255, 255, 1)',
                    border: selectedCategory === category.id 
                      ? '1.5px solid rgba(16, 185, 129, 0.4)' 
                      : '1px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: selectedCategory === category.id
                      ? '0 4px 12px rgba(16, 185, 129, 0.2)'
                      : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    '& .category-icon': {
                      transform: 'scale(1.1)'
                    },
                    '& .category-text': {
                      color: selectedCategory === category.id 
                        ? 'rgba(16, 185, 129, 1)' 
                        : 'rgba(0, 0, 0, 0.8)'
                    }
                  },
                  '&:active': {
                    transform: 'translateY(0px) scale(0.98)'
                  }
                }}
              >
                
                <Typography 
                  className="category-text"
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: selectedCategory === category.id ? 500 : 400,
                    color: selectedCategory === category.id 
                      ? 'rgba(16, 185, 129, 0.9)' 
                      : 'rgba(0, 0, 0, 0.75)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.005em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {category.name}
                </Typography>
                
                {/* Subtle active indicator */}
                {selectedCategory === category.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: '20%',
                      right: '20%',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.8) 50%, transparent 100%)',
                      borderRadius: '1px',
                      animation: 'slideIn 0.3s ease-out'
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'rgba(0, 0, 0, 0.6)' 
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                ยังไม่มีหมวดหมู่อาหาร
              </Typography>
              <Typography variant="body2">
                ร้านนี้ยังไม่มีเมนูอาหารในระบบ
              </Typography>
            </Box>
          )}
        </Box>

        {/* Minimal Section Title ตาม Category ที่เลือก */}
        {categories.length > 0 && (
        <Box sx={{ px: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CategoryIcon 
                  iconName={categories.find(cat => cat.id === selectedCategory)?.icon || 'TrendingUp'} 
                  selected={true}
                />
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'rgba(0, 0, 0, 0.9)',
                fontSize: '1.2rem'
              }}>
                {categories.find(cat => cat.id === selectedCategory)?.name || 'เมนูทั้งหมด'}
              </Typography>
            </Box>
            <Typography sx={{ 
              fontSize: '0.8rem', 
              color: 'rgba(0, 0, 0, 0.5)',
              fontWeight: 500
            }}>
              {searchFilteredItems.length} รายการ
            </Typography>
          </Box>
        </Box>
        )}

        {/* Menu Items Grid - แสดงเฉพาะอาหารที่ตรงกับ category */}
        <Box sx={{ px: 2 }}>
          {categories.length > 0 && searchFilteredItems.length > 0 ? (
            <Box
              key={animationKey}
              className={`menu-items-container ${isAnimating ? 'changing' : ''}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2
              }}
            >
              {searchFilteredItems.map((item, index) => (
                <Card
                  key={item.id}
                  onClick={() => router.push(`/menu/${restaurant?.id}/item/${item.id}`)}
                  sx={{
                    borderRadius: 1,
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease-out',
                    position: 'relative',
                    cursor: 'pointer',
                    animation: !isAnimating ? `fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.08}s both` : 'none',
                    willChange: 'transform, box-shadow, background',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      background: 'rgba(255, 255, 255, 0.95)'
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      transition: 'all 0.15s ease-out'
                    }
                  }}
                >
                  {/* Food Image */}
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={item.image}
                      alt={item.name}
                      sx={{ 
                        objectFit: 'cover',
                        filter: 'brightness(0.95)'
                      }}
                    />
                    
                    {/* HIT Badge */}
                    {item.isHit && (
                      <Chip
                        label="HIT"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: '#10B981',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          height: '20px',
                          minWidth: '28px',
                          border: 'none',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    )}

                    {/* Discount Badge */}
                    {item.originalPrice && (
                      <Chip
                        label={`-${Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: '#ef4444',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          height: '20px',
                          minWidth: '36px',
                          border: 'none',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    )}
                  </Box>

                  {/* Content */}
                  <CardContent sx={{ p: 2 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 0.5,
                        color: 'rgba(0, 0, 0, 0.85)',
                        fontSize: '1rem',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(0, 0, 0, 0.65)', 
                        mb: 1.5,
                        lineHeight: 1.5,
                        fontSize: '0.85rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        letterSpacing: '0.005em'
                      }}
                    >
                      {item.description}
                    </Typography>

                    {/* Price Section */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#10B981', 
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            letterSpacing: '0.01em'
                          }}
                        >
                          ฿{item.price}
                        </Typography>
                        {item.originalPrice && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(0, 0, 0, 0.45)',
                              textDecoration: 'line-through',
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              letterSpacing: '0.005em'
                            }}
                          >
                            ฿{item.originalPrice}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : categories.length > 0 ? (
            // แสดงข้อความเมื่อไม่มีรายการในหมวดหมู่นี้
            <Box 
              key={`empty-${animationKey}`}
              className={`menu-items-container ${isAnimating ? 'changing' : ''}`}
              sx={{ 
                textAlign: 'center', 
                py: 8,
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(15px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                animation: !isAnimating ? 'fadeInUp 0.4s ease-out both' : 'none'
              }}
            >
              <Box sx={{ 
                mb: 2,
                display: 'flex',
                justifyContent: 'center'
              }}>
                <CategoryIcon 
                  iconName={categories.find(cat => cat.id === selectedCategory)?.icon || 'Search'} 
                  selected={false}
                />
              </Box>
              <Typography variant="h6" sx={{ 
                color: 'rgba(0, 0, 0, 0.7)', 
                mb: 1,
                fontWeight: 600
              }}>
                ไม่มีเมนูในหมวดหมู่นี้
              </Typography>
              <Typography sx={{ 
                color: 'rgba(0, 0, 0, 0.5)', 
                fontSize: '0.9rem' 
              }}>
                ลองเลือกหมวดหมู่อื่นดูสิค่ะ
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Box>

      {/* Footer Navigation */}
      <FooterNavbar initialValue={1} />
    </Box>
  );
}