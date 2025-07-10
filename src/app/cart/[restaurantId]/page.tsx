'use client';

import React, { useState, useEffect, use } from 'react';
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import FooterNavbar from '../../components/FooterNavbar';
import { 
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
  Close,
  ArrowBack,
  QrCode,
  AccountBalance,
  ContentCopy,
  CheckCircle
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
  // Payment settings
  acceptCash?: boolean;
  acceptTransfer?: boolean;
  promptpayId?: string;
  promptpayType?: 'PHONE_NUMBER' | 'CITIZEN_ID';
  promptpayName?: string;
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
  const [showPromoSection, setShowPromoSection] = useState(false);
  
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
  const [qrCodeDrawerOpen, setQrCodeDrawerOpen] = useState(false);
  
  // Customer profile state
  const [customerProfile, setCustomerProfile] = useState<{
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    selectedAddressType?: string;
    addresses: Array<{
      id: string;
      label: string;
      address: string;
      type: string;
      isDefault: boolean;
      latitude?: number;
      longitude?: number;
    }>;
  } | null>(null);
  
  // Selected values
  const [selectedAddress, setSelectedAddress] = useState({
    id: 'home',
    label: 'บ้าน',
    address: 'ยังไม่ได้ตั้งค่า',
    isDefault: true
  });
  
  const [selectedPayment, setSelectedPayment] = useState({
    id: 'cash',
    label: 'เงินสด',
    details: 'ชำระเงินปลายทาง',
    icon: '💵'
  });

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  
  // Order success state
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState('');
  const [successOrderData, setSuccessOrderData] = useState<any>(null);

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

  // ดึงข้อมูล customer profile
  useEffect(() => {
    const loadCustomerProfile = async () => {
      if (!lineUser || !sessionCheckComplete) return;
      
      try {
        console.log('🔄 Loading customer profile...');
        const response = await fetch('/api/customer/profile');
        
        if (response.ok) {
          const profileData = await response.json();
          console.log('✅ Customer profile loaded:', profileData);
          setCustomerProfile(profileData);
          
          // ตั้งค่าที่อยู่เริ่มต้นจากโปรไฟล์
          if (profileData.addresses && profileData.addresses.length > 0) {
            const defaultAddress = profileData.addresses.find((addr: any) => addr.isDefault) || profileData.addresses[0];
            console.log('📍 Setting default address:', defaultAddress);
            setSelectedAddress({
              id: defaultAddress.id,
              label: defaultAddress.label,
              address: defaultAddress.address,
              isDefault: defaultAddress.isDefault
            });
          }
        } else {
          console.warn('⚠️ Failed to load customer profile:', response.status);
        }
      } catch (error) {
        console.error('❌ Error loading customer profile:', error);
      }
    };

    loadCustomerProfile();
  }, [lineUser, sessionCheckComplete]);

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

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  };

  // คำนวณค่าส่งตามเงื่อนไขยอดขั้นต่ำ
  const minOrderAmount = restaurant?.minOrderAmount || 0;
  const baseDeliveryFee = restaurant?.deliveryFee || 25;
  const subtotal = getSubtotal();
  
  // เช็คเงื่อนไขส่งฟรี: หากสินค้ามากกว่าหรือเท่ากับยอดขั้นต่ำ
  const isEligibleForFreeDelivery = subtotal >= minOrderAmount && minOrderAmount > 0;
  const deliveryFee = isEligibleForFreeDelivery ? 0 : baseDeliveryFee;
  
  const finalTotal = subtotal + deliveryFee - discount;

  const getTotal = () => {
    return finalTotal; // ใช้ finalTotal ที่คำนวณส่วนลดและค่าส่งแล้ว
  };

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

  // สร้างออเดอร์
  const handleCreateOrder = async () => {
    if (!lineUser) {
      alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ');
      return;
    }

    if (cartItems.length === 0) {
      alert('กรุณาเลือกสินค้าก่อนสั่งซื้อ');
      return;
    }

    if (!isValidAddress(selectedAddress)) {
      alert('กรุณาเลือกที่อยู่สำหรับจัดส่ง');
      return;
    }

    try {
      setLoading(true);

      // เตรียมข้อมูลสำหรับส่งไป API
      const orderData = {
        restaurantId,
        items: cartItems.map(item => ({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          addOns: item.addOns || []
        })),
        customerInfo: {
          firstName: customerProfile?.firstName || lineUser.name.split(' ')[0] || '',
          lastName: customerProfile?.lastName || lineUser.name.split(' ').slice(1).join(' ') || '',
          phone: customerProfile?.phone || '',
          email: lineUser.email || '',
          lineUserId: lineUser.lineUserId
        },
        deliveryAddress: {
          address: selectedAddress.address
        },
        paymentMethod: selectedPayment.id,
        subtotal: subtotal,
        deliveryFee: deliveryFee, // ใช้ deliveryFee ที่คำนวณแล้ว (อาจเป็น 0 ถ้าส่งฟรี)
        discount: discount, // ส่วนลดจำนวนเงิน
        promoCode: promoApplied, // โค้ดส่วนลด
        total: finalTotal // ใช้ finalTotal แทน getTotal()
      };

      const response = await fetch('/api/order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        // ล้างตะกร้า
        clearCart();
        
        // เซ็ตข้อมูลสำหรับ success dialog
        setSuccessOrderNumber(result.order.orderNumber);
        setSuccessOrderData(result.order);
        setOrderSuccess(true);
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // Loading state - รวมการโหลดร้านอาหารและตะกร้า
  // if (loading) {
  //   return (
  //     <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
  //       <CircularProgress size={40} sx={{ color: '#10B981' }} />
  //       <Typography sx={{ mt: 2, color: '#6B7280' }}>
  //         กำลังโหลดข้อมูล...
  //       </Typography>
  //     </Container>
  //   );
  // }

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 9999
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2, color: '#10B981' }} />
          <Typography variant="body2" color="text.secondary">
            กำลังโหลดข้อมูล...
          </Typography>
        </Box>
      </Box>
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

  // Address options - ดึงจาก customer profile หรือใช้ fallback
  const addressOptions = customerProfile?.addresses?.map(addr => ({
    id: addr.id,
    label: addr.label,
    address: addr.address,
    isDefault: addr.isDefault,
    type: addr.type
  })) || [
    // fallback addresses ถ้าไม่มีข้อมูลในโปรไฟล์
    {
      id: 'home',
      label: 'บ้าน',
      address: 'ยังไม่ได้ตั้งค่า',
      isDefault: true,
      type: 'HOME'
    },
    {
      id: 'work',
      label: 'ที่ทำงาน',
      address: 'ยังไม่ได้ตั้งค่า',
      isDefault: false,
      type: 'WORK'
    }
  ];

  // ตรวจสอบที่อยู่ที่ถูกต้อง
  const isValidAddress = (address: typeof selectedAddress) => {
    return address && address.address && address.address !== 'ยังไม่ได้ตั้งค่า' && address.address.trim() !== '';
  };

  const hasValidAddress = isValidAddress(selectedAddress);

  // Payment options - ดึงจาก restaurant settings
  const getPaymentOptions = () => {
    const options: Array<{
      id: string;
      label: string;
      details: string;
      icon: string;
    }> = [];
    
    // Debug: ดูข้อมูล restaurant payment settings
    console.log('🔍 Payment Settings Debug:', {
      acceptCash: restaurant?.acceptCash,
      acceptTransfer: restaurant?.acceptTransfer,
      promptpayId: restaurant?.promptpayId,
      promptpayType: restaurant?.promptpayType,
      promptpayName: restaurant?.promptpayName
    });
    
    // เพิ่มตัวเลือกเงินสดถ้าร้านรับ
    if (restaurant?.acceptCash) {
      console.log('✅ Adding cash payment option');
      options.push({
        id: 'cash',
        label: 'เงินสด',
        details: 'ชำระเงินปลายทาง',
        icon: '💵'
      });
    }
    
    // เพิ่มตัวเลือกโอนเงินถ้าร้านรับและมีข้อมูล PromptPay
    if (restaurant?.acceptTransfer && restaurant?.promptpayId) {
      console.log('✅ Adding PromptPay payment option');
      options.push({
        id: 'transfer',
        label: 'โอนเงินผ่าน PromptPay',
        details: `คลิกเพื่อสร้าง QR Code`,
        icon: '🏦'
      });
    } else {
      console.log('❌ PromptPay not available:', {
        acceptTransfer: restaurant?.acceptTransfer,
        promptpayId: restaurant?.promptpayId
      });
    }
    
    // ถ้าไม่มีตัวเลือกการชำระเงิน ให้แสดงเงินสดเป็นค่าเริ่มต้น
    if (options.length === 0) {
      console.log('⚠️ No payment options, adding default cash option');
      options.push({
        id: 'cash',
        label: 'เงินสด',
        details: 'ชำระเงินปลายทาง',
        icon: '💵'
      });
    }
    
    console.log('💳 Final payment options:', options);
    return options;
  };
  
  const paymentOptions = getPaymentOptions();

  // ตรวจสอบและอัปเดต selectedPayment ถ้าจำเป็น
  if (paymentOptions.length > 0) {
    const currentExists = paymentOptions.find(option => option.id === selectedPayment.id);
    if (!currentExists && selectedPayment.id !== paymentOptions[0].id) {
      // ใช้ setTimeout เพื่อหลีกเลี่ยง state update ระหว่าง render
      setTimeout(() => {
        setSelectedPayment(paymentOptions[0]);
      }, 0);
    }
  }

  const handleAddressSelect = (address: typeof selectedAddress) => {
    setSelectedAddress(address);
    setAddressDrawerOpen(false);
  };

  const handlePaymentSelect = (payment: typeof selectedPayment) => {
    setSelectedPayment(payment);
    setPaymentDrawerOpen(false);
    
    // ถ้าเลือกโอนเงิน ให้เปิด QR Code drawer
    if (payment.id === 'transfer') {
      setTimeout(() => {
        setQrCodeDrawerOpen(true);
      }, 300);
    }
  };

  // สร้าง QR Code สำหรับการโอนเงิน (PromptPay)
  const generateQRCode = () => {
    const totalAmount = finalTotal; // ใช้ finalTotal ที่คำนวณแล้ว
    const restaurantName = restaurant?.name || 'ร้านอาหาร';
    const orderId = `ORD${Date.now()}`;
    
    // ใช้ PromptPay ข้อมูลจากร้านอาหาร
    const promptPayId = restaurant?.promptpayId || '0862061354'; // fallback เบอร์โทรศัพท์
    const promptPayType = restaurant?.promptpayType === 'PHONE_NUMBER' ? 'phone' : 'citizen_id';
    
        // สร้าง PromptPay QR Code ตามมาตรฐาน EMV
    const generatePromptPayQR = (identifier: string, identifierType: string, amount: number) => {
      let merchantInfo = '';
      
      if (identifierType === 'phone') {
        // PromptPay Thailand Real Format - ใช้ National ID encoding สำหรับเบอร์โทร
        let formattedPhone = identifier.replace(/\D/g, ''); // เอาเฉพาะตัวเลข
        
        // ตรวจสอบและแปลงเบอร์โทรไทย
        if (formattedPhone.startsWith('66') && formattedPhone.length === 11) {
          // แปลงจาก 66xxxxxxxxx เป็น 0xxxxxxxxx
          formattedPhone = '0' + formattedPhone.slice(2);
        } else if (formattedPhone.startsWith('0') && formattedPhone.length === 10) {
          // เบอร์โทรรูปแบบ 0xxxxxxxxx อยู่แล้ว
          // ไม่ต้องทำอะไร
        } else if (formattedPhone.length === 9) {
          // เบอร์โทรแบบ xxxxxxxxx (9 หลัก) → 0xxxxxxxxx
          formattedPhone = '0' + formattedPhone;
        } else {
          throw new Error(`รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง: ${identifier}`);
        }
        
        if (formattedPhone.length !== 10 || !formattedPhone.startsWith('0')) {
          throw new Error(`เบอร์โทรศัพท์ไม่ถูกต้อง: ${formattedPhone}`);
        }
        
        // PromptPay Thailand Real Format - ใช้ Tag 03 (Tax ID/National ID) สำหรับเบอร์โทร
        // เพื่อให้แสดงเบอร์โทรครบทุกหลัก
        const aid = '0016A000000677010111'; // Official PromptPay AID
        
        // ใช้ Tax ID Tag (03) แทน Mobile Tag (01) เพื่อให้แสดงครบ
        const idTag = '03';
        const idLength = formattedPhone.length.toString().padStart(2, '0'); // 10 หลัก
        const idField = idTag + idLength + formattedPhone; // 03100862061354
        
        // Merchant Account Information (Tag 29)
        const merchantTag = '29';
        const merchantDataLength = (aid + idField).length.toString().padStart(2, '0');
        merchantInfo = merchantTag + merchantDataLength + aid + idField;
        
        console.log('📱 PromptPay Thailand Real (Tax ID Format):', {
          input: identifier,
          formatted: formattedPhone,
          idField: idField,
          merchantInfo: merchantInfo,
          qrShouldShow: formattedPhone + ' (เบอร์โทรครบ 10 หลัก)'
        });
        
      } else if (identifierType === 'citizen_id') {
        // Format เลขบัตรประชาชน 13 หลัก
        const citizenId = identifier.replace(/\D/g, ''); // เอาเฉพาะตัวเลข
        
        // ถ้าความยาวไม่ใช่ 13 หลัก ให้ fallback เป็นเบอร์โทร
        if (citizenId.length !== 13) {
          console.warn(`⚠️ Invalid citizen ID length (${citizenId.length}), falling back to phone format`);
          // ใช้โค้ดสำหรับเบอร์โทรแทน
          let formattedPhone = citizenId.replace(/\D/g, '');
          
          // ตรวจสอบและแปลงเบอร์โทรไทย
          if (formattedPhone.startsWith('66') && formattedPhone.length === 11) {
            formattedPhone = '0' + formattedPhone.slice(2);
          } else if (formattedPhone.startsWith('0') && formattedPhone.length === 10) {
            // เบอร์โทรรูปแบบ 0xxxxxxxxx อยู่แล้ว
          } else if (formattedPhone.length === 9) {
            formattedPhone = '0' + formattedPhone;
          } else if (formattedPhone.length === 10 && !formattedPhone.startsWith('0')) {
            formattedPhone = '0' + formattedPhone.slice(1);
          }
          
          if (formattedPhone.length === 10 && formattedPhone.startsWith('0')) {
            const aid = '0016A000000677010111';
            const idTag = '03';
            const idLength = formattedPhone.length.toString().padStart(2, '0');
            const idField = idTag + idLength + formattedPhone;
            const merchantTag = '29';
            const merchantDataLength = (aid + idField).length.toString().padStart(2, '0');
            merchantInfo = merchantTag + merchantDataLength + aid + idField;
          } else {
            throw new Error(`ไม่สามารถแปลงข้อมูล PromptPay ได้: ${identifier}`);
          }
        } else {
          // ใช้รูปแบบเลขบัตรประชาชนปกติ
          const aid = '0016A000000677010111'; // AID for PromptPay
          const citizenIdData = `02${citizenId.length.toString().padStart(2, '0')}${citizenId}`;
          merchantInfo = `29${(aid + citizenIdData).length.toString().padStart(2, '0')}${aid}${citizenIdData}`;
        }
      }
      
      // EMV QR Code Format สำหรับ PromptPay
      const payloadFormatIndicator = '000201'; // Payload Format Indicator
      const pointOfInitiation = '010212'; // Point of Initiation Method (12 = QR reusable)
      
      const merchantCategoryCode = '52044111'; // MCC for restaurants
      const transactionCurrency = '5303764'; // THB (764)
      const transactionAmount = amount > 0 ? `54${amount.toFixed(2).length.toString().padStart(2, '0')}${amount.toFixed(2)}` : '';
      const countryCode = '5802TH'; // Thailand
      
      // Merchant Name (Optional)
      const merchantNameField = restaurantName ? `59${restaurantName.length.toString().padStart(2, '0')}${restaurantName}` : '';
      
      // Additional Data (Order ID)
      const additionalData = `62${(orderId.length + 4).toString().padStart(2, '0')}05${orderId.length.toString().padStart(2, '0')}${orderId}`;
      
      // Combine all fields
      const qrString = payloadFormatIndicator + pointOfInitiation + merchantInfo + 
                      merchantCategoryCode + transactionCurrency + transactionAmount + 
                      countryCode + merchantNameField + additionalData;
      
      // Calculate CRC16 checksum
      const crc16 = calculateCRC16(qrString + '6304');
      
      return qrString + '63' + '04' + crc16;
    };
    
    // ฟังก์ชันคำนวณ CRC16 สำหรับ PromptPay
    const calculateCRC16 = (data: string): string => {
      let crc = 0xFFFF;
      for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if (crc & 0x8000) {
            crc = (crc << 1) ^ 0x1021;
          } else {
            crc = crc << 1;
          }
        }
      }
      crc = crc & 0xFFFF;
      return crc.toString(16).toUpperCase().padStart(4, '0');
    };
    
    let promptPayQR;
    try {
      promptPayQR = generatePromptPayQR(promptPayId, promptPayType, totalAmount);
      console.log('✅ PromptPay QR Generated:', promptPayQR);
    } catch (error) {
      console.error('❌ PromptPay QR Error:', error);
      promptPayQR = 'ERROR_GENERATING_QR';
    }
    
    const bankData = {
      bankName: 'PromptPay',
      accountName: restaurantName,
      accountNumber: promptPayId,
      promptPayId: promptPayId,
      promptPayPhone: promptPayType === 'phone' ? promptPayId : '',
      promptPayCitizenId: promptPayType === 'citizen_id' ? promptPayId : '',
      promptPayType: promptPayType,
      usePhoneNumber: promptPayType === 'phone',
      amount: totalAmount,
      orderId: orderId,
      qrData: promptPayQR,
      isPromptPay: true
    };
    
    return bankData;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
      pb: 16,
      position: 'relative',
      '@keyframes checkPulse': {
        '0%': { transform: 'scale(0)', opacity: 0 },
        '50%': { transform: 'scale(1.2)', opacity: 0.8 },
        '100%': { transform: 'scale(1)', opacity: 1 }
      },
      '@keyframes float': {
        '0%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-10px)' },
        '100%': { transform: 'translateY(0px)' }
      }
    }}>

      {/* Floating Home Button */}
      <Box
        onClick={() => router.push(`/menu/${restaurantId}`)}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          animation: 'float 3s ease-in-out infinite',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1) translateY(-2px)',
            background: 'rgba(255, 255, 255, 0.25)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          }
        }}
      >
        <Home sx={{ 
          color: '#10B981', 
          fontSize: 24,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }} />
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
                overflow: 'hidden',
                mb: 3
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

              {/* Promo Code Section */}
              <Box sx={{ px: 3, py: 2 }}>
                {/* Toggle Button for Promo Section */}
                {!promoApplied && (
                  <Box sx={{ mb: showPromoSection ? 2 : 3 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setShowPromoSection(!showPromoSection)}
                      sx={{
                        color: '#10B981',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        p: 0,
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: '#059669'
                        }
                      }}
                    >
                      🎫 {showPromoSection ? 'ซ่อนโค้ดส่วนลด' : 'มีโค้ดส่วนลด?'}
                    </Button>
                  </Box>
                )}

                {/* Promo Input Section */}
                {(showPromoSection && !promoApplied) && (
                  <Box sx={{ mb: 3 }}>
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
                  </Box>
                )}

                {/* Applied Promo Display */}
                {promoApplied && (
                  <Box sx={{ mb: 3 }}>
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
                          🎫 {promoApplied}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#059669' }}>
                          ส่วนลด ฿{discount}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          removePromo();
                          setShowPromoSection(false); // ซ่อน section หลังลบโปรโม
                        }}
                        sx={{ color: '#FF6F61' }}
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                )}
                
                {/* Payment Methods */}
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
                          selectedPayment.id === 'transfer' ?
                          'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' :
                          'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: selectedPayment.id === 'credit' ? 
                          '0 4px 12px rgba(59, 130, 246, 0.25)' :
                          selectedPayment.id === 'wallet' ?
                          '0 4px 12px rgba(139, 92, 246, 0.25)' :
                          selectedPayment.id === 'transfer' ?
                          '0 4px 12px rgba(245, 158, 11, 0.25)' :
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
                          color: 'white', 
                          fontSize: 22, 
                          zIndex: 1, 
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' 
                        }} /> :
                        selectedPayment.id === 'wallet' ?
                        <AccountBalanceWallet sx={{ 
                          color: 'white', 
                          fontSize: 22, 
                          zIndex: 1, 
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' 
                        }} /> :
                        selectedPayment.id === 'transfer' ?
                        <AccountBalance sx={{ 
                          color: 'white', 
                          fontSize: 22, 
                          zIndex: 1, 
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' 
                        }} /> :
                        <Payment sx={{ 
                          color: 'white', 
                          fontSize: 22, 
                          zIndex: 1, 
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' 
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

                {/* Order Summary */}
                <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                      ยอดรวมสินค้า
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.85rem' }}>
                      ฿{mounted ? subtotal.toFixed(0) : '0'}
                    </Typography>
                  </Box>
                  
                  {/* แสดงข้อมูลยอดขั้นต่ำและส่งฟรี */}
                  {minOrderAmount > 0 && (
                    <Box sx={{ 
                     mb: 1, 
                    }}>
                      {isEligibleForFreeDelivery ? (
                        <Typography sx={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500}}>
                          🎉 ได้รับส่งฟรี!
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: '0.75rem', color: '#EA580C', fontWeight: 500}}>
                          💡 สั่งเพิ่ม ฿{(minOrderAmount - subtotal).toFixed(0)} เพื่อส่งฟรี
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                        ค่าจัดส่ง
                      </Typography>
                      {isEligibleForFreeDelivery && (
                        <Typography sx={{ 
                          fontSize: '0.7rem', 
                          color: '#059669', 
                          fontWeight: 500,
                          background: 'rgba(34, 197, 94, 0.1)',
                          px: 1,
                          py: 0.2,
                          borderRadius: '4px'
                        }}>
                          ฟรี!
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!isEligibleForFreeDelivery && baseDeliveryFee !== deliveryFee && (
                        <Typography sx={{ 
                          fontSize: '0.75rem', 
                          color: '#9CA3AF', 
                          textDecoration: 'line-through' 
                        }}>
                          ฿{baseDeliveryFee.toFixed(0)}
                        </Typography>
                      )}
                      <Typography sx={{ 
                        fontWeight: 500, 
                        color: isEligibleForFreeDelivery ? '#059669' : '#111827', 
                        fontSize: '0.85rem' 
                      }}>
                        {isEligibleForFreeDelivery ? 'ฟรี' : `฿${deliveryFee.toFixed(0)}`}
                      </Typography>
                    </Box>
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

                </Box>
              </Box>


            </Box>


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
                onClick={() => {
                  // ถ้าเป็นที่อยู่ที่ยังไม่ได้ตั้งค่า ให้เปิด dialog แทน
                  if (address.address === 'ยังไม่ได้ตั้งค่า') {
                    setAddressDialogOpen(true);
                    return;
                  }
                  handleAddressSelect(address);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: '12px',
                  border: selectedAddress.id === address.id ? '2px solid #10B981' : 
                         address.address === 'ยังไม่ได้ตั้งค่า' ? '1px solid rgba(239, 68, 68, 0.3)' :
                         '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: selectedAddress.id === address.id ? 'rgba(34, 197, 94, 0.05)' : 
                                  address.address === 'ยังไม่ได้ตั้งค่า' ? 'rgba(239, 68, 68, 0.05)' :
                                  'transparent',
                  cursor: 'pointer',
                  '&:hover': { 
                    backgroundColor: address.address === 'ยังไม่ได้ตั้งค่า' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.02)' 
                  }
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
                  {address.address === 'ยังไม่ได้ตั้งค่า' && (
                    <Typography sx={{ color: '#EF4444', fontSize: '0.7rem', mt: 0.5 }}>
                      กรุณาตั้งค่าที่อยู่ในโปรไฟล์
                    </Typography>
                  )}
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
                    background: payment.id === 'transfer' ?
                        (selectedPayment.id === payment.id ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)') :
                        (selectedPayment.id === payment.id ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                                          boxShadow: selectedPayment.id === payment.id ?
                      (payment.id === 'credit' ?
                        '0 4px 12px rgba(59, 130, 246, 0.25)' :
                        payment.id === 'wallet' ?
                        '0 4px 12px rgba(139, 92, 246, 0.25)' :
                        payment.id === 'transfer' ?
                        '0 4px 12px rgba(245, 158, 11, 0.25)' :
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
                  {
                    payment.id === 'transfer' ?
                    <AccountBalance sx={{ 
                      color: selectedPayment.id === payment.id ? 'white' : '#F59E0B', 
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
                      background: payment.id === 'transfer' ?
                        'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' :
                        'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: payment.id === 'transfer' ?
                        '0 2px 6px rgba(245, 158, 11, 0.3)' :
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



      {/* QR Code Payment Drawer */}
      <Drawer
        anchor="bottom"
        open={qrCodeDrawerOpen}
        onClose={() => setQrCodeDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            boxShadow: '0 -20px 40px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(20px)',
            maxHeight: '85vh',
            overflowY: 'auto',
          }
        }}
      >
        <Box sx={{ p: 3, maxWidth: '500px', mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
              💳 PromptPay QR Code
            </Typography>
            <IconButton 
              onClick={() => setQrCodeDrawerOpen(false)}
              sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1)' }
              }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {(() => {
            const bankData = generateQRCode();
            return (
              <Box>
                {/* QR Code Display */}
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    mb: 3,
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '20px',
                    border: '1px solid rgba(245, 158, 11, 0.1)',
                    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.1)'
                  }}
                >
                  <img src='/images/promptpay_logo.png' alt='promptpay logo' width={200} height={120} />
                  <Box 
                    sx={{ 
                      width: 200,
                      height: 200,
                      background: 'url(https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(bankData.qrData) + ')',
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      mx: 'auto',
                      mb: 2,
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 600, mb: 1 }}>
                    ฿{bankData.amount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                    แสกน QR Code ด้วยแอปธนาคารหรือ Mobile Banking
                  </Typography>
                </Box>

                {/* Bank Information */}
                <Box 
                  sx={{ 
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '16px',
                    p: 2.5,
                    mb: 3,
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#374151', fontWeight: 600, mb: 2 }}>
                    ข้อมูล PromptPay
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                      ชื่อร้าน
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.85rem' }}>
                      {bankData.accountName}
                    </Typography>
                  </Box>
                  
                  {bankData.usePhoneNumber ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                        PromptPay
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.85rem' }}>
                          {bankData.promptPayPhone}
                        </Typography>
                        <IconButton 
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(bankData.promptPayPhone);
                            // Show feedback
                          }}
                          sx={{ p: 0.5 }}
                        >
                          <ContentCopy sx={{ fontSize: 14, color: '#6B7280' }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                        เลขบัตรประชาชน
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.85rem' }}>
                          {bankData.promptPayCitizenId.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')}
                        </Typography>
                        <IconButton 
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(bankData.promptPayCitizenId);
                            // Show feedback
                          }}
                          sx={{ p: 0.5 }}
                        >
                          <ContentCopy sx={{ fontSize: 14, color: '#6B7280' }} />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                      จำนวนเงิน
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 600, color: '#F59E0B', fontSize: '0.9rem' }}>
                        ฿{bankData.amount.toLocaleString()}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(bankData.amount.toString());
                          // Show feedback
                        }}
                        sx={{ p: 0.5 }}
                      >
                        <ContentCopy sx={{ fontSize: 14, color: '#6B7280' }} />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                      รหัสคำสั่งซื้อ
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.85rem' }}>
                        {bankData.orderId}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(bankData.orderId);
                          // Show feedback
                        }}
                        sx={{ p: 0.5 }}
                      >
                        <ContentCopy sx={{ fontSize: 14, color: '#6B7280' }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Instructions */}
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 2,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    '& .MuiAlert-icon': { color: '#3B82F6' }
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    💡 <strong>วิธีการโอน:</strong> แสกน QR Code ด้วยแอป Mobile Banking หรือโอนผ่าน PromptPay  จากนั้นส่งสลิปยืนยันการโอนเงิน
                  </Typography>
                </Alert>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setQrCodeDrawerOpen(false)}
                    sx={{
                      borderRadius: '12px',
                      py: 1.5,
                      borderColor: '#E5E7EB',
                      color: '#6B7280',
                      '&:hover': {
                        borderColor: '#D1D5DB',
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    ปิด
                  </Button>

                </Box>
              </Box>
            );
          })()}
        </Box>
      </Drawer>

      {/* Dialog แจ้งเตือนกรณีไม่ได้ตั้งค่าที่อยู่ */}
      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: '#EF4444' }}>กรุณาตั้งค่าที่อยู่ในโปรไฟล์</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            กรุณาตั้งค่าที่อยู่ในหน้าโปรไฟล์ก่อน<br />
            จะเปลี่ยนหน้าไปที่โปรไฟล์เพื่อเพิ่มที่อยู่
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddressDialogOpen(false)} color="inherit">ยกเลิก</Button>
          <Button onClick={() => { setAddressDialogOpen(false); router.push('/profile'); }} color="primary" variant="contained" autoFocus>
            ไปที่โปรไฟล์
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Order Dialog */}
      <Dialog 
        open={orderSuccess} 
        onClose={() => {
          setOrderSuccess(false);
          router.push('/orders');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ textAlign: 'center', p: 4 }}>
          {/* Success Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
              animation: 'bounce 0.6s ease-out'
            }}
          >
            <CheckCircle sx={{ 
              fontSize: 40, 
              color: 'white',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }} />
          </Box>

          {/* Success Message */}
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#065F46', mb: 1 }}>
            สั่งซื้อเรียบร้อย! 🎉
          </Typography>
          
          <Typography variant="body1" sx={{ color: '#6B7280', mb: 3 }}>
            ขอบคุณที่ใช้บริการ เราได้รับออเดอร์ของคุณแล้ว
          </Typography>

          {/* Order Number */}
          <Box 
            sx={{ 
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '16px',
              p: 3,
              mb: 3
            }}
          >
            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1 }}>
              หมายเลขออเดอร์
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669', letterSpacing: 1 }}>
              #{successOrderNumber}
            </Typography>
          </Box>

          {/* Order Summary */}
          {successOrderData && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 2 }}>
                สรุปรายการสั่งซื้อ
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">ยอดรวมสินค้า</Typography>
                <Typography variant="body2">฿{successOrderData.subtotal?.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">ค่าจัดส่ง</Typography>
                <Typography variant="body2">฿{successOrderData.deliveryFee?.toLocaleString()}</Typography>
              </Box>
              {successOrderData.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#10B981' }}>
                    ส่วนลด {successOrderData.promoCode && `(${successOrderData.promoCode})`}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#10B981' }}>
                    -฿{successOrderData.discount?.toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>ยอดรวมทั้งหมด</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#10B981' }}>
                  ฿{successOrderData.total?.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setOrderSuccess(false);
                router.push('/orders');
              }}
              sx={{
                borderRadius: '12px',
                py: 1.5,
                borderColor: '#E5E7EB',
                color: '#6B7280',
                '&:hover': {
                  borderColor: '#D1D5DB',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                }
              }}
            >
              ดูประวัติการสั่งซื้อ
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setOrderSuccess(false);
                router.push(`/menu/${restaurantId}`);
              }}
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: '12px',
                py: 1.5,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)'
                }
              }}
            >
              สั่งอาหารต่อ
            </Button>
          </Box>
        </Box>
      </Dialog>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounce {
          0% { transform: scale(0) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>

      {/* Footer Navigation with Checkout Button */}
      <FooterNavbar 
        restaurantId={restaurantId}
        isCartPage={true}
        cartData={{
          items: cartItems,
          total: mounted ? getTotal() : 0,
          loading: loading,
          hasValidAddress: Boolean(hasValidAddress),
          onCheckout: handleCreateOrder
        }}
      />
    </Box>
  );
} 