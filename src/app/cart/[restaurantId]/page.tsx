'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import NoSSR from '../../components/NoSSR';
import { getAppConfig } from '@/lib/appConfig';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Divider,
  Container,
  Avatar,
  CircularProgress,
  Chip,
  TextField,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert
} from '@mui/material';
import { 
  ArrowBack, 
  Add, 
  Remove,
  Delete,
  ShoppingCartOutlined,
  Restaurant,
  LocationOn,
  Home,
  Work,
  CreditCard,
  AccountBalanceWallet,
  Payment,
  LocalShipping,
  Close
} from '@mui/icons-material';

interface CartItem {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  quantity: number;
  restaurantId: string;
  category?: string;
  addOns?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  status: string;
  isOpen: boolean;
  minOrderAmount?: number;
  deliveryFee?: number;
  deliveryRadius?: number;
  openTime?: string;
  closeTime?: string;
  locationName?: string;
}

const getCartStorageKey = (restaurantId: string, userRole: string = 'customer') => 
  `redpotion_cart_${userRole}_${restaurantId}`;

const loadCartFromStorage = (restaurantId: string, userRole: string = 'customer'): CartItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(getCartStorageKey(restaurantId, userRole));
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('ไม่สามารถโหลดตะกร้าได้:', error);
      return [];
    }
  }
  return [];
};

const saveCartToStorage = (restaurantId: string, cart: CartItem[], userRole: string = 'customer') => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getCartStorageKey(restaurantId, userRole), JSON.stringify(cart));
    } catch (error) {
      console.warn('ไม่สามารถบันทึกตะกร้าได้:', error);
    }
  }
};

