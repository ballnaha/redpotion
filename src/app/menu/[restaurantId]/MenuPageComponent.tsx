'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRestaurant } from './context/RestaurantContext';
import { useRouter } from 'next/navigation';
import { getAppConfig } from '@/lib/appConfig';
import { useSession } from 'next-auth/react';
import LineAuthDebug from '@/components/LineAuthDebug';
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
  CircularProgress,
  Button
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
  MyLocation,
  LocalOffer,
  Whatshot,
  Nature,
  Cake,
  LocalBar
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

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
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
    case 'Favorite':
      return <Favorite {...iconProps} />;
    case 'LocalOffer':
      return <LocalOffer {...iconProps} />;
    case 'Whatshot':
      return <Whatshot {...iconProps} />;
    case 'Eco':
      return <Nature {...iconProps} />;
    case 'Cake':
      return <Cake {...iconProps} />;
    case 'LocalBar':
      return <LocalBar {...iconProps} />;
    default:
      return <Category {...iconProps} />;
  }
});

export default function MenuPageComponent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { restaurant, loading, error, cart, cartTotal, addToCart, favorites, toggleFavorite, isFavorite } = useRestaurant();
  
  // States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lineUser, setLineUser] = useState<any>(null);
  const [lineSessionChecked, setLineSessionChecked] = useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [profileUpdateMessage, setProfileUpdateMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
    
    // ตรวจสอบ immediate profile update จาก URL params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isFromLiffLogin = urlParams.get('from') === 'liff-auto-login' || 
                              urlParams.get('from') === 'line-signin' ||
                              urlParams.get('from') === 'liff-restore';
      
      if (isFromLiffLogin) {
        console.log('🔄 Immediate profile check triggered from LIFF login');
        // ตั้ง flag ให้ทำ immediate session check
        setSessionCheckComplete(false);
      }
    }
  }, []);

  // ดึงข้อมูล user จาก localStorage เมื่อ client-side เท่านั้น
  useEffect(() => {
    if (!isClient) return;

    const loadUserFromStorage = () => {
      try {
        const savedUser = localStorage.getItem('line_user_data');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // ตรวจสอบว่าเป็น real LINE user หรือไม่
          const isRealLineUser = parsedUser.lineUserId && parsedUser.lineUserId !== 'demo';
          console.log('📋 Found stored user:', parsedUser.name, isRealLineUser ? '(Real LINE user)' : '(Mock user)');
          
          // Set user state ทันทีถ้าเป็น real LINE user เพื่อแสดง UI
          if (isRealLineUser) {
            console.log('🚀 Setting user from localStorage immediately for better UX');
            setLineUser(parsedUser);
            setLineSessionChecked(true);
            
            // ล้าง auth error เมื่อมี user ใน localStorage
            setAuthError(null);
          }
          
          // ยังคงต้องตรวจสอบ session อีกครั้งเสมอเพื่อความปลอดภัย
          console.log('⏳ User displayed from localStorage, will validate session...');
          
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
        setGalleryLoading(true);
        const response = await fetch(`/api/restaurant/${restaurant.id}/gallery`);
        if (response.ok) {
          const images = await response.json();
          console.log('🖼️ Gallery images loaded:', images.length);
          setGalleryImages(images || []);
        }
      } catch (error) {
        console.error('❌ Error fetching gallery images:', error);
      } finally {
        setGalleryLoading(false);
      }
    };

    fetchGalleryImages();
  }, [restaurant?.id]);

  // ตรวจสอบ LINE session - เข้มงวดขึ้น และมี production debugging
  useEffect(() => {
    if (!isClient) return;
    
    const checkLineSession = async () => {
      try {
        console.log('🔍 Checking LINE session (mandatory check)');
        const config = getAppConfig();
        
        // Production diagnostics - เฉพาะใน production
        if (config.enableDebugLogs && typeof window !== 'undefined') {
          try {
            const { collectProductionDiagnostics, generateProductionReport } = await import('@/lib/productionDebug');
            const diagnostics = await collectProductionDiagnostics();
            console.log('🔧 Production Diagnostics:', diagnostics);
            
            // แสดง detailed report ถ้าเจอปัญหา
            if (!diagnostics.networking.canReachApi || !diagnostics.session.jwtValid) {
              const report = generateProductionReport(diagnostics);
              console.warn('⚠️ Production Issues Detected:\n' + report);
            }
          } catch (debugError) {
            console.warn('⚠️ Production debug failed:', debugError);
          }
        }
        
        // ตรวจสอบว่ามาจาก LIFF หรือไม่
        const urlParams = new URLSearchParams(window.location.search);
        const isFromLiff = urlParams.get('liff') === 'true';
        const isFromLineSignin = urlParams.get('from') === 'line-signin';
        const isFromLiffRestore = urlParams.get('from') === 'liff-restore';
        const isFromLiffAutoLogin = urlParams.get('from') === 'liff-auto-login';
        const hasRedirectedFlag = urlParams.get('redirected') === 'true';
        
        // ป้องกัน redirect loop และอัพเดท profile เมื่อมาจาก LIFF
        if (isFromLineSignin || isFromLiffRestore || isFromLiffAutoLogin) {
          console.log('✅ Coming from LINE signin or LIFF restore, updating user profile...');
          
          // ตรวจสอบและอัพเดท user profile จาก session API
          try {
            const { checkLineSession: checkSession } = await import('@/lib/sessionUtils');
            const sessionResult = await checkSession();
            
            if (sessionResult.authenticated && sessionResult.user) {
              console.log('✅ Session found after LIFF login - User:', sessionResult.user.name);
              console.log('📸 Profile data:', {
                name: sessionResult.user.name,
                image: sessionResult.user.image,
                lineUserId: sessionResult.user.lineUserId
              });
              
                             // อัพเดท user state ทันที
               setLineUser(sessionResult.user);
               setLineSessionChecked(true);
               
               // ล้าง auth error เมื่อ LIFF login สำเร็จ
               setAuthError(null);
               
               // แสดงข้อความอัพเดทโปรไฟล์
              //  if (isFromLiffAutoLogin) {
              //    setProfileUpdateMessage('อัพเดทข้อมูลโปรไฟล์สำเร็จ! 📸');
              //    setTimeout(() => setProfileUpdateMessage(null), 3000);
              //  }
               
               // อัพเดท localStorage ด้วยข้อมูลใหม่
               try {
                 localStorage.setItem('line_user_data', JSON.stringify(sessionResult.user));
                 console.log('💾 Updated localStorage with fresh profile data');
               } catch (error) {
                 console.error('❌ Error saving user to localStorage:', error);
               }
                         } else {
               console.warn('⚠️ No session found after LIFF login');
             }
           } catch (error) {
             console.error('❌ Error checking session after LIFF login:', error);
           }
           
           // ล้าง URL parameters หลังจากประมวลผลเสร็จแล้ว
           if (typeof window !== 'undefined') {
             const cleanUrl = window.location.pathname;
             window.history.replaceState({}, '', cleanUrl);
             console.log('🧹 Cleaned URL parameters after profile update');
           }
           
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

        // ลองกู้คืน LIFF session ก่อน
        try {
          const { restoreLiffSession } = await import('@/lib/sessionUtils');
          const sessionRestore = await restoreLiffSession();
          
          if (sessionRestore.success && sessionRestore.sessionData) {
            console.log('✅ LIFF session restored in menu page');
            
            // ใช้ข้อมูลจาก restored session
            const userData = sessionRestore.sessionData.userProfile;
            setLineUser({
              id: userData.userId || userData.id,
              name: userData.displayName || userData.name,
              displayName: userData.displayName,
              image: userData.pictureUrl || userData.image,
              lineUserId: userData.userId || userData.lineUserId,
              email: userData.email || `line_${userData.userId}@line.user`,
              role: 'USER'
            });
            setLineSessionChecked(true);
            setSessionCheckComplete(true);
            
            // อัพเดท localStorage ด้วยข้อมูลใหม่
            try {
              localStorage.setItem('line_user_data', JSON.stringify({
                id: userData.userId || userData.id,
                name: userData.displayName || userData.name,
                displayName: userData.displayName,
                image: userData.pictureUrl || userData.image,
                lineUserId: userData.userId || userData.lineUserId,
                email: userData.email || `line_${userData.userId}@line.user`,
                role: 'USER'
              }));
              console.log('💾 Updated localStorage with restored session data');
            } catch (storageError) {
              console.error('❌ Error updating localStorage:', storageError);
            }
            
            return;
          }
        } catch (restoreError) {
          console.warn('⚠️ Failed to restore LIFF session:', restoreError);
        }

        // ใช้ session utility function
        const { checkLineSession: checkSession } = await import('@/lib/sessionUtils');
        const sessionResult = await checkSession();
        
        if (sessionResult.authenticated && sessionResult.user) {
          console.log('✅ LINE session valid - User:', sessionResult.user.name);
          
          // ตรวจสอบว่าเป็น real LINE user หรือไม่
          const isRealUser = sessionResult.user.lineUserId && sessionResult.user.lineUserId !== 'demo';
          
          if (isRealUser) {
            // อัพเดท user state
            setLineUser(sessionResult.user);
            setLineSessionChecked(true);
            setSessionCheckComplete(true);
            
            // ล้าง auth error เมื่อ session สำเร็จ
            setAuthError(null);
            
            // บันทึกข้อมูล real user ลง localStorage
            try {
              localStorage.setItem('line_user_data', JSON.stringify(sessionResult.user));
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
          
          // ลบข้อมูลเก่าใน localStorage และ reset user state
          localStorage.removeItem('line_user_data');
          setLineUser(null);
          setLineSessionChecked(false);
          
          // ป้องกัน redirect loop โดยตรวจสอบ flag
          if (hasRedirectedFlag) {
            console.log('⚠️ Already redirected once, preventing redirect loop');
            setSessionCheckComplete(true);
            return;
          }
          
          // เพิ่มการตรวจสอบจำนวนครั้งของการ redirect
          const redirectCount = parseInt(sessionStorage.getItem('menu_redirect_count') || '0');
          if (redirectCount >= 3) {
            console.log('⚠️ Too many redirects, stopping to prevent loop');
            setSessionCheckComplete(true);
            sessionStorage.removeItem('menu_redirect_count');
            return;
          }
          
          // บันทึกจำนวนครั้งของการ redirect
          sessionStorage.setItem('menu_redirect_count', (redirectCount + 1).toString());
          
          // Redirect to LINE login
          const callbackUrl = encodeURIComponent(window.location.pathname + '?redirected=true');
          console.log('🔄 Redirecting to LINE signin with callback:', callbackUrl);
          
          // ใช้ setTimeout เพื่อให้ state update เสร็จก่อน
          setTimeout(() => {
            window.location.href = `/auth/line-signin?callbackUrl=${callbackUrl}&restaurant=${restaurant?.id}`;
          }, 100);
          return;
        }
      } catch (error) {
        console.error('❌ Session check failed:', error);
        
        // ในกรณีที่ error ให้ล้าง user state และแสดง error
        setLineUser(null);
        setLineSessionChecked(false);
        localStorage.removeItem('line_user_data');
        
        // ตั้งค่า auth error สำหรับแสดงผล
        setAuthError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์การเข้าใช้งาน');
        
        console.log('⚠️ Session check error, clearing user state');
        setSessionCheckComplete(true);
      }
    };

    checkLineSession();
  }, [isClient, restaurant?.id]);

  // เพิ่ม LIFF auto-restore mechanism หลังจาก refresh
  useEffect(() => {
    if (!isClient || !lineUser || !lineSessionChecked) return;

    const restoreLiffStatus = async () => {
      try {
        // ตรวจสอบว่า LIFF SDK มีอยู่หรือไม่
        if (!window.liff) {
          console.log('🔄 LIFF SDK not available, loading...');
          
          // โหลด LIFF SDK
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          
          console.log('✅ LIFF SDK loaded after refresh');
        }

        // ตรวจสอบว่า LIFF ถูก initialize แล้วหรือไม่
        const isLiffInitialized = window.liff && typeof window.liff.init === 'function';
        
        if (isLiffInitialized) {
          try {
            // ลอง call LIFF function เพื่อดูว่า initialized หรือไม่
            const isLoggedIn = window.liff.isLoggedIn();
            console.log('✅ LIFF already initialized, login status:', isLoggedIn);
            return;
          } catch (error) {
            // ถ้า error แปลว่าไม่ได้ initialize
            console.log('⚠️ LIFF not initialized, need to initialize...');
          }
        }

        // Initialize LIFF ใหม่หลัง refresh
        const { initializeLiff } = await import('@/lib/sessionUtils');
        const initResult = await initializeLiff();
        
        if (initResult.success) {
          console.log('✅ LIFF re-initialized successfully after refresh');
          
          // ตรวจสอบสถานะ login
          if (window.liff.isLoggedIn()) {
            console.log('✅ LIFF login status restored');
          } else {
            console.log('⚠️ LIFF initialized but not logged in');
          }
        } else {
          console.warn('⚠️ Failed to re-initialize LIFF:', initResult.error);
        }

      } catch (error) {
        console.error('❌ LIFF restore failed:', error);
      }
    };

    // รอ 500ms หลัง component mount แล้วค่อย restore LIFF - เร็วขึ้น
    const timeoutId = setTimeout(restoreLiffStatus, 500);
    
    return () => clearTimeout(timeoutId);
  }, [isClient, lineUser, lineSessionChecked]);

  // เพิ่ม activity tracking เพื่อ refresh LIFF session
  useEffect(() => {
    if (!lineUser || !lineSessionChecked) return;

    const refreshSessionOnActivity = () => {
      try {
        import('@/lib/sessionUtils').then(({ refreshLiffSessionTimestamp }) => {
          refreshLiffSessionTimestamp();
        });
      } catch (error) {
        console.error('❌ Error refreshing LIFF session:', error);
      }
    };

    // เพิ่ม event listeners สำหรับ user activity
    const events = ['click', 'scroll', 'keypress', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, refreshSessionOnActivity, { passive: true });
    });

    // Refresh session ทุก 5 นาที
    const intervalId = setInterval(refreshSessionOnActivity, 5 * 60 * 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, refreshSessionOnActivity);
      });
      clearInterval(intervalId);
    };
  }, [lineUser, lineSessionChecked]);

  // เพิ่ม cleanup สำหรับ redirect counter เมื่อ component unmount
  useEffect(() => {
    return () => {
      // ล้าง redirect counter เมื่อออกจากหน้า
      sessionStorage.removeItem('menu_redirect_count');
    };
  }, []);

  // เพิ่ม listener สำหรับ session expired event
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('🔔 Session expired event received');
      localStorage.removeItem('line_user_data');
      setLineUser(null);
      setLineSessionChecked(false);
      
      // ลบ LIFF session ด้วย
      try {
        import('@/lib/sessionUtils').then(({ clearLiffSession }) => {
          clearLiffSession();
        });
      } catch (error) {
        console.error('❌ Error clearing LIFF session:', error);
      }
      
      // Redirect ไป login page
      const callbackUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth/line-signin?callbackUrl=${callbackUrl}&restaurant=${restaurant?.id}&reason=expired`;
    };

    window.addEventListener('lineSessionExpired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('lineSessionExpired', handleSessionExpired);
    };
  }, [restaurant?.id]);

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

    // Virtual categories จาก tags - แสดงก่อน regular categories
    const allItems = regularCategories.flatMap(cat => cat.items);
    const virtualCategories: MenuCategory[] = [];

    // รวบรวม tags ที่มีอยู่จริงในฐานข้อมูล
    const existingTags = new Set<string>();
    allItems.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => existingTags.add(tag));
      }
    });

    console.log('🏷️ Tags ที่พบในฐานข้อมูล:', Array.from(existingTags).sort());

    // กำหนด virtual categories เฉพาะ tags ที่มีอยู่จริง
    const tagCategoryMap: Record<string, { name: string; icon: string; excludeIfRegular: string[] }> = {
      'recommended': { 
        name: 'แนะนำ', 
        icon: 'Star',
        excludeIfRegular: ['แนะนำ', 'เมนูแนะนำ', 'แนะนำพิเศษ']
      },
      'bestseller': { 
        name: 'ขายดี', 
        icon: 'TrendingUp',
        excludeIfRegular: ['ขายดี', 'เมนูขายดี', 'ยอดนิยม']
      },
      'new': { 
        name: 'เมนูใหม่', 
        icon: 'Favorite',
        excludeIfRegular: ['เมนูใหม่', 'ใหม่', 'รายการใหม่']
      },
      'promotion': { 
        name: 'โปรโมชั่น', 
        icon: 'LocalOffer',
        excludeIfRegular: ['โปรโมชั่น', 'ส่วนลด', 'ราคาพิเศษ']
      },
      'weekly-course': { 
        name: 'คอร์สรายอาทิตย์', 
        icon: 'CalendarToday',
        excludeIfRegular: ['คอร์สรายอาทิตย์', 'รายอาทิตย์', 'สัปดาห์']
      },
      'monthly-course': { 
        name: 'คอร์สรายเดือน', 
        icon: 'DateRange',
        excludeIfRegular: ['คอร์สรายเดือน', 'รายเดือน', 'เดือน']
      },

    };

    // สร้าง virtual categories เฉพาะ tags ที่มีอยู่จริง
    const priorityOrder = ['recommended', 'bestseller', 'new', 'promotion', 'weekly-course', 'monthly-course'];
    
    priorityOrder.forEach(tag => {
      if (existingTags.has(tag) && tagCategoryMap[tag]) {
        const { name, icon, excludeIfRegular } = tagCategoryMap[tag];
        
        // ตรวจสอบว่ามี regular category ที่ซ้ำกันหรือไม่
        const hasRegularCategory = regularCategories.some(cat => 
          excludeIfRegular.some(excludeName => 
            cat.name.trim().toLowerCase() === excludeName.toLowerCase()
          )
        );
        
        // ถ้าไม่มี regular category ที่ซ้ำกัน
        if (!hasRegularCategory) {
          const itemsWithTag = allItems.filter(item => item.tags?.includes(tag));
          if (itemsWithTag.length > 0) {
            console.log(`🏷️ Creating virtual category: ${name} (${tag}) with ${itemsWithTag.length} items`);
            virtualCategories.push({
              id: `virtual-${tag}`,
              name: name,
              icon: icon,
              items: itemsWithTag
            });
          }
        }
      }
    });

    // เพิ่ม virtual categories สำหรับ tags อื่นๆ ที่ไม่อยู่ใน predefined list
    Array.from(existingTags).forEach(tag => {
      if (!priorityOrder.includes(tag)) {
        const itemsWithTag = allItems.filter(item => item.tags?.includes(tag));
        if (itemsWithTag.length > 0) {
          console.log(`🏷️ Creating virtual category for custom tag: ${tag} with ${itemsWithTag.length} items`);
          virtualCategories.push({
            id: `virtual-${tag}`,
            name: tag.charAt(0).toUpperCase() + tag.slice(1), // Capitalize first letter
            icon: 'Category',
            items: itemsWithTag
          });
        }
      }
    });

    console.log('📋 Virtual categories created:', virtualCategories.length);
    console.log('📋 Regular categories:', regularCategories.length);
    console.log('📋 Total categories:', virtualCategories.length + regularCategories.length);

    // ส่งคืน virtual categories ก่อน แล้วตามด้วย regular categories
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

  // Show authentication error first
  if (authError) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}>
        <Paper
          className="liquid-glass"
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            maxWidth: 500,
            width: '100%',
            border: '1px solid #fecaca'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ color: '#dc2626', mb: 2 }}>
              🔐
            </Typography>
            <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 600, mb: 1 }}>
              ปัญหาการเข้าสู่ระบบ
            </Typography>
            <Typography variant="body1" sx={{ color: '#991b1b', mb: 2, whiteSpace: 'pre-line' }}>
              {authError}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
              กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง
            </Typography>
          </Box>
          
          <Stack spacing={2} direction="row" justifyContent="center">
            <Button
              variant="contained"
              onClick={() => {
                const callbackUrl = encodeURIComponent(window.location.pathname);
                window.location.href = `/auth/line-signin?callbackUrl=${callbackUrl}&restaurant=${restaurant?.id}`;
              }}
              sx={{
                bgcolor: '#10B981',
                color: 'white',
                '&:hover': {
                  bgcolor: '#059669'
                }
              }}
            >
              เข้าสู่ระบบใหม่
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{
                borderColor: '#10B981',
                color: '#10B981',
                '&:hover': {
                  borderColor: '#059669',
                  color: '#059669'
                }
              }}
            >
              รีเฟรชหน้า
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Show error if there's an error
  if (error && error.includes('ไม่พบร้านอาหาร')) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}>
        <Paper
          className="liquid-glass"
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            maxWidth: 500,
            width: '100%',
            border: '1px solid #fecaca'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ color: '#dc2626', mb: 2 }}>
              ❌
            </Typography>
            <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 600, mb: 1 }}>
              เกิดข้อผิดพลาด
            </Typography>
            <Typography variant="body1" sx={{ color: '#991b1b', mb: 2, whiteSpace: 'pre-line' }}>
              {error}
            </Typography>
          </Box>
          
          <Stack spacing={2} direction="row" justifyContent="center">
            <IconButton
              onClick={() => window.location.reload()}
              sx={{
                bgcolor: '#10B981',
                color: 'white',
                '&:hover': {
                  bgcolor: '#059669'
                }
              }}
            >
              <KeyboardArrowRight />
            </IconButton>
            <Typography variant="body2" sx={{ color: '#047857', alignSelf: 'center' }}>
              คลิกเพื่อรีเฟรชหน้า
            </Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Show simple loading if not ready
  if (!restaurant || !sessionCheckComplete) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#10B981', mb: 2 }} size={32} />
          <Typography variant="body1" sx={{ color: '#065f46', fontWeight: 500 }}>
            กำลังโหลดเมนู...
          </Typography>
        </Box>
      </Box>
    );
  }

      return (
    <Box sx={{
          minHeight: '100vh',
      background: '#ffffff',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Profile Update Notification */}
      {profileUpdateMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
            fontSize: '0.9rem',
            fontWeight: 600,
            animation: 'slideInDown 0.3s ease-out',
            '@keyframes slideInDown': {
              '0%': {
                transform: 'translateX(-50%) translateY(-100%)',
                opacity: 0,
              },
              '100%': {
                transform: 'translateX(-50%) translateY(0)',
                opacity: 1,
              },
            },
          }}
        >
          {profileUpdateMessage}
        </Box>
      )}
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
              {lineUser && lineSessionChecked && (
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
              
              {/* Show login prompt if no valid session */}
              {!lineUser && sessionCheckComplete && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Avatar
                    sx={{
                      width: 40, 
                      height: 40,
                      bgcolor: '#e5e7eb',
                      color: '#6b7280'
                    }}
                  >
                    👤
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#6b7280',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        lineHeight: 1.2
                      }}
                    >
                      กรุณาเข้าสู่ระบบ
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#9ca3af',
                        fontSize: '0.75rem'
                      }}
                    >
                      เพื่อใช้งานเต็มรูปแบบ
                    </Typography>
                  </Box>
                </Box>
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
        {(galleryLoading || galleryImages.length > 0) && (
          <Box className="fade-in" sx={{ px: 0, mb: 3, mt: 2 }}>
            {/* Gallery Container */}
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
              {galleryLoading && galleryImages.length === 0 ? (
                <Skeleton 
                  variant="rectangular" 
                  height={200} 
                  sx={{ 
                    borderRadius: 0, 
                    width: '100%',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }} 
                />
              ) : galleryImages.length === 1 ? (
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
        <Box className="fade-in" sx={{ px: 1, mb: 3, mt: 2 }}>
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
                          fontWeight: 500,
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
                  fontWeight: 500,
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
                  className="liquid-glass"
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
                        objectFit: 'cover'
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
                          fontWeight: 500,
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
                          fontWeight: 500,
                          height: '20px',
                              borderRadius: 2,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                        {item.tags.includes('new') && (
                          <Chip
                            label="ใหม่"
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              height: '20px',
                              borderRadius: 2,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                        {item.tags.includes('promotion') && (
                          <Chip
                            label="โปรโมชั่น"
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              height: '20px',
                              borderRadius: 2,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                        {item.tags.includes('weekly-course') && (
                          <Chip
                            label="รายอาทิตย์"
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              height: '20px',
                              borderRadius: 2,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                        {item.tags.includes('monthly-course') && (
                          <Chip
                            label="รายเดือน"
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #8b5a87 0%, #7c5174 100%)',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 500,
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
                        color: isFavorite(item.id) ? '#dc2626' : '#6b7280'
                      }}
                      size="small"
                    >
                      {isFavorite(item.id) ? 
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
                        fontWeight: 500, 
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
            <Avatar sx={{ width: 24, height: 24, bgcolor: lineUser && lineSessionChecked ? '#10B981' : '#e5e7eb', color: lineUser && lineSessionChecked ? 'white' : '#6b7280' }}>
              {lineUser && lineSessionChecked ? (lineUser?.name?.[0] || lineUser?.displayName?.[0] || 'U') : '?'}
            </Avatar>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>โปรไฟล์</Typography>
          </IconButton>
        </Box>
      </Paper>

      {/* Debug Component - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <LineAuthDebug show={true} />
      )}
    </Box>
  );
}