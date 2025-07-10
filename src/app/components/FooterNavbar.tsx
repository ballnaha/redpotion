'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNavigation, BottomNavigationAction, Button, Box, Typography, CircularProgress } from '@mui/material';
import { Home, Receipt, Person } from '@mui/icons-material';
import { getDefaultRestaurant } from '@/lib/defaultRestaurant';

interface CartData {
  items: any[];
  total: number;
  loading: boolean;
  hasValidAddress: boolean;
  onCheckout: () => void;
}

interface FooterNavbarProps {
  restaurantId?: string; // สำหรับหน้าที่เกี่ยวข้องกับร้านอาหาร
  isCartPage?: boolean; // โหมดตะกร้าสินค้า
  cartData?: CartData; // ข้อมูลตะกร้าสินค้า
}

export default function FooterNavbar({ restaurantId, isCartPage = false, cartData }: FooterNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(0);
  const [defaultRestaurantId, setDefaultRestaurantId] = useState<string | null>(null);

  // โหลด default restaurant ID
  useEffect(() => {
    const loadDefaultRestaurant = async () => {
      try {
        const defaultRestaurant = await getDefaultRestaurant();
        if (defaultRestaurant) {
          setDefaultRestaurantId(defaultRestaurant.restaurantId);
        }
      } catch (error) {
        console.error('Error loading default restaurant:', error);
      }
    };

    if (!restaurantId) {
      loadDefaultRestaurant();
    }
  }, [restaurantId]);

  // รับ restaurantId ที่จะใช้ (จาก props หรือ default)
  const currentRestaurantId = restaurantId || defaultRestaurantId;

  // อัพเดท active tab ตาม pathname
  useEffect(() => {
    if (pathname.includes('/menu/')) {
      setValue(0);
    } else if (pathname === '/orders') {
      setValue(1);
    } else if (pathname === '/profile') {
      setValue(2);
    }
  }, [pathname]);

  const handleNavigation = (newValue: number, path: string) => {
    setValue(newValue);
    router.push(path);
  };

  // ถ้าเป็นหน้า Cart แสดงปุ่ม Checkout
  if (isCartPage && cartData) {
    return (
      <Box 
        sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: '20px 20px 0 0',
          p: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
            ยอดรวมทั้งหมด
          </Typography>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>
            ฿{cartData.total.toFixed(0)}
          </Typography>
        </Box>
        
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={cartData.onCheckout}
          disabled={cartData.loading || cartData.items.length === 0 || !cartData.hasValidAddress}
          startIcon={cartData.loading ? 
            <CircularProgress size={20} sx={{ color: 'white' }} /> : 
            null
          }
          sx={{
            background: cartData.loading || cartData.items.length === 0 || !cartData.hasValidAddress ? 
              'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)' :
              'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '16px',
            py: 2,
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: cartData.loading || cartData.items.length === 0 || !cartData.hasValidAddress ? 
              '0 4px 12px rgba(156, 163, 175, 0.25)' :
              '0 4px 16px rgba(16, 185, 129, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              background: cartData.loading || cartData.items.length === 0 || !cartData.hasValidAddress ? 
                'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)' :
                'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: cartData.loading || cartData.items.length === 0 || !cartData.hasValidAddress ? 
                '0 4px 12px rgba(156, 163, 175, 0.25)' :
                '0 6px 20px rgba(16, 185, 129, 0.4)',
              transform: cartData.loading || cartData.items.length === 0 || !cartData.hasValidAddress ? 'none' : 'translateY(-1px)'
            },
            '&:disabled': {
              color: 'white'
            },
            '&::before': cartData.loading ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shimmer 1.5s infinite'
            } : {}
          }}
        >
          {cartData.loading ? 'กำลังสั่งซื้อ...' : 
           cartData.items.length === 0 ? 'ไม่มีสินค้าในตะกร้า' :
           !cartData.hasValidAddress ? 'กรุณาเลือกที่อยู่จัดส่ง' :
           `สั่งซื้อเลย • ฿${cartData.total.toFixed(0)}`}
        </Button>
        
        {!cartData.hasValidAddress && (
          <Typography sx={{ 
            fontSize: '0.75rem', 
            color: '#EF4444', 
            textAlign: 'center', 
            mt: 1 
          }}>
            💡 กรุณาตั้งค่าที่อยู่ในหน้าโปรไฟล์ก่อนสั่งซื้อ
          </Typography>
        )}

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </Box>
    );
  }

  // แสดง Navigation ปกติ
  return (
    <BottomNavigation
      value={value}
      onChange={(event, newValue) => setValue(newValue)}
      showLabels
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.1)',
        '& .MuiBottomNavigationAction-root': {
          color: 'rgba(0, 0, 0, 0.6)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            color: '#10B981',
            transform: 'translateY(-2px)'
          },
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        }
      }}
    >
      {/* เมนู - ไปหน้าเมนูเสมอ */}
      <BottomNavigationAction 
        label="เมนู" 
        icon={<Home />}
        onClick={() => {
          // ใช้ restaurantId ที่มีอยู่หรือ default restaurant
          if (currentRestaurantId) {
            handleNavigation(0, `/menu/${currentRestaurantId}`);
          } else {
            // fallback ถ้าไม่มี restaurant ID
            handleNavigation(0, '/restaurants');
          }
        }}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 600
          }
        }}
      />

      {/* ประวัติการสั่งซื้อ */}
      <BottomNavigationAction 
        label="ประวัติการสั่งซื้อ" 
        icon={<Receipt />}
        onClick={() => handleNavigation(1, '/orders')}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.55rem',
            fontWeight: 600
          }
        }}
      />

      {/* โปรไฟล์ */}
      <BottomNavigationAction 
        label="โปรไฟล์" 
        icon={<Person />}
        onClick={() => handleNavigation(2, '/profile')}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 600
          }
        }}
      />
    </BottomNavigation>
  );
} 