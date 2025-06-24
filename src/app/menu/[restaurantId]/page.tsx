'use client';

import { useRestaurant } from './context/RestaurantContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, CardMedia, Button, Chip, 
         CircularProgress, Alert, IconButton, Drawer, List, ListItem, ListItemText,
         ListItemSecondaryAction, ButtonGroup, Avatar, InputBase, Badge, Paper,
         BottomNavigation, BottomNavigationAction } from '@mui/material';
import { ShoppingCart, Add, Remove, Delete, Favorite, FavoriteBorder,
         Search, NotificationsNone, Restaurant, LocalPizza, RamenDining, 
         LocalBar, Category, Star, Home, Person, Receipt } from '@mui/icons-material';
// Swiper imports for smooth banner carousel
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink?: string;
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
  isPopular?: boolean;
  isPromotion?: boolean;
  tags?: string[];
}

export default function CustomerMenuPage() {
  const router = useRouter();
  const { restaurant, loading, error, cart, cartTotal, addToCart, 
          removeFromCart, updateCartItemQuantity } = useRestaurant();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [bottomValue, setBottomValue] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [visibleBanners, setVisibleBanners] = useState<Set<string>>(new Set());
  const [isMenuLoading, setIsMenuLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [bannersReady, setBannersReady] = useState(false); // Block Swiper until ready
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0); // Current banner index
  const [swiperInstance, setSwiperInstance] = useState<any>(null); // Swiper instance

  // Swiper event handlers
  const handleSlideChange = (swiper: any) => {
    setCurrentBannerIndex(swiper.activeIndex);
    console.log('📱 Banner changed to:', swiper.activeIndex);
  };

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Smart preload banner images with priority loading
  useEffect(() => {
    const banners = getBanners();
    let isMounted = true;

    const preloadImage = (banner: Banner, priority: boolean = false) => {
      return new Promise<void>((resolve, reject) => {
        if (!isMounted) return resolve();
        
        // Skip if already loaded or failed
        if (preloadedImages.has(banner.image) || imageErrors.has(banner.image)) {
          return resolve();
        }

        // Set loading state
        setImageLoadingStates(prev => ({ ...prev, [banner.id]: true }));

        const img = new Image();
        
        // Advanced optimization
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.loading = priority ? 'eager' : 'lazy';
        img.fetchPriority = priority ? 'high' : 'auto';
        
        // Progressive enhancement & responsive sizing
        let optimizedSrc = banner.image;
        
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          if (connection?.effectiveType === '2g' || connection?.saveData) {
            // Low quality for slow connections
            optimizedSrc = banner.image.replace('&q=80', '&q=50').replace('w=800', 'w=400');
          } else if (connection?.effectiveType === '3g') {
            // Medium quality for 3G
            optimizedSrc = banner.image.replace('&q=80', '&q=65').replace('w=800', 'w=600');
          }
        }
        
        // Device pixel ratio optimization
        if (window.devicePixelRatio <= 1) {
          optimizedSrc = optimizedSrc.replace('w=800', 'w=400');
        }
        
        // Viewport size optimization
        const viewportWidth = window.innerWidth;
        if (viewportWidth <= 480) {
          optimizedSrc = optimizedSrc.replace('w=800', 'w=480');
        } else if (viewportWidth <= 768) {
          optimizedSrc = optimizedSrc.replace('w=800', 'w=600');
        }
        
        img.onload = () => {
          if (!isMounted) return;
          
          // Cache the image element
          setImageCache(prev => new Map(prev).set(banner.image, img));
          setPreloadedImages(prev => new Set([...prev, banner.image]));
          setImageLoadingStates(prev => ({ ...prev, [banner.id]: false }));
          console.log(`✅ Banner ${banner.id} loaded successfully`);
          resolve();
        };

        img.onerror = () => {
          if (!isMounted) return;
          
          setImageErrors(prev => new Set([...prev, banner.image]));
          setImageLoadingStates(prev => ({ ...prev, [banner.id]: false }));
          console.warn(`❌ Failed to load banner ${banner.id}`);
          reject(new Error(`Failed to load ${banner.image}`));
        };

        // Load immediately - no delays
        if (isMounted) {
          img.src = optimizedSrc;
        }
      });
    };

    const loadImages = async () => {
      const allBanners = getBanners();
      console.log('🚀 Loading first banner, then preloading others');
      
      try {
        // 1. Load FIRST image with high priority
        if (allBanners.length > 0) {
          console.log('⚡ Loading first banner:', allBanners[0].id);
          await preloadImage(allBanners[0], true);
          
          // Show banner immediately after first image loads
          setBannersReady(true);
          console.log('🎯 First banner ready! Swiper can start');
        }
        
        // 2. Background preload remaining images (non-blocking)
        if (allBanners.length > 1) {
          console.log('🔄 Background preloading remaining', allBanners.length - 1, 'banners');
          
          // Load remaining images progressively in background
          setTimeout(async () => {
            for (let i = 1; i < allBanners.length; i++) {
              if (!isMounted) break;
              
              try {
                await preloadImage(allBanners[i], false);
                console.log(`📦 Background loaded banner ${i + 1}/${allBanners.length}`);
                
                // Small delay between background loads to not block UI
                await new Promise(resolve => setTimeout(resolve, 300));
              } catch (error) {
                console.warn(`❌ Background load failed for banner ${i + 1}:`, error);
              }
            }
            console.log('🎉 All background preloading complete');
          }, 100); // Start background loading after 100ms
        }
        
      } catch (error) {
        console.error('❌ Error loading first banner:', error);
        setBannersReady(true); // Show even if first image fails
      }
    };

    loadImages();

    // Timeout fallback - don't wait forever
    const timeout = setTimeout(() => {
      if (!bannersReady) {
        console.warn('⏰ Banner loading timeout - proceeding anyway');
        setBannersReady(true);
      }
    }, 5000); // 5 second timeout

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // Intersection Observer for visibility-based loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bannerId = entry.target.getAttribute('data-banner-id');
            if (bannerId) {
              setVisibleBanners(prev => new Set([...prev, bannerId]));
            }
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    // Observe banner elements after mount
    const bannerElements = document.querySelectorAll('[data-banner-id]');
    bannerElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [mounted]);

  const handleImageLoad = (bannerId: string, imageSrc: string) => {
    setImageLoadingStates(prev => ({ ...prev, [bannerId]: false }));
    setPreloadedImages(prev => new Set([...prev, imageSrc]));
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageSrc);
      return newSet;
    });
  };

  const handleImageError = (bannerId: string, imageSrc: string) => {
    setImageLoadingStates(prev => ({ ...prev, [bannerId]: false }));
    setImageErrors(prev => new Set([...prev, imageSrc]));
  };

  const retryImageLoad = (banner: Banner) => {
    // Clear previous error state
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(banner.image);
      return newSet;
    });
    
    setImageLoadingStates(prev => ({ ...prev, [banner.id]: true }));
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    
    img.onload = () => {
      setImageCache(prev => new Map(prev).set(banner.image, img));
      setPreloadedImages(prev => new Set([...prev, banner.image]));
      setImageLoadingStates(prev => ({ ...prev, [banner.id]: false }));
    };
    
    img.onerror = () => {
      setImageErrors(prev => new Set([...prev, banner.image]));
      setImageLoadingStates(prev => ({ ...prev, [banner.id]: false }));
    };
    
    // Add cache buster and small delay
    setTimeout(() => {
      img.src = banner.image + '?retry=' + Date.now();
    }, 100);
  };

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

  // ฟังก์ชันกรองเมนูตาม search query
  const filteredMenuItems = restaurant?.menu?.flatMap(category => 
    category.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  // Menu categories with tabs
  const getMenuCategories = (): MenuCategory[] => {
    return [
      {
        id: 'popular',
        name: 'เมนูคนสั่งเยอะ',
        icon: '🔥',
        items: [
          {
            id: 'popular-1',
            name: 'ผัดไทยกุ้งสด',
            description: 'ผัดไทยแท้รสชาติต้นตำรับ เส้นหมี่เหนียวนุ่ม กุ้งสดใหญ่',
            price: 120,
            originalPrice: 150,
            image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop',
            category: 'popular',
            isPopular: true,
            tags: ['hot', 'spicy']
          },
          {
            id: 'popular-2',
            name: 'ส้มตำไทย',
            description: 'ส้มตำรสชาติแซ่บ เปรียบเปรี้ยว หอมกลิ่นกะปิ',
            price: 80,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
            category: 'popular',
            isPopular: true,
            tags: ['spicy', 'fresh']
          },
          {
            id: 'popular-3',
            name: 'แกงเขียวหวานไก่',
            description: 'แกงเขียวหวานรสชาติกลมกล่อม เผ็ดร้อนกำลังดี',
            price: 140,
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
            category: 'popular',
            isPopular: true,
            tags: ['spicy', 'hot']
          },
          {
            id: 'popular-4',
            name: 'ข้าวผัดปู',
            description: 'ข้าวผัดปูเนื้อปูแน่น หอมกลิ่นไข่เค็ม',
            price: 180,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
            category: 'popular',
            isPopular: true,
            tags: ['seafood']
          }
        ]
      },
      {
        id: 'promotion',
        name: 'โปรโมชั่น',
        icon: '🏷️',
        items: [
          {
            id: 'promo-1',
            name: 'ชุดข้าวกล่องประหยัด',
            description: 'ข้าวผัด + ไก่ทอด + น้ำดื่ม แค่ 69 บาท!',
            price: 69,
            originalPrice: 120,
            image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
            category: 'promotion',
            isPromotion: true,
            tags: ['combo', 'deal']
          },
          {
            id: 'promo-2',
            name: 'ซื้อ 2 แถม 1',
            description: 'สั่งน้ำผลไม้ปั่น 2 แก้ว แถมฟรี 1 แก้ว',
            price: 120,
            originalPrice: 180,
            image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=300&fit=crop',
            category: 'promotion',
            isPromotion: true,
            tags: ['drink', 'deal']
          }
        ]
      },
      {
        id: 'clean',
        name: 'อาหารคลีน',
        icon: '🥗',
        items: [
          {
            id: 'clean-1',
            name: 'สลัดควินัว',
            description: 'ควินัวออร์แกนิค ผักสดใหม่ ครบค่าโภชนาการ',
            price: 150,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
            category: 'clean',
            tags: ['healthy', 'organic', 'vegetarian']
          },
          {
            id: 'clean-2',
            name: 'ปลาแซลมอนย่าง',
            description: 'แซลมอนนอร์เวย์ ย่างสุก ผักสีรุ้ง ราดซอสมะนาว',
            price: 280,
            image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop',
            category: 'clean',
            tags: ['healthy', 'protein', 'omega3']
          }
        ]
      },
      {
        id: 'keto',
        name: 'อาหารคีโต',
        icon: '🥑',
        items: [
          {
            id: 'keto-1',
            name: 'อะโวคาโดเบคอนโบวล์',
            description: 'อะโวคาโดสด เบคอนกรอบ ไข่ดาว น้ำมันมะกอก',
            price: 195,
            image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop',
            category: 'keto',
            tags: ['keto', 'lowcarb', 'highfat']
          },
          {
            id: 'keto-2',
            name: 'สเต็กเนื้อเนย',
            description: 'เนื้อสเต็กชิ้นใหญ่ ผักโบร์คโคลี ราดด้วยเนยสดใส',
            price: 320,
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
            category: 'keto',
            tags: ['keto', 'protein', 'lowcarb']
          }
        ]
      },
      {
        id: 'dessert',
        name: 'ขนมหวาน',
        icon: '🍰',
        items: [
          {
            id: 'dessert-1',
            name: 'เค้กช็อกโกแลต',
            description: 'เค้กช็อกโกแลตเข้มข้น ราดด้วยซอสช็อกโกแลต',
            price: 120,
            image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
            category: 'dessert',
            tags: ['sweet', 'chocolate']
          },
          {
            id: 'dessert-2',
            name: 'มะม่วงข้าวเหนียว',
            description: 'ข้าวเหนียวหวาน มะม่วงหวานฉ่ำ หน้ากะทิเข้มข้น',
            price: 90,
            image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
            category: 'dessert',
            tags: ['thai', 'sweet', 'traditional']
          }
        ]
      }
    ];
  };

  const menuCategories = getMenuCategories();
  const activeCategory = menuCategories.find(cat => cat.id === activeTab);
  const displayItems = activeCategory?.items || [];

  // Auto-center active tab
  const handleTabClick = (categoryId: string, index: number) => {
    setIsMenuLoading(true);
    setLoadingProgress(0);
    
    // Start loading animation
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 25;
      });
    }, 50);

    setActiveTab(categoryId);
    
    // Center the active slide with better logic
    if (swiperRef && swiperRef.slideTo) {
      try {
        // Calculate slide to center
        const targetSlide = Math.max(0, index - 1);
        swiperRef.slideTo(targetSlide, 300);
      } catch (error) {
        console.warn('Swiper navigation error:', error);
      }
    }

    // Complete loading with smooth transition
    setTimeout(() => {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsMenuLoading(false);
        setLoadingProgress(0);
      }, 100);
    }, 300);
  };

  // Initialize native scroll when mounted
  useEffect(() => {
    if (mounted && !swiperRef) {
      const scrollContainer = document.querySelector('.category-scroll') as HTMLElement;
      if (scrollContainer) {
        const mockSwiper = {
          slideTo: (index: number) => {
            const button = scrollContainer.children[index] as HTMLElement;
            if (button) {
              button.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'center' 
              });
            }
          }
        };
        setSwiperRef(mockSwiper);
      }
    }
  }, [mounted, swiperRef]);

  // Auto-center on activeTab changes
  useEffect(() => {
    if (swiperRef && mounted && swiperRef.slideTo) {
      const activeIndex = menuCategories.findIndex(cat => cat.id === activeTab);
      if (activeIndex !== -1) {
        try {
          setTimeout(() => {
            if (swiperRef && swiperRef.slideTo) {
              swiperRef.slideTo(activeIndex, 300);
            }
          }, 100);
        } catch (error) {
          console.warn('Auto-center scroll error:', error);
        }
      }
    }
  }, [activeTab, mounted, menuCategories, swiperRef]);

  // Auto-slide banner every 5 seconds
  useEffect(() => {
    if (!bannersReady || getBanners().length <= 1 || !swiperInstance) return;

    const interval = setInterval(() => {
      if (swiperInstance && swiperInstance.slideNext) {
        swiperInstance.slideNext();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bannersReady, swiperInstance]);

  // Initialize banners when images are ready
  useEffect(() => {
    const banners = getBanners();
    if (banners.length > 0 && preloadedImages.size >= Math.min(banners.length, 2)) {
      setBannersReady(true);
      console.log('🎯 Banners ready for Swiper');
    }
  }, [preloadedImages]);

  // สร้าง banners สำหรับ carousel
  const getBanners = (): Banner[] => {
    return [
      {
        id: '1',
        title: 'ส่วนลดพิเศษ 30%',
        subtitle: 'สำหรับลูกค้าใหม่',
        description: 'รับส่วนลดทันทีเมื่อสั่งครั้งแรก!',
        image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=400&fit=crop&auto=format&q=80',
        buttonText: 'สั่งเลย',
        buttonLink: '#menu'
      },
      {
        id: '2', 
        title: 'ฟรีค่าส่ง',
        subtitle: 'เมื่อสั่งครบ 200 บาท',
        description: 'ไม่มีค่าส่งเพิ่มเติม ส่งถึงบ้านฟรี!',
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop&auto=format&q=80',
        buttonText: 'ดูเมนู',
        buttonLink: '#menu'
      },
      {
        id: '3',
        title: 'เมนูใหม่มาแล้ว!',
        subtitle: 'รสชาติสุดพิเศษ',
        description: 'ลิ้มลองเมนูใหม่ที่พัฒนาขึ้นพิเศษ',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=400&fit=crop&auto=format&q=80',
        buttonText: 'ชิมใหม่',
        buttonLink: '#menu'
      },
      {
        id: '4',
        title: 'แนะนำผัดไทยพิเศษ',
        subtitle: 'เส้นหมี่เหนียวนุ่ม',
        description: 'ผัดไทยสูตรต้นตำรับ หอมหวานกำลังดี',
        image: 'https://images.unsplash.com/photo-1559314809-0f31657403b2?w=800&h=400&fit=crop&auto=format&q=80',
        buttonText: 'ลองเลย',
        buttonLink: '#menu'
      },
      {
        id: '5',
        title: 'ส้มตำรสเด็ด',
        subtitle: 'สดชื่นเปรี้ยวเผ็ด',
        description: 'ส้มตำไทยแท้ ปรุงใหม่ทุกจาน',
        image: 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=800&h=400&fit=crop&auto=format&q=80',
        buttonText: 'สั่งเลย',
        buttonLink: '#menu'
      }
    ];
  };

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF'
        }}
      >
        <CircularProgress 
          size={32} 
          sx={{ 
            color: '#10B981',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round'
            }
          }} 
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 4 }}>
        <Alert severity="error" variant="filled">
          <Typography variant="h6">เกิดข้อผิดพลาด</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!restaurant) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 4 }}>
        <Alert severity="warning">ไม่พบข้อมูลร้านอาหาร</Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(249, 250, 251, 0.9) 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Fixed Header */}
      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
        }}
      >
        {/* Customer Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.125rem',
                fontWeight: 700,
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              T
            </Box>
            <Box>
              <Typography 
                sx={{ 
                  color: '#6B7280',
                  fontSize: '0.7rem',
                  mb: 0.25
                }}
              >
                จัดส่งไปที่
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography 
                  sx={{ 
                    color: '#111827',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  📍 สุขุมวิท, กรุงเทพฯ
                </Typography>
                
              </Box>
            </Box>
          </Box>
          
          <Box display="flex" gap={1}>
            <IconButton 
              onClick={() => setSearchOpen(!searchOpen)}
              sx={{ 
                color: '#111827',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                border: '1px solid rgba(16, 185, 129, 0.2)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Search sx={{ fontSize: 18 }} />
            </IconButton>
            
            {/* Cart Button */}
            <IconButton 
              onClick={() => router.push(`/cart/${restaurant?.id}`)}
              sx={{
                color: '#111827',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                border: '1px solid rgba(16, 185, 129, 0.2)',
                position: 'relative',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Badge 
                badgeContent={mounted ? cart.reduce((total, item) => total + item.quantity, 0) : 0} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#EF4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    minWidth: '18px',
                    height: '18px',
                    top: -4,
                    right: -4
                  }
                }}
              >
                <ShoppingCart sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>

            <IconButton 
              sx={{
                color: '#111827',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                border: '1px solid rgba(16, 185, 129, 0.2)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <NotificationsNone sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Search Bar - Minimal Design */}
        {searchOpen && (
          <Box
            sx={{
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Search sx={{ color: '#9CA3AF', fontSize: 18 }} />
            <InputBase
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                fontSize: '0.875rem',
                color: '#111827',
                '& input': {
                  padding: 0
                },
                '& input::placeholder': {
                  color: '#9CA3AF',
                  opacity: 1
                }
              }}
              autoFocus
            />
            <IconButton 
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              size="small"
              sx={{ 
                color: '#9CA3AF',
                width: 20,
                height: 20,
                '&:hover': {
                  color: '#6B7280',
                  background: '#F3F4F6'
                }
              }}
            >
              <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>×</Typography>
            </IconButton>
          </Box>
        )}


      </Box>
          
      {/* Scrollable Content */}
      <Box 
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          mt: searchOpen ? '100px' : '100px',
          mb: '64px',
          px: { xs: 2, sm: 3 },
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '10px'
          }
        }}
      >
        {/* Search Results */}
        {searchQuery && mounted && (
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#111827',
                fontWeight: 700,
                fontSize: '1.25rem',
                mb: 2
              }}
            >
              ผลการค้นหา "{searchQuery}" ({filteredMenuItems.length} รายการ)
            </Typography>
            
            {filteredMenuItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography 
                  sx={{ 
                    color: '#6B7280',
                    fontSize: '1rem'
                  }}
                >
                  ไม่พบเมนูที่ค้นหา
                </Typography>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2
                }}
              >
                {filteredMenuItems.map((item) => (
                  <Card
                    key={item.id}
                    onClick={() => router.push(`/menu/${restaurant?.id}/item/${item.id}`)}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      overflow: 'hidden',
                      boxShadow: 'none',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(16, 185, 129, 0.15)'
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="120"
                      image={item.image}
                      alt={item.name}
                      sx={{
                        objectFit: 'cover'
                      }}
                    />
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography 
                        sx={{ 
                          color: '#111827',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.name}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography 
                          sx={{ 
                            color: '#10B981',
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        >
                          ฿{item.price}
                        </Typography>
                        {item.originalPrice && (
                          <Typography 
                            sx={{ 
                              color: '#9CA3AF',
                              fontSize: '0.875rem',
                              textDecoration: 'line-through'
                            }}
                          >
                            ฿{item.originalPrice}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* แสดงเนื้อหาปกติเมื่อไม่มีการค้นหา */}
        {(!searchQuery || !mounted) && (
          <>
        {/* Special Offers Section */}
        <Box sx={{ mb: 4}}>

                  {/* Restaurant Info */}
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <Box
              component="img"
              src={restaurant?.logo || 'https://via.placeholder.com/40'}
              alt={restaurant?.name || 'Restaurant'}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
          <Box flex={1}>
            <Typography 
              sx={{ 
                color: '#111827',
                fontSize: '0.9rem',
                fontWeight: 700,
                mb: 0.25
              }}
            >
              {restaurant?.name || 'กำลังโหลด...'}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography 
                sx={{ 
                  color: '#6B7280',
                  fontSize: '0.875rem'
                }}
              >
                {restaurant?.contact?.address || 'กำลังโหลดที่อยู่...'}
              </Typography>
              <Box sx={{ color: '#10B981', fontSize: '0.75rem' }}>●</Box>
              <Typography 
                sx={{ 
                  color: '#10B981',
                  fontSize: '0.6rem',
                  fontWeight: 500
                }}
              >
                เปิดอยู่
              </Typography>
            </Box>
          </Box>
        </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mt={2}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#111827',
                fontWeight: 700,
                fontSize: '1.25rem'
              }}
            >
              Special Offers
            </Typography>
            <Typography 
              sx={{ 
                color: '#10B981',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              See All
            </Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            {!bannersReady ? (
              /* Silent Loading - No UI shown */
              <Box sx={{ minHeight: '160px' }} />
            ) : (
              /* Swiper Banner Carousel */
              <Box sx={{ position: 'relative' }}>
                <Swiper
                  modules={[Navigation, Pagination, Autoplay, EffectFade]}
                  spaceBetween={0}
                  slidesPerView={1}
                  loop={getBanners().length > 1}
                  autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true
                  }}
                  speed={1000}
                  effect="slide"
                  pagination={{
                    clickable: true,
                    bulletClass: 'swiper-pagination-bullet-custom',
                    bulletActiveClass: 'swiper-pagination-bullet-active-custom'
                  }}
                  onSlideChange={handleSlideChange}
                  onSwiper={setSwiperInstance}
                  style={{
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  {getBanners().map((banner, index) => (
                    <SwiperSlide key={banner.id}>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #F3F4F6',
                          borderRadius: 1,
                          overflow: 'hidden',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {/* Background Image with Smooth Loading */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '40%',
                            height: '100%',
                            overflow: 'hidden',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)',
                              zIndex: 1
                            }
                          }}
                        >
                          <Box
                            component="img"
                            src={banner.image}
                            alt={banner.title}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: preloadedImages.has(banner.image) ? 0.15 : 0,
                              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                              filter: 'brightness(1.1) contrast(1.05)'
                            }}
                            onLoad={() => handleImageLoad(banner.id, banner.image)}
                            onError={() => handleImageError(banner.id, banner.image)}
                          />
                        </Box>
                        
                        {/* Content */}
                        <Box 
                          sx={{ 
                            position: 'relative',
                            zIndex: 2,
                            p: { xs: 2.5, sm: 3 },
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography 
                            sx={{ 
                              fontSize: { xs: '1.25rem', sm: '1.5rem' },
                              fontWeight: 700,
                              mb: 0.5,
                              color: '#111827',
                              lineHeight: 1.3
                            }}
                          >
                            {banner.title}
                          </Typography>
                          <Typography 
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              fontWeight: 500,
                              mb: 1,
                              color: '#10B981'
                            }}
                          >
                            {banner.subtitle}
                          </Typography>
                          <Typography 
                            sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              fontWeight: 400,
                              mb: 2,
                              color: '#6B7280',
                              lineHeight: 1.4
                            }}
                          >
                            {banner.description}
                          </Typography>
                          
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              alignSelf: 'flex-start',
                              px: 2.5,
                              py: 0.75,
                              borderRadius: '8px',
                              background: '#10B981',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.8rem',
                              textTransform: 'none',
                              boxShadow: 'none',
                              '&:hover': {
                                background: '#059669',
                                boxShadow: 'none'
                              }
                            }}
                          >
                            {banner.buttonText}
                          </Button>
                        </Box>
                      </Box>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Box>
            )}
 
          </Box>
        </Box>

        {/* Menu Category Tabs */}
        <Box sx={{ mb: 4 }}>
 
          {/* Tab Navigation - Native Scroll */}
                     <Box 
             className="category-scroll"
             sx={{ 
               mb: 3,
               display: 'flex', 
               gap: 1, 
               px: 2,
               overflowX: 'auto',
               scrollBehavior: 'smooth'
             }}
           >
            {menuCategories.map((category, index) => (
              <Button
                key={category.id}
                onClick={() => handleTabClick(category.id, index)}
                className={`tab-button ${activeTab === category.id ? 'active' : ''}`}
                sx={{
                  minWidth: 'auto',
                  px: 2.5,
                  py: 1,
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0, // ป้องกันไม่ให้หดขนาด
                  background: activeTab === category.id 
                    ? '#10B981'
                    : 'transparent',
                  color: activeTab === category.id ? 'white' : '#6B7280',
                  border: 'none',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: activeTab === category.id
                      ? '#059669'
                      : 'rgba(16, 185, 129, 0.08)',
                    color: activeTab === category.id ? 'white' : '#10B981'
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                    transition: 'transform 0.1s ease'
                  }
                }}
              >
                <Typography sx={{ mr: 0.5, fontSize: '0.875rem' }}>
                  {category.icon}
                </Typography>
                {category.name}
              </Button>
            ))}
          </Box>

          {/* Category Content */}
          <Box 
            sx={{ 
              minHeight: '200px',
              opacity: activeCategory ? 1 : 0,
              transition: 'opacity 0.3s ease',
              transform: activeCategory ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            {activeCategory && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontSize: '1.5rem' }}>
                      {activeCategory.icon}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#111827',
                        fontWeight: 700,
                        fontSize: '1.25rem'
                      }}
                    >
                      {activeCategory.name}
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: '#6B7280',
                        fontSize: '0.875rem',
                        ml: 1
                      }}
                    >
                      ({displayItems.length} รายการ)
                    </Typography>
                  </Box>
                </Box>

                {/* Loading Progress Bar */}
                {isMenuLoading && (
                  <Box 
                    sx={{ 
                      mb: 2,
                      height: '3px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '1.5px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #10B981, #34D399, #10B981)',
                        width: `${loadingProgress}%`,
                        transition: 'width 0.1s ease-out',
                        borderRadius: '1.5px',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmerProgress 1s infinite'
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Menu Items Grid */}
                <Box 
                  sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(3, 1fr)',
                      md: 'repeat(4, 1fr)',
                      lg: 'repeat(5, 1fr)'
                    },
                    gap: { xs: 2, sm: 2.5, md: 3 },
                    opacity: isMenuLoading ? 0.3 : 1,
                    transform: isMenuLoading ? 'translateY(10px)' : 'translateY(0)',
                    transition: 'all 0.2s ease-out'
                  }}
                >
                  {isMenuLoading ? (
                    // Skeleton Loading
                    Array.from({ length: 6 }).map((_, index) => (
                      <Card
                        key={`skeleton-${index}`}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '16px',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          overflow: 'hidden',
                          boxShadow: 'none',
                          position: 'relative'
                        }}
                      >
                        <Box
                          sx={{
                            height: 120,
                            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite'
                          }}
                        />
                        <CardContent sx={{ p: 1.5 }}>
                          <Box
                            sx={{
                              height: 14,
                              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                              borderRadius: '7px',
                              mb: 1
                            }}
                          />
                          <Box
                            sx={{
                              height: 10,
                              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                              borderRadius: '5px',
                              mb: 1,
                              width: '80%'
                            }}
                          />
                          <Box
                            sx={{
                              height: 16,
                              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                              borderRadius: '8px',
                              width: '60%'
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    displayItems.map((item, index) => (
                    <Card
                      key={item.id}
                      onClick={() => router.push(`/menu/${restaurant?.id}/item/${item.id}`)}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        overflow: 'hidden',
                        boxShadow: 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        animationDelay: `${index * 50}ms`,
                        animation: isMenuLoading ? 'none' : 'fadeInStagger 0.4s ease-out forwards',
                        opacity: isMenuLoading ? 0.3 : 1,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(16, 185, 129, 0.15)'
                        }
                      }}
                    >
                      {/* Popular/Promotion Badge */}
                      {(item.isPopular || item.isPromotion) && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            background: item.isPromotion ? '#EF4444' : '#10B981',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: '6px',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            zIndex: 1
                          }}
                        >
                          {item.isPromotion ? 'PROMO' : 'HIT'}
                        </Box>
                      )}
                      
                      <CardMedia
                        component="img"
                        height="120"
                        image={item.image}
                        alt={item.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography 
                          sx={{ 
                            color: '#111827',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.name}
                        </Typography>
                        
                        <Typography 
                          sx={{ 
                            color: '#6B7280',
                            fontSize: '0.75rem',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.3
                          }}
                        >
                          {item.description}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography 
                            sx={{ 
                              color: '#10B981',
                              fontWeight: 700,
                              fontSize: '1rem'
                            }}
                          >
                            ฿{item.price}
                          </Typography>
                          {item.originalPrice && (
                            <Typography 
                              sx={{ 
                                color: '#9CA3AF',
                                fontSize: '0.875rem',
                                textDecoration: 'line-through'
                              }}
                            >
                              ฿{item.originalPrice}
                            </Typography>
                          )}
                        </Box>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {item.tags.slice(0, 2).map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10B981',
                                  fontSize: '0.625rem',
                                  height: 18,
                                  '& .MuiChip-label': {
                                    px: 0.75
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                    ))
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>




          </>
        )}
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '24px 24px 0 0'
        }} 
        elevation={0}
      >
        <BottomNavigation
          value={bottomValue}
          onChange={(event, newValue) => {
            setBottomValue(newValue);
          }}
          sx={{
            height: 64,
            background: 'transparent',
            borderRadius: '24px 24px 0 0'
          }}
        >
          <BottomNavigationAction
            label="Home"
            icon={<Home />}
            sx={{
              color: bottomValue === 0 ? '#10B981' : 'rgba(107, 114, 128, 0.8)',
              '&.Mui-selected': {
                color: '#10B981'
              }
            }}
          />
          <BottomNavigationAction
            label="Favorite"
            icon={<FavoriteBorder />}
            sx={{
              color: 'rgba(107, 114, 128, 0.8)',
              '&.Mui-selected': {
                color: '#10B981'
              }
            }}
          />
          <BottomNavigationAction
            label="Cart"
            icon={<ShoppingCart />}
            sx={{
              color: 'rgba(107, 114, 128, 0.8)',
              '&.Mui-selected': {
                color: '#10B981'
              }
            }}
          />
          <BottomNavigationAction
            label="Orders"
            icon={<Receipt />}
            sx={{
              color: 'rgba(107, 114, 128, 0.8)',
              '&.Mui-selected': {
                color: '#10B981'
              }
            }}
          />
          <BottomNavigationAction
            label="Profile"
            icon={<Person />}
            sx={{
              color: 'rgba(107, 114, 128, 0.8)',
              '&.Mui-selected': {
                color: '#10B981'
              }
            }}
          />
        </BottomNavigation>
      </Paper>

      {/* Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        PaperProps={{ 
          sx: { 
            width: { xs: '100%', sm: 400 },
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)'
          } 
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              color: '#111827',
              fontWeight: 700,
              fontSize: '1.25rem',
              letterSpacing: '-0.025em',
              mb: 3
            }}
          >
            ตะกร้าสินค้า ({cart.length} รายการ)
          </Typography>
          
          {cart.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 8,
                color: '#6B7280'
              }}
            >
              <ShoppingCart 
                sx={{ 
                  fontSize: 48, 
                  color: '#E5E7EB',
                  mb: 2
                }} 
              />
              <Typography 
                sx={{ 
                  color: '#6B7280',
                  fontSize: '1rem'
                }}
              >
              ตะกร้าของคุณยังว่างอยู่
            </Typography>
            </Box>
          ) : (
            <>
              <List sx={{ mb: 3 }}>
                {cart.map((item) => (
                  <ListItem 
                    key={item.itemId} 
                    sx={{ 
                      py: 2,
                      borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {item.image && (
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <ListItemText
                        primary={
                          <Typography 
                            sx={{ 
                              color: '#111827',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              mb: 0.5,
                              lineHeight: 1.3
                            }}
                          >
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            {item.description && (
                              <Typography 
                                component="span"
                                sx={{ 
                                  color: '#6B7280',
                                  fontSize: '0.75rem',
                                  mb: 0.5,
                                  lineHeight: 1.3,
                                  display: 'block'
                                }}
                              >
                                {item.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography 
                                component="span"
                                sx={{ 
                                  color: '#10B981',
                                  fontWeight: 600,
                                  fontSize: '0.875rem'
                                }}
                              >
                                ฿{item.price.toLocaleString()} x {item.quantity}
                              </Typography>
                              <Typography 
                                component="span"
                                sx={{ 
                                  color: '#10B981',
                                  fontWeight: 700,
                                  fontSize: '0.875rem'
                                }}
                              >
                                = ฿{(item.price * item.quantity).toLocaleString()}
                              </Typography>
                              {item.category === 'add-ons' && (
                                <Chip 
                                  label="เสริม"
                                  size="small"
                                  sx={{ 
                                    backgroundColor: '#FEF3C7',
                                    color: '#D97706',
                                    fontSize: '0.625rem',
                                    height: 20
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </Box>
                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box 
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            p: 0.5
                          }}
                        >
                          <IconButton
                            onClick={() => updateCartItemQuantity(item.itemId, item.quantity - 1)}
                            size="small"
                            sx={{ 
                              color: '#6B7280',
                              '&:hover': {
                                color: '#111827',
                                background: 'rgba(16, 185, 129, 0.1)'
                              }
                            }}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography 
                            sx={{ 
                              color: '#111827',
                              fontWeight: 600,
                              minWidth: '24px',
                              textAlign: 'center'
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            onClick={() => updateCartItemQuantity(item.itemId, item.quantity + 1)}
                            size="small"
                            sx={{ 
                              color: '#6B7280',
                              '&:hover': {
                                color: '#111827',
                                background: 'rgba(16, 185, 129, 0.1)'
                              }
                            }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                        <IconButton
                          onClick={() => removeFromCart(item.itemId)}
                          size="small"
                          sx={{ 
                            color: '#ef4444',
                            '&:hover': {
                              background: 'rgba(239, 68, 68, 0.1)'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 3, 
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#111827',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    textAlign: 'center',
                    mb: 1
                  }}
                >
                  ยอดรวม: ฿{cartTotal.toLocaleString()}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ 
                    mt: 2,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)'
                    }
                  }}
                >
                  สั่งอาหาร
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>


    </Box>
  );
} 