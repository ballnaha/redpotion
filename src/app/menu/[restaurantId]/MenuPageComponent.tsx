'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRestaurant } from './context/RestaurantContext';
import { useRouter } from 'next/navigation';
import { getAppConfig } from '@/lib/appConfig';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  IconButton,
  Badge,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Fab,
  Container,
  Stack,
  Paper,
  Skeleton,
  CircularProgress
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  FavoriteBorder,
  Favorite,
  Star,
  TrendingUp,
  LocalDining,
  Category,
  FilterList,
  KeyboardArrowRight,
  Add,
  Close,
  AccessTime,
  LocationOn,
  Phone,
  Notifications,
  MyLocation
} from '@mui/icons-material';

// Global styles สำหรับ liquid glass effect
const globalStyles = `
  /* Liquid Glass Effects */
  .liquid-glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 8px 32px rgba(31, 38, 135, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .liquid-glass-dark {
    background: rgba(0, 0, 0, 0.03);
    backdrop-filter: blur(20px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Smooth animations */
  .fade-in {
    animation: fadeInUp 0.6s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }


  
  .scale-on-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scale-on-hover:hover {
    transform: translateY(-4px) scale(1.02);
  }

  /* Custom scrollbar */
  .custom-scroll::-webkit-scrollbar {
    width: 4px;
  }

  .custom-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  
  .custom-scroll::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.3);
    border-radius: 10px;
  }

  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(16, 185, 129, 0.5);
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('liquid-glass-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'liquid-glass-styles';
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
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

interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  items: MenuItem[];
}

// Loading Skeleton Component
function MenuSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {/* Header Skeleton */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={60} height={60} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem', width: '60%' }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem', width: '40%' }} />
        </Box>
            </Box>
            
      {/* Search Skeleton */}
      <Skeleton variant="rounded" height={56} sx={{ mb: 3, borderRadius: 2 }} />

      {/* Categories Skeleton */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'hidden' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} variant="rounded" width={100} height={40} sx={{ borderRadius: 3, flexShrink: 0 }} />
                ))}
              </Box>

      {/* Menu Items Skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Skeleton variant="rectangular" height={120} />
            <Box sx={{ p: 1.5 }}>
              <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
              <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '80%' }} />
              <Skeleton variant="text" sx={{ fontSize: '1.2rem', width: '40%', mt: 1 }} />
          </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

// Category Icon Component
const CategoryIcon = React.memo(function CategoryIcon({ 
  iconName, 
  selected, 
  size = '20px' 
}: { 
  iconName: string; 
  selected: boolean; 
  size?: string; 
}) {
  const iconProps = {
    sx: { 
      fontSize: size,
      color: selected ? '#ffffff' : '#10B981',
      transition: 'all 0.3s ease'
    }
  };

  switch (iconName) {
    case 'Star':
      return <Star {...iconProps} />;
    case 'TrendingUp':
      return <TrendingUp {...iconProps} />;
    case 'LocalDining':
      return <LocalDining {...iconProps} />;
    default:
      return <Category {...iconProps} />;
  }
});

export default function MenuPageComponent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { restaurant, loading, error, cart, cartTotal, addToCart } = useRestaurant();
  
  // States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lineUser, setLineUser] = useState<any>(null);
  const [lineSessionChecked, setLineSessionChecked] = useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ดึงข้อมูล user จาก localStorage เมื่อ client-side เท่านั้น
  useEffect(() => {
    if (!isClient) return;

    const loadUserFromStorage = () => {
      try {
        const savedUser = localStorage.getItem('line_user_data');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // ตรวจสอบว่าเป็น real LINE user หรือ mock user
          const isRealLineUser = parsedUser.lineUserId && parsedUser.lineUserId !== 'demo';
          console.log('📋 Found stored user:', parsedUser.name, isRealLineUser ? '(Real LINE user)' : '(Mock user)');
          
          // ใช้ข้อมูลจาก localStorage เป็นการชั่วคราวเท่านั้น
          if (isRealLineUser) {
            setLineUser(parsedUser);
            setLineSessionChecked(true);
          }
          
          // แต่ยังคงต้องตรวจสอบ session อีกครั้งเสมอ
          return { user: parsedUser, isReal: isRealLineUser };
        }
      } catch (error) {
        console.error('❌ Error loading user data from localStorage:', error);
        // ลบข้อมูลที่เสียหายออกจาก localStorage
        localStorage.removeItem('line_user_data');
      }
      return { user: null, isReal: false };
    };

    // เรียกใช้ฟังก์ชันเมื่อ client-side hydration เสร็จแล้ว
    const storageResult = loadUserFromStorage();
    
    // ตรวจสอบ session เสมอ ไม่ว่าจะมีข้อมูลใน localStorage หรือไม่
    setSessionCheckComplete(false);
  }, [isClient]);

  // Mock user for development - ปิดใช้งานแล้ว
  useEffect(() => {
    if (!isClient) return;
    
    const config = getAppConfig();
    
    // ตรวจสอบว่ามี real LINE user อยู่แล้วหรือไม่
    const hasRealLineUser = lineUser && lineUser.lineUserId && lineUser.lineUserId !== 'demo';
    
    // ปิดใช้งาน mock user โดยสิ้นเชิง
    if (config.enableMockUser && !hasRealLineUser && !lineUser) {
      console.log('⚠️ Mock user is disabled to prevent override issues');
      // ไม่สร้าง mock user อีกต่อไป
    }
  }, [isClient, lineUser]);

  // Fetch gallery images
  useEffect(() => {
    if (!restaurant?.id) return;
    
    const fetchGalleryImages = async () => {
      try {
        const response = await fetch(`/api/restaurant/${restaurant.id}/gallery`);
        if (response.ok) {
          const images = await response.json();
          console.log('🖼️ Gallery images loaded:', images.length);
          setGalleryImages(images || []);
        }
      } catch (error) {
        console.error('❌ Error fetching gallery images:', error);
      }
    };

    fetchGalleryImages();
  }, [restaurant?.id]);

  // ตรวจสอบ LINE session - เข้มงวดขึ้น
  useEffect(() => {
    if (!isClient) return;
    
    const checkLineSession = async () => {
      try {
        console.log('🔍 Checking LINE session (mandatory check)');
        const config = getAppConfig();
        
        // ตรวจสอบว่ามาจาก LIFF หรือไม่
        const urlParams = new URLSearchParams(window.location.search);
        const isFromLiff = urlParams.get('liff') === 'true';
        const isFromLineSignin = urlParams.get('from') === 'line-signin';
        
        // ป้องกัน redirect loop โดยตรวจสอบว่ามาจาก line-signin หรือไม่
        if (isFromLineSignin) {
          console.log('✅ Coming from LINE signin, skipping authentication check');
          setSessionCheckComplete(true);
          return;
        }
        
        // ถ้าปิดการบังคับ LINE login หรือมีการตั้งค่า skip authentication
        if (!config.requireLineLogin || config.skipAuthenticationCheck || isFromLiff) {
          console.log('🔓 Menu: LINE login check skipped', {
            requireLineLogin: config.requireLineLogin,
            skipAuthenticationCheck: config.skipAuthenticationCheck,
            isFromLiff
          });
          setSessionCheckComplete(true);
          return;
        }

        // เรียก API เพื่อตรวจสอบ session
        const response = await fetch('/api/auth/line-session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache' // บังคับไม่ใช้ cache
        });
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          console.log('✅ LINE session valid - User:', data.user.name || data.user.displayName);
          
          // ตรวจสอบว่าเป็น real LINE user หรือไม่
          const isRealUser = data.user.lineUserId && data.user.lineUserId !== 'demo';
          
          if (isRealUser) {
            // อัพเดท user state
            setLineUser(data.user);
            setLineSessionChecked(true);
            setSessionCheckComplete(true);
            
            // บันทึกข้อมูล real user ลง localStorage
            try {
              localStorage.setItem('line_user_data', JSON.stringify(data.user));
              console.log('💾 Updated localStorage with real LINE user');
            } catch (error) {
              console.error('❌ Error saving user to localStorage:', error);
            }
          } else {
            console.log('⚠️ Session user is not real LINE user');
            setSessionCheckComplete(true);
          }
        } else {
          console.log('❌ No valid LINE session found');
          
          // ลบข้อมูลเก่าใน localStorage
          localStorage.removeItem('line_user_data');
          
          // เพิ่มการป้องกัน redirect loop
          const currentUrl = window.location.href;
          if (currentUrl.includes('redirected=true')) {
            console.log('⚠️ Already redirected once, preventing redirect loop');
            setSessionCheckComplete(true);
            return;
          }
          
          // Redirect to LINE login
          const callbackUrl = encodeURIComponent(window.location.pathname + '?redirected=true');
          window.location.href = `/auth/line-signin?callbackUrl=${callbackUrl}`;
          return;
        }
      } catch (error) {
        console.error('❌ Menu: Session check failed:', error);
        setSessionCheckComplete(true);
      }
    };

    // ตรวจสอบ session เสมอเมื่อมีข้อมูลร้านอาหารและยังไม่ได้ตรวจสอบ
    if (restaurant && !sessionCheckComplete) {
      checkLineSession();
    }
  }, [restaurant, sessionCheckComplete, isClient]);

  // Categories with virtual categories
  const categories: MenuCategory[] = useMemo(() => {
    if (!restaurant?.menu) return [];

    // กรอง regular category ที่ id ไม่ขึ้นต้นด้วย 'virtual-' และไม่ใช่ชื่อ 'ขายดี'
    const regularCategories = restaurant.menu
      .map(category => ({
        id: category.id,
        name: category.name,
        icon: 'LocalDining',
        imageUrl: (category as any).imageUrl,
        items: (category.items || []).map(item => ({
          ...item,
          category: category.id
        }))
      }))
      .filter(category => category.items.length > 0 && !category.id.startsWith('virtual-') && category.name.trim() !== 'ขายดี');

    // Virtual categories
    const allItems = regularCategories.flatMap(cat => cat.items);
    const virtualCategories: MenuCategory[] = [];

    // Only add virtual-recommended if no regular category with name 'แนะนำ' or 'เมนูแนะนำ'
    const hasRegularRecommended = regularCategories.some(cat => cat.name.trim() === 'แนะนำ' || cat.name.trim() === 'เมนูแนะนำ');
    if (!hasRegularRecommended && allItems.some(item => item.tags?.includes('recommended'))) {
      virtualCategories.push({
        id: 'virtual-recommended',
        name: 'แนะนำ',
        icon: 'Star',
        items: allItems.filter(item => item.tags?.includes('recommended'))
      });
    }

    // Only add virtual-bestseller (ขายดี) ifไม่มี regular category ชื่อ 'ขายดี'
    if (allItems.some(item => item.tags?.includes('bestseller'))) {
      virtualCategories.push({
        id: 'virtual-bestseller',
        name: 'ขายดี',
        icon: 'TrendingUp',
        items: allItems.filter(item => item.tags?.includes('bestseller'))
      });
    }

    return [...virtualCategories, ...regularCategories];
  }, [restaurant?.menu]);

  // Menu items
  const menuItems: MenuItem[] = useMemo(() => {
    return Array.from(
      new Map(
        categories.flatMap(category => category.items || [])
          .map(item => [item.id, item])
      ).values()
    );
  }, [categories]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = selectedCategory === 'all' 
      ? menuItems 
      : selectedCategory.startsWith('virtual-')
        ? categories.find(cat => cat.id === selectedCategory)?.items || []
        : menuItems.filter(item => item.category === selectedCategory);

    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [selectedCategory, menuItems, categories, searchQuery]);

  // Handlers
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const getCartItemQuantity = useCallback((itemId: string) => {
    const cartItem = cart.find(item => item.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  }, [cart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Professional Gallery Swiper Logic
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePrevImage = useCallback(() => {
    if (galleryImages.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentGalleryIndex(prev => 
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
    setTimeout(() => setIsTransitioning(false), 400); // Match transition duration
  }, [galleryImages.length, isTransitioning]);

  const handleNextImage = useCallback(() => {
    if (galleryImages.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentGalleryIndex(prev => 
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
    setTimeout(() => setIsTransitioning(false), 400); // Match transition duration
  }, [galleryImages.length, isTransitioning]);

  const handleDirectImageChange = useCallback((newIndex: number) => {
    if (newIndex === currentGalleryIndex || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentGalleryIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [currentGalleryIndex, isTransitioning]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || isTransitioning) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = touchStart.y - touch.clientY;
    
    // Enhanced swipe detection with better sensitivity
    const minSwipeDistance = 30;
    const maxVerticalDeviation = 100;
    
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDeviation) {
      e.preventDefault(); // Prevent default scrolling
      if (deltaX > 0) {
        handleNextImage(); // Swipe left = next image
      } else {
        handlePrevImage(); // Swipe right = previous image
      }
    }
    
    setTouchStart(null);
  }, [touchStart, isTransitioning, handleNextImage, handlePrevImage]);

  // Show loading if not ready
  if (!restaurant || !sessionCheckComplete) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #f0f9ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Paper
          className="liquid-glass"
          sx={{
            p: 4,
            borderRadius: 1,
            textAlign: 'center',
            maxWidth: 400,
            width: '90%'
          }}
        >
          <CircularProgress sx={{ color: '#10B981', mb: 2 }} size={40} />
          <Typography variant="h6" sx={{ color: '#065f46', fontWeight: 600 }}>
            กำลังโหลด...
          </Typography>
          <Typography variant="body2" sx={{ color: '#047857', mt: 1 }}>
            กรุณารอสักครู่
          </Typography>
        </Paper>
      </Box>
    );
  }

      return (
    <Box sx={{
          minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #f0f9ff 100%)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Header - Fixed */}
      <Paper
        className="liquid-glass"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 100,
          borderRadius: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          p: 2,
          boxShadow: '0 2px 12px rgba(16,185,129,0.08)'
        }}
      >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
            {/* User Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {lineUser && (
                <>
                      <Avatar
                    src={lineUser.image || lineUser.pictureUrl || '/images/default_restaurant.jpg'}
                        sx={{
                      width: 40, 
                      height: 40,
                      border: '2px solid #10B981'
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                      variant="h6" 
                sx={{ 
                        color: '#065f46',
                        fontWeight: 700,
                        fontSize: '1rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {lineUser.name || lineUser.displayName || 'ผู้ใช้งาน'}
                </Typography>
                    
                    {/* Current Location */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <MyLocation sx={{ color: '#10B981', fontSize: '0.8rem' }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#047857',
                          fontSize: '0.75rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.2
                        }}
                      >
                        คลองตัน, วัฒนา, กรุงเทพมหานคร
                      </Typography>
                    </Box>
              </Box>
                </>
              )}
          </Box>
          
            {/* Header Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Notification Button */}
              <IconButton 
                onClick={() => router.push('/notifications')}
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#065f46',
                  '&:hover': {
                    background: 'rgba(16, 185, 129, 0.1)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Badge 
                  badgeContent={3} 
                  sx={{
                    '& .MuiBadge-badge': {
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '0.75rem',
                      minWidth: '18px',
                      height: '18px'
                    }
                  }}
                >
                  <Notifications sx={{ fontSize: '20px' }} />
                </Badge>
              </IconButton>

              {/* Shopping Cart Button */}
              <IconButton 
                onClick={() => router.push(`/cart/${restaurant?.id}`)}
                sx={{ 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Badge 
                  badgeContent={cart.reduce((total, item) => total + item.quantity, 0)} 
                  sx={{
                    '& .MuiBadge-badge': {
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '0.75rem',
                      minWidth: '18px',
                      height: '18px'
                    }
                  }}
                >
                  <ShoppingCart sx={{ fontSize: '20px' }} />
                </Badge>
              </IconButton>
            </Box>

          </Box>
      </Paper>

      {/* Body Content - Scrollable */}
      <Box sx={{
          flex: 1,
          overflowY: 'auto',
        pt: { xs: '68px', md: '68px' }, // header height
        pb: { xs: '76px', md: '76px' }, // footer height (increased for new layout)
        minHeight: 0
      }}>
        <Box sx={{ pb: 4 }}>
          {/* Restaurant Banner */}
          <Box className="fade-in" sx={{ mb: 3 }}>
          <Card 
              className="liquid-glass" 
            sx={{ 
                borderRadius: 0, 
              overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
          >
              {/* Banner Image */}
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  width: '100%',
                  height: '150px', // Fixed height instead of paddingTop trick
                  backgroundImage: `url(${restaurant?.imageUrl || '/images/default_restaurant1.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  filter: 'brightness(0.85)',
                  transition: 'filter 0.3s ease'
                }}
                onLoad={() => {
                  console.log('🖼️ Banner image loaded:', restaurant?.imageUrl || '/images/default_restaurant1.jpg');
                }}
                onError={() => {
                  console.log('❌ Banner image failed to load:', restaurant?.imageUrl || '/images/default_restaurant1.jpg');
                  console.log('🔍 Restaurant data:', restaurant);
                }}
              />
                
                {/* Overlay with Restaurant Logo and Info */}
                <Box sx={{ 
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
                  p: 2,
                  pt: 4,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 2
                }}>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                      {restaurant?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                      {/* Opening Hours */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime sx={{ color: '#10B981', fontSize: '0.9rem' }} />
                        <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
                          {restaurant?.contact?.hours || 'เปิดบริการ 09:00 - 22:00 น.'}
                  </Typography>
                </Box>

                      {/* Address */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn sx={{ color: '#10B981', fontSize: '0.9rem' }} />
                        <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
                          {restaurant?.contact?.address || 'ไม่ระบุที่อยู่'}
                    </Typography>
                  </Box>

                      {/* Phone */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ color: '#10B981', fontSize: '0.9rem' }} />
                        <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
                          {restaurant?.contact?.phone || 'ไม่ระบุเบอร์โทร'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>
          </Box>

          {/* Search Bar */}
          <Box className="fade-in" sx={{ px: 1, pt: 0 }}>
            <TextField
              fullWidth
              placeholder="ค้นหาอาหาร เครื่องดื่ม ของหวาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#10B981' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <Close sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                  borderRadius: 1,
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  '&:hover': {
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  },
                  '&.Mui-focused': {
                    border: '2px solid #10B981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  }
                    }
                  }}
                />
        </Box>

        {/* Professional Gallery Section */}
        {galleryImages.length > 0 && (
          <Box className="fade-in" sx={{ px: 0, mb: 3, mt: 2 }}>
            {/* Gallery Container */}
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
              {galleryImages.length === 1 ? (
                // Single Image - Professional Display
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: 0,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.008)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.16)'
                    }
                  }}
                  onClick={() => {
                    console.log('🖼️ Gallery clicked:', galleryImages[0]);
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${galleryImages[0]?.imageUrl || '/images/default_restaurant.jpg'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      transition: 'transform 0.6s ease-out',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                </Box>
              ) : (
                // Professional Multi-Image Swiper
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    overflow: 'hidden',
                    borderRadius: 0,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.02) 85%, rgba(0,0,0,0.08) 100%)',
                      zIndex: 1,
                      pointerEvents: 'none'
                    }
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Full Image Container */}
                  <Box
                    sx={{
                      display: 'flex',
                      transition: isTransitioning 
                        ? 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
                        : 'none',
                      transform: `translateX(-${currentGalleryIndex * 100}%)`,
                      gap: 0,
                      height: '100%',
                      willChange: 'transform'
                    }}
                  >
                    {galleryImages.map((image, index) => {
                      const isActive = index === currentGalleryIndex;
                      
                      return (
                        <Box
                          key={image.id}
                          onClick={() => {
                            if (isActive) {
                              console.log('🖼️ Gallery clicked:', image);
                            } else {
                              handleDirectImageChange(index);
                            }
                          }}
                          sx={{
                            flexShrink: 0,
                            width: '100%',
                            height: '100%',
                            borderRadius: 0,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                            '&:hover': {
                              transform: 'scale(1.002)'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: `url(${image.imageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              transition: 'transform 0.6s ease-out',
                              '&:hover': {
                                transform: 'scale(1.02)'
                              }
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                  
                  {/* White Navigation Indicators - Inside Gallery */}
                  {galleryImages.length > 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 5,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 1,
                        zIndex: 3,
                        background: 'rgba(0, 0, 0, 0.2)',
                        //backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        px: 2,
                        py: 1
                      }}
                    >
                      {galleryImages.map((_, index) => {
                        const isActive = index === currentGalleryIndex;
                        return (
                          <Box
                            key={index}
                            onClick={() => handleDirectImageChange(index)}
                            sx={{
                              width: isActive ? 24 : 8,
                              height: 8,
                              borderRadius: 4,
                              background: isActive 
                                ? 'rgba(255, 255, 255, 1)'
                                : 'rgba(255, 255, 255, 0.5)',
                              cursor: 'pointer',
                              transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.8)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Categories */}
        <Box className="fade-in" sx={{ px: 1, mb: 3 }}>
      <Box 
            className="custom-scroll"
                  sx={{ 
                  display: 'flex',
                  gap: 1,
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { display: 'none' }
                }}
              >
            {/* All Category */}
                      <Chip 
              label="ทั้งหมด"
              onClick={() => handleCategoryChange('all')}
              variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                    sx={{
                flexShrink: 0,
                borderRadius: 3,
                px: 2,
                height: 40,
                background: selectedCategory === 'all' 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.7)',
                color: selectedCategory === 'all' ? 'white' : '#065f46',
                border: selectedCategory === 'all' 
                  ? 'none' 
                  : '1px solid rgba(16, 185, 129, 0.3)',
                          fontWeight: 600,
                      '&:hover': {
                  transform: 'scale(1.05)',
                  background: selectedCategory === 'all'
                    ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    : 'rgba(16, 185, 129, 0.1)'
                      }
                    }}
                  />

            {/* Category Chips */}
              {categories.map((category) => (
              <Chip
                  key={category.id}
                label={category.name}
                onClick={() => handleCategoryChange(category.id)}
                variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                icon={<CategoryIcon iconName={category.icon} selected={selectedCategory === category.id} size="18px" />}
                sx={{
                  flexShrink: 0,
                  borderRadius: 3,
                  px: 2,
                  height: 40,
                  background: selectedCategory === category.id 
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.7)',
                  color: selectedCategory === category.id ? 'white' : '#065f46',
                  border: selectedCategory === category.id 
                    ? 'none' 
                    : '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    background: selectedCategory === category.id
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'rgba(16, 185, 129, 0.1)'
                  }
                }}
              />
            ))}
            </Box>
        </Box>

        {/* Menu Items Grid */}
        <Box className="fade-in" sx={{ px: 1 }}>
          {filteredItems.length > 0 ? (
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2
            }}>
              {filteredItems.map((item, index) => (
                <Card
                  key={item.id}
                  className="scale-on-hover liquid-glass"
                  onClick={() => router.push(`/menu/${restaurant.id}/item/${item.id}`)}
                  sx={{
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    animationDelay: `${index * 0.1}s`
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
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    
                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <Box sx={{ 
                          position: 'absolute',
                          top: 8,
                          left: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5
                      }}>
                        {item.tags.includes('recommended') && (
                          <Chip
                            label="แนะนำ"
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          height: '20px',
                              borderRadius: 2,
                              '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    )}
                        {item.tags.includes('bestseller') && (
                      <Chip
                            label="ขายดี"
                        size="small"
                        sx={{
                              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          height: '20px',
                              borderRadius: 2,
                              '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    )}
                  </Box>
                    )}

                    {/* Favorite Button */}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        color: favorites.includes(item.id) ? '#dc2626' : '#6b7280',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 1)',
                          transform: 'scale(1.1)'
                        }
                      }}
                      size="small"
                    >
                      {favorites.includes(item.id) ? 
                        <Favorite sx={{ fontSize: '18px' }} /> : 
                        <FavoriteBorder sx={{ fontSize: '18px' }} />
                      }
                    </IconButton>
                  </Box>

                  {/* Item Info */}
                  <Box sx={{ p: 1.5 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#065f46',
                        lineHeight: 1.2,
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#047857',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.3,
                        height: '2.6em'
                      }}
                    >
                      {item.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#10B981', 
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        >
                          {formatPrice(item.price)}
                        </Typography>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6b7280',
                              textDecoration: 'line-through'
                            }}
                          >
                            {formatPrice(item.originalPrice)}
                          </Typography>
                        )}
                      </Box>


                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          ) : (
            <Paper
              className="liquid-glass"
              sx={{ 
                p: 4,
                textAlign: 'center', 
                borderRadius: 1
              }}
            >
              <Typography variant="h6" sx={{ color: '#065f46', mb: 1 }}>
                ไม่พบรายการอาหาร
              </Typography>
              <Typography variant="body2" sx={{ color: '#047857' }}>
                ลองเปลี่ยนหมวดหมู่หรือคำค้นหาใหม่
              </Typography>
            </Paper>
          )}
            </Box>
        </Box>


      </Box>

      {/* Footer - Fixed */}
      <Paper
        className="liquid-glass"
        sx={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: '100%',
          zIndex: 100,
          borderRadius: 0,
          p: 0,
          boxShadow: '0 -2px 12px rgba(16,185,129,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 56
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60, width: '100%', px: 2 }}>
          <IconButton 
            color="primary" 
            sx={{ 
              flex: 1, 
              color: '#10B981', 
              flexDirection: 'column',
              gap: 0.5,
              py: 1,
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <Category sx={{ fontSize: 24 }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>เมนู</Typography>
          </IconButton>
          <IconButton 
            sx={{ 
              flex: 1, 
              color: '#64748b',
              flexDirection: 'column',
              gap: 0.5,
              py: 1,
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }} 
            onClick={() => router.push('/orders')}
          >
            <FavoriteBorder sx={{ fontSize: 24 }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>ออเดอร์</Typography>
          </IconButton>
          <IconButton 
            sx={{ 
              flex: 1, 
              color: '#64748b',
              flexDirection: 'column',
              gap: 0.5,
              py: 1,
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }} 
            onClick={() => router.push('/chats')}
          >
            <FavoriteBorder sx={{ fontSize: 24 }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>แชท</Typography>
          </IconButton>
          <IconButton 
            sx={{ 
              flex: 1, 
              color: '#64748b',
              flexDirection: 'column',
              gap: 0.5,
              py: 1,
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }} 
            onClick={() => router.push('/notification')}
          >
            <Badge color="error" variant="dot" overlap="circular">
              <FilterList sx={{ fontSize: 24 }} />
            </Badge>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>แจ้งเตือน</Typography>
          </IconButton>
          <IconButton 
            sx={{ 
              flex: 1, 
              color: '#64748b',
              flexDirection: 'column',
              gap: 0.5,
              py: 1,
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }} 
            onClick={() => router.push('/profile')}
          >
            <Avatar sx={{ width: 24, height: 24, bgcolor: '#10B981' }}>
              {lineUser?.name?.[0] || lineUser?.displayName?.[0] || 'U'}
            </Avatar>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>โปรไฟล์</Typography>
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}