export default function RestaurantCartPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState('');
  
  // LINE session state
  const [lineUser, setLineUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    lineUserId: string;
  } | null>(null);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
  
  // Drawer states
  const [addressDrawerOpen, setAddressDrawerOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  
  // Selected values
  const [selectedAddress, setSelectedAddress] = useState({
    id: 'home',
    label: 'บ้าน',
    address: 'ไทม์สแควร์ นิวยอร์ก แมนฮัตตัน',
    isDefault: true
  });
  
  const [selectedPayment, setSelectedPayment] = useState({
    id: 'credit',
    label: 'บัตรเครดิต',
    details: '**** **** **** 1234',
    icon: '💳'
  });
  
  const resolvedParams = use(params);
  const restaurantId = resolvedParams.restaurantId;

  // จัดการ mounted state เพื่อแก้ไข hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // ตรวจสอบ LINE session
  useEffect(() => {
    const checkLineSession = async () => {
      try {
        const config = getAppConfig();
        
        // ตรวจสอบว่ามาจาก LIFF หรือไม่
        const urlParams = new URLSearchParams(window.location.search);
        const isFromLiff = urlParams.get('liff') === 'true';
        
        if (config.skipAuthenticationCheck || isFromLiff) {
          console.log('🔓 Cart: Authentication check skipped');
          setSessionCheckComplete(true);
          return;
        }

        const response = await fetch('/api/auth/line-session');
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          console.log('✅ Cart: LINE session valid');
          setLineUser(data.user);
        } else {
          console.log('⚠️ Cart: No LINE session found');
          // redirect ไป menu แทนการบังคับ login
          router.replace(`/menu/${restaurantId}?return=cart`);
          return;
        }
      } catch (error) {
        console.log('⚠️ Cart: Session check failed');
        // redirect ไป menu แทนการบังคับ login
        router.replace(`/menu/${restaurantId}?return=cart`);
        return;
      } finally {
        setSessionCheckComplete(true);
      }
    };

    if (mounted && restaurantId) {
      checkLineSession();
    }
  }, [mounted, restaurantId, router]);

  // ดึงข้อมูลร้านอาหารและโหลดตะกร้าพร้อมกัน
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // โหลด cart จาก localStorage ทันที
        let cartData: CartItem[] = [];
        if (mounted) {
          try {
            cartData = loadCartFromStorage(restaurantId);
            setCartItems(cartData);
          } catch (cartError) {
            console.error('Error loading cart:', cartError);
            setCartItems([]);
          }
        }

        // ดึงข้อมูลร้านอาหาร
        const response = await fetch(`/api/restaurant/${restaurantId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลร้านอาหารได้');
        }

        const restaurantData = await response.json();
        setRestaurant(restaurantData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    // รอให้ session check เสร็จก่อน
    if (restaurantId && mounted && sessionCheckComplete) {
      loadData();
    }
  }, [restaurantId, mounted, sessionCheckComplete]);

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => 
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      );
      
      if (mounted) {
        saveCartToStorage(restaurantId, updatedItems);
      }
      return updatedItems;
    });
  };

  const removeItem = (itemId: string) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.itemId !== itemId);
      if (mounted) {
        saveCartToStorage(restaurantId, updatedItems);
      }
      return updatedItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (mounted) {
      saveCartToStorage(restaurantId, []);
    }
  };

  const getItemTotalPrice = (item: CartItem) => {
    if (!mounted) return item.price * item.quantity;
    
    const basePrice = item.price * item.quantity;
    const addOnsPrice = item.addOns && Array.isArray(item.addOns) ? 
      item.addOns.reduce((sum, addOn) => sum + (addOn.price || 0), 0) * item.quantity : 0;
    return basePrice + addOnsPrice;
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  };

  const deliveryFee = restaurant?.deliveryFee || 25;
  const minOrderAmount = restaurant?.minOrderAmount || 0;
  const finalTotal = getSubtotal() + deliveryFee - discount;

  const applyPromoCode = () => {
    const promos = {
      'SAVE10': { discount: 10, description: 'ลด ฿10' },
      'SAVE20': { discount: 20, description: 'ลด ฿20' },
      'WELCOME': { discount: 15, description: 'ลด ฿15 สำหรับลูกค้าใหม่' }
    };

    const promo = promos[promoCode.toUpperCase() as keyof typeof promos];
    if (promo) {
      setDiscount(promo.discount);
      setPromoApplied(promoCode.toUpperCase());
      setPromoCode('');
    } else {
      alert('โค้ดส่วนลดไม่ถูกต้อง');
    }
  };

  const removePromo = () => {
    setDiscount(0);
    setPromoApplied('');
  };

  // Loading state - รวมการโหลดร้านอาหารและตะกร้า
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ color: '#10B981' }} />
        <Typography sx={{ mt: 2, color: '#6B7280' }}>
          กำลังโหลดข้อมูล...
        </Typography>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#EF4444', mb: 2 }}>
          เกิดข้อผิดพลาด
        </Typography>
        <Typography sx={{ color: '#6B7280', mb: 3 }}>
          {error}
        </Typography>
        <Button 
          onClick={() => router.back()}
          variant="outlined"
          sx={{ 
            borderColor: '#10B981',
            color: '#10B981',
            '&:hover': {
              borderColor: '#059669',
              backgroundColor: '#F0FDF4'
            }
          }}
        >
          กลับหน้าก่อน
        </Button>
      </Container>
    );
  }

  // No restaurant data
  if (!restaurant) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#6B7280', mb: 2 }}>
          ไม่พบข้อมูลร้านอาหาร
        </Typography>
        <Button 
          onClick={() => router.back()}
          variant="outlined"
          sx={{ 
            borderColor: '#10B981',
            color: '#10B981',
            '&:hover': {
              borderColor: '#059669',
              backgroundColor: '#F0FDF4'
            }
          }}
        >
          กลับหน้าก่อน
        </Button>
      </Container>
    );
  }

  // Address options
  const addressOptions = [
    {
      id: 'home',
      label: 'บ้าน',
      address: 'ไทม์สแควร์ นิวยอร์ก แมนฮัตตัน',
      isDefault: true
    },
    {
      id: 'work',
      label: 'ที่ทำงาน',
      address: 'เอ็มไพร์ สเตท บิลดิ้ง นิวยอร์ก',
      isDefault: false
    }
  ];

  // Payment options
  const paymentOptions = [
    {
      id: 'credit',
      label: 'บัตรเครดิต',
      details: '**** **** **** 1234',
      icon: '💳'
    },
    {
      id: 'wallet',
      label: 'กระเป๋าเงินดิจิทัล',
      details: 'ยอดคงเหลือ ฿1,250',
      icon: '💰'
    },
    {
      id: 'cash',
      label: 'เงินสด',
      details: 'ชำระเงินปลายทาง',
      icon: '💵'
    }
  ];

  const handleAddressSelect = (address: typeof selectedAddress) => {
    setSelectedAddress(address);
    setAddressDrawerOpen(false);
  };

  const handlePaymentSelect = (payment: typeof selectedPayment) => {
    setSelectedPayment(payment);
    setPaymentDrawerOpen(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
      pb: 10,
      '@keyframes checkPulse': {
        '0%': { transform: 'scale(0)', opacity: 0 },
        '50%': { transform: 'scale(1.2)', opacity: 0.8 },
        '100%': { transform: 'scale(1)', opacity: 1 }
      }
    }}>
      {/* Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', py: 2.5, px: 2 }}>
          <IconButton 
            onClick={() => router.back()}
            sx={{ 
              mr: 1.5,
              width: 40,
              height: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            <ArrowBack sx={{ fontSize: 20, color: '#374151' }} />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '1.2rem', sm: '1.1rem' } }}>
              ตะกร้าสินค้า
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ py: 3, px: 2 }}>
        {cartItems.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 8,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                mx: 'auto',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 3,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                  zIndex: 1
                }
              }}
            >
              <ShoppingCartOutlined 
                sx={{ 
                  fontSize: 32, 
                  color: '#9CA3AF',
                  zIndex: 2,
                  position: 'relative',
                }} 
              />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#6B7280',
                mb: 1,
                fontWeight: 500,
                fontSize: { xs: '1rem', sm: '0.95rem' }
              }}
            >
              ยังไม่มีสินค้าในตะกร้า
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#9CA3AF',
                mb: 3,
                fontSize: { xs: '0.85rem', sm: '0.8rem' }
              }}
            >
              เลือกสินค้าจากเมนู {restaurant?.name} เพื่อเริ่มสั่งซื้อ
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push(`/menu/${restaurantId}`)}
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: '16px',
                px: 4,
                py: 1.5,
                fontSize: { xs: '0.95rem', sm: '0.9rem' },
                fontWeight: 500,
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                '&:hover': { 
                  boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              ดูเมนูอาหาร
            </Button>
            
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#9CA3AF',
                mt: 3,
                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                textAlign: 'center',
                display: 'block'
              }}
            >
              💡 วิธีใช้: ไปที่หน้าเมนู → เลือกสินค้า → กดเพิ่มในตะกร้า → กลับมาดูที่นี่
            </Typography>
          </Box>
        ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Restaurant Header */}
            <Box 
              sx={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                p: 3
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#374151', mb: 2, fontSize: '0.9rem' }}>
                จัดส่งไปที่
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                  borderRadius: '12px',
                  p: 1,
                  mx: -1
                }}
                onClick={() => setAddressDrawerOpen(true)}
              >
                <Box 
                  sx={{ 
                    width: 48,
                    height: 48,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(52, 211, 153, 0.25)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 2,
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)'
                    }
                  }}
                >
                  {selectedAddress.id === 'home' ? 
                    <Home sx={{ color: 'white', fontSize: 22, zIndex: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} /> :
                   selectedAddress.id === 'work' ? 
                    <Work sx={{ color: 'white', fontSize: 22, zIndex: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} /> :
                    <LocationOn sx={{ color: 'white', fontSize: 22, zIndex: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#111827', fontSize: { xs: '0.95rem', sm: '0.9rem' } }}>
                      {selectedAddress.label}
                    </Typography>
                    {selectedAddress.isDefault && (
                      <Box 
                        sx={{ 
                          background: '#10B981',
                          color: 'white',
                          px: 1.5,
                          py: 0.3,
                          borderRadius: '8px',
                          fontSize: '0.65rem',
                          fontWeight: 500
                        }}
                      >
                        ค่าเริ่มต้น
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: { xs: '0.85rem', sm: '0.8rem' } }}>
                    {selectedAddress.address}
                  </Typography>
                </Box>
                <IconButton sx={{ color: '#9CA3AF' }}>
                  <ArrowBack sx={{ transform: 'rotate(180deg)', fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Order Summary Section */}
            <Box 
              sx={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#374151', fontSize: { xs: '0.95rem', sm: '0.9rem' } }}>
                  สรุปรายการสั่งซื้อ
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={clearCart}
                  sx={{
                    color: '#FF6F61',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.05)'
                    }
                  }}
                >
                  ล้างตะกร้า
                </Button>
              </Box>

              {/* Items List */}
              <NoSSR 
                fallback={
                  <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
                    <CircularProgress size={24} sx={{ color: '#10B981' }} />
                  </Box>
                }
              >
                <Box sx={{ px: 3, pb: 1 }}>
                  {cartItems.map((item, index) => (
                    <Box key={item.itemId} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar 
                          src={item.image}
                          variant="rounded"
                          sx={{ width: 60, height: 60, borderRadius: '12px' }}
                        >
                          <Restaurant />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600,
                                color: '#111827',
                                fontSize: { xs: '0.95rem', sm: '0.9rem' },
                                lineHeight: 1.2
                              }}
                            >
                              {item.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                                  border: '1px solid rgba(0, 0, 0, 0.05)',
                                  '&:hover': { 
                                    background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
                                    transform: 'scale(1.05)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Remove sx={{ fontSize: 14, color: '#6B7280' }} />
                              </IconButton>
                              <Typography 
                                sx={{ 
                                  minWidth: 20,
                                  textAlign: 'center',
                                  fontWeight: 600,
                                  color: '#111827',
                                  fontSize: { xs: '0.95rem', sm: '0.9rem' },
                                  mx: 0.5
                                }}
                              >
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                                  border: '1px solid rgba(52, 211, 153, 0.2)',
                                  boxShadow: '0 2px 4px rgba(52, 211, 153, 0.15)',
                                  '&:hover': { 
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 3px 6px rgba(52, 211, 153, 0.25)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Add sx={{ fontSize: 14, color: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
                              </IconButton>
                            </Box>
                          </Box>
                          <Box>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                color: '#10B981',
                                fontWeight: 500,
                                fontSize: '1.1rem'
                              }}
                            >
                              ฿{getItemTotalPrice(item).toFixed(0)}
                            </Typography>
                            
                            {/* Base Price Display */}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#6B7280',
                                fontSize: '0.7rem',
                                display: 'block'
                              }}
                            >
                              ราคาหลัก: ฿{item.price.toFixed(0)} × {item.quantity}
                            </Typography>
                            
                            {/* Add-ons Display as Chips */}
                            {item.addOns && item.addOns.length > 0 && (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#6B7280', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 500,
                                    display: 'block',
                                    mb: 0.5
                                  }}
                                >
                                  ตัวเลือกเพิ่มเติม:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {item.addOns.map((addOn, index) => (
                                    <Chip
                                      key={`${addOn.id}-${index}`}
                                      label={`${addOn.name} +฿${addOn.price.toFixed(0)}`}
                                      size="small"
                                      sx={{
                                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                                        color: '#059669',
                                        border: '1px solid rgba(34, 197, 94, 0.25)',
                                        fontSize: '0.75rem',
                                        height: 20,
                                        fontWeight: 400,
                                        borderRadius: '10px',
                                        boxShadow: '0 1px 3px rgba(34, 197, 94, 0.1)',
                                        '& .MuiChip-label': {
                                          px: 1,
                                          py: 0.2
                                        },
                                        '&:hover': {
                                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
                                          boxShadow: '0 2px 4px rgba(34, 197, 94, 0.15)'
                                        }
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      {index < cartItems.length - 1 && (
                        <Divider sx={{ mt: 2, opacity: 0.3 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </NoSSR>

              {/* Payment Methods */}
              <Box sx={{ px: 3, py: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                    borderRadius: '12px',
                    p: 1,
                    mx: -1
                  }}
                  onClick={() => setPaymentDrawerOpen(true)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 48,
                        height: 48,
                        borderRadius: '16px',
                        background: selectedPayment.id === 'credit' ? 
                          'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' :
                          selectedPayment.id === 'wallet' ?
                          'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' :
                          'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: selectedPayment.id === 'credit' ? 
                          '0 4px 12px rgba(59, 130, 246, 0.25)' :
                          selectedPayment.id === 'wallet' ?
                          '0 4px 12px rgba(139, 92, 246, 0.25)' :
                          '0 4px 12px rgba(16, 185, 129, 0.25)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: 2,
                          borderRadius: '14px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)'
                        }
                      }}
                    >
                      {selectedPayment.id === 'credit' ? 
                        <CreditCard sx={{ 
                          color: selectedPayment.id === 'credit' ? 'white' : '#3B82F6', 
                          fontSize: 22, 
                          zIndex: 1, 
                          filter: selectedPayment.id === 'credit' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none' 
                        }} /> :
                        selectedPayment.id === 'wallet' ?
                        <AccountBalanceWallet sx={{ 
                          color: selectedPayment.id === 'wallet' ? 'white' : '#8B5CF6', 
                          fontSize: 22, 
                          zIndex: 1, 
                          filter: selectedPayment.id === 'wallet' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none' 
                        }} /> :
                        <Payment sx={{ 
                          color: selectedPayment.id === 'wallet' ? 'white' : '#10B981', 
                          fontSize: 22, 
                          zIndex: 1, 
                          filter: selectedPayment.id === 'wallet' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none' 
                        }} />}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 500, color: '#374151', fontSize: '0.85rem' }}>
                        {selectedPayment.label}
                      </Typography>
                      <Typography sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                        {selectedPayment.details}
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowBack sx={{ transform: 'rotate(180deg)', fontSize: 18, color: '#9CA3AF' }} />
                </Box>
                
                {/* Promo Code Section */}
                <Box sx={{ mb: 3 }}>
                  {!promoApplied ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="ใส่โค้ดส่วนลด"
                        value={promoCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPromoCode(e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)'
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={applyPromoCode}
                        sx={{
                          borderRadius: '12px',
                          px: 2,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        }}
                      >
                        ใช้
                      </Button>
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '12px',
                        p: 2
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#059669' }}>
                          {promoApplied}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#059669' }}>
                          ส่วนลด ฿{discount}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={removePromo}
                        sx={{ color: '#FF6F61' }}
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {/* Order Summary */}
                <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                      ยอดรวมสินค้า
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.85rem' }}>
                      ฿{mounted ? getSubtotal().toFixed(0) : '0'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                      ค่าจัดส่ง
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.85rem' }}>
                      ฿{deliveryFee.toFixed(0)}
                    </Typography>
                  </Box>
                  {discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography sx={{ color: '#10B981', fontSize: '0.85rem' }}>
                        ส่วนลด ({promoApplied})
                      </Typography>
                      <Typography sx={{ fontWeight: 500, color: '#10B981', fontSize: '0.85rem' }}>
                        -฿{discount.toFixed(0)}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ mb: 2, opacity: 0.3 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '1rem' }}>
                      รวมทั้งสิ้น
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>
                      ฿{mounted ? finalTotal.toFixed(0) : '0'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Place Order Button */}
            <Button
              variant="contained"
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: '20px',
                py: 2,
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
                '&:hover': { 
                  boxShadow: '0 12px 32px rgba(34, 197, 94, 0.5)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              สั่งซื้อ • ฿{mounted ? finalTotal.toFixed(0) : '0'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Address Selection Drawer */}
      <Drawer
        anchor="bottom"
        open={addressDrawerOpen}
        onClose={() => setAddressDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            maxHeight: '70vh'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              เลือกที่อยู่จัดส่ง
            </Typography>
            <IconButton 
              onClick={() => setAddressDrawerOpen(false)}
              sx={{
                width: 36,
                height: 36,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Close sx={{ fontSize: 18, color: '#6B7280' }} />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {addressOptions.map((address) => (
              <Box
                key={address.id}
                onClick={() => handleAddressSelect(address)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: '12px',
                  border: selectedAddress.id === address.id ? '2px solid #10B981' : '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: selectedAddress.id === address.id ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                }}
              >
                <Box 
                  sx={{ 
                    width: 48,
                    height: 48,
                    borderRadius: '16px',
                    background: selectedAddress.id === address.id ? 
                      'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 
                      'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedAddress.id === address.id ? 'white' : '#6B7280',
                    boxShadow: selectedAddress.id === address.id ? 
                      '0 4px 12px rgba(52, 211, 153, 0.25)' : 
                      '0 2px 8px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&::before': selectedAddress.id === address.id ? {
                      content: '""',
                      position: 'absolute',
                      inset: 2,
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)'
                    } : {}
                  }}
                >
                  <Box sx={{ 
                    zIndex: 1, 
                    filter: selectedAddress.id === address.id ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none',
                    fontSize: 22
                  }}>
                    {address.id === 'home' ? <Home sx={{ color: selectedAddress.id === address.id ? 'white' : '#10B981', fontSize: 22 }} /> : 
                     address.id === 'work' ? <Work sx={{ color: selectedAddress.id === address.id ? 'white' : '#10B981', fontSize: 22 }} /> :
                     <LocationOn sx={{ color: selectedAddress.id === address.id ? 'white' : '#10B981', fontSize: 22 }} />}
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                      {address.label}
                    </Typography>
                    {address.isDefault && (
                      <Box 
                        sx={{ 
                          background: '#10B981',
                          color: 'white',
                          px: 1,
                          py: 0.2,
                          borderRadius: '6px',
                          fontSize: '0.6rem',
                          fontWeight: 500
                        }}
                      >
                        ค่าเริ่มต้น
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                    {address.address}
                  </Typography>
                </Box>
                {selectedAddress.id === address.id && (
                  <Box 
                    sx={{ 
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(52, 211, 153, 0.3)',
                      animation: 'checkPulse 0.3s ease-out'
                    }}
                  >
                    <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                      ✓
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Drawer>

      {/* Payment Method Selection Drawer */}
      <Drawer
        anchor="bottom"
        open={paymentDrawerOpen}
        onClose={() => setPaymentDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            maxHeight: '70vh'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              เลือกวิธีการชำระเงิน
            </Typography>
            <IconButton 
              onClick={() => setPaymentDrawerOpen(false)}
              sx={{
                width: 36,
                height: 36,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Close sx={{ fontSize: 18, color: '#6B7280' }} />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {paymentOptions.map((payment) => (
              <Box
                key={payment.id}
                onClick={() => handlePaymentSelect(payment)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: '12px',
                  border: selectedPayment.id === payment.id ? '2px solid #10B981' : '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: selectedPayment.id === payment.id ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                }}
              >
                <Box 
                  sx={{ 
                    width: 48,
                    height: 48,
                    borderRadius: '16px',
                    background: payment.id === 'credit' ? 
                      (selectedPayment.id === payment.id ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)') :
                      payment.id === 'wallet' ?
                      (selectedPayment.id === payment.id ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' : 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)') :
                      (selectedPayment.id === payment.id ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: selectedPayment.id === payment.id ? 
                      (payment.id === 'credit' ? 
                        '0 4px 12px rgba(59, 130, 246, 0.25)' :
                        payment.id === 'wallet' ?
                        '0 4px 12px rgba(139, 92, 246, 0.25)' :
                        '0 4px 12px rgba(16, 185, 129, 0.25)') :
                      '0 2px 8px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&::before': selectedPayment.id === payment.id ? {
                      content: '""',
                      position: 'absolute',
                      inset: 2,
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)'
                    } : {}
                  }}
                >
                  {payment.id === 'credit' ? 
                    <CreditCard sx={{ 
                      color: selectedPayment.id === payment.id ? 'white' : '#3B82F6', 
                      fontSize: 22, 
                      zIndex: 1, 
                      filter: selectedPayment.id === payment.id ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none' 
                    }} /> :
                    payment.id === 'wallet' ?
                    <AccountBalanceWallet sx={{ 
                      color: selectedPayment.id === payment.id ? 'white' : '#8B5CF6', 
                      fontSize: 22, 
                      zIndex: 1, 
                      filter: selectedPayment.id === payment.id ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none' 
                    }} /> :
                    <Payment sx={{ 
                      color: selectedPayment.id === payment.id ? 'white' : '#10B981', 
                      fontSize: 22, 
                      zIndex: 1, 
                      filter: selectedPayment.id === payment.id ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none' 
                    }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {payment.label}
                  </Typography>
                  <Typography sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                    {payment.details}
                  </Typography>
                </Box>
                {selectedPayment.id === payment.id && (
                  <Box 
                    sx={{ 
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: payment.id === 'credit' ? 
                        'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' :
                        payment.id === 'wallet' ?
                        'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' :
                        'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: payment.id === 'credit' ? 
                        '0 2px 6px rgba(59, 130, 246, 0.3)' :
                        payment.id === 'wallet' ?
                        '0 2px 6px rgba(139, 92, 246, 0.3)' :
                        '0 2px 6px rgba(16, 185, 129, 0.3)',
                      animation: 'checkPulse 0.3s ease-out'
                    }}
                  >
                    <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                      ✓
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
} 