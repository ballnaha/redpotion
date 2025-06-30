'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  IconButton, 
  Button, 
  CardMedia,
  Chip,
  Badge,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import { 
  ArrowBack, 
  Add, 
  Remove,
  Star,
  LocalFireDepartment,
  Restaurant,
  ShoppingCart
} from '@mui/icons-material';
import { useRestaurant } from '../../context/RestaurantContext';

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

interface AddOn {
  id: string;
  name: string;
  price: number;
  isAvailable?: boolean;
  sortOrder?: number;
}

interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  isAvailable: boolean;
  calories?: number;
  category: {
    id: string;
    name: string;
  };
  restaurant: {
    id: string;
    name: string;
  };
  addons: AddOn[];
}

export default function ItemPage({ params }: { params: Promise<{ restaurantId: string; itemId: string }> }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemData, setItemData] = useState<MenuItemData | null>(null);
  const { cart, cartTotal, restaurant, loading: restaurantLoading, setCartItemQuantity } = useRestaurant();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const resolvedParams = use(params);

  // ดึงข้อมูล menu item จาก API เมื่อ restaurant context พร้อมแล้ว
  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        setError(null);

        const response = await fetch(`/api/restaurant/menu-items/${resolvedParams.itemId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลเมนูได้');
        }

        const data = await response.json();
        setItemData(data);
      } catch (err) {
        console.error('Error fetching menu item:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    };

    // รอให้ restaurant context โหลดเสร็จก่อน
    if (!restaurantLoading && restaurant && resolvedParams.itemId) {
      fetchMenuItem();
    }
  }, [resolvedParams.itemId, restaurantLoading, restaurant]);

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotal = () => {
    if (!itemData) return 0;
    
    const addOnTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = itemData.addons.find(a => a.id === addOnId);
      return total + (addOn ? addOn.price : 0);
    }, 0);
    return (itemData.price + addOnTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (!itemData) return;
    
    console.log('🔄 handleAddToCart เริ่มทำงาน');
    console.log('🏪 restaurant:', restaurant);
    
    if (restaurant) {
      // สร้าง unique ID สำหรับสินค้าที่มี add-ons ต่างกัน
      const addOnIds = selectedAddOns.sort().join('-');
      const uniqueItemId = addOnIds ? `${itemData.id}-addons-${addOnIds}` : itemData.id;
      
      // เตรียมข้อมูล add-ons และคำนวณราคา
      let totalPrice = itemData.price;
      const selectedAddOnsData = selectedAddOns.map(addOnId => {
        const addOn = itemData.addons.find(a => a.id === addOnId);
        if (addOn) {
          totalPrice += addOn.price;
          return {
            id: addOn.id,
            name: addOn.name,
            price: addOn.price
          };
        }
        return null;
      }).filter(addOn => addOn !== null);
      
      const menuItem = {
        id: uniqueItemId, // ใช้ unique ID ที่รวม add-ons แล้ว
        name: itemData.name, // ใช้ชื่อเมนูหลักเท่านั้น
        description: itemData.description, // ใช้คำอธิบายเดิม
        price: itemData.price, // ราคาฐานเท่านั้น
        originalPrice: itemData.originalPrice,
        image: itemData.imageUrl || '/images/default_cover.jpg',
        category: itemData.category.name,
        available: itemData.isAvailable,
        cookingTime: 15, // ค่าเริ่มต้น
        addOns: selectedAddOnsData // เก็บ add-ons แยกต่างหาก
      };
      
      // ตรวจสอบว่าสินค้านี้มีในตะกร้าแล้วหรือไม่
      const existingCartItem = cart.find(item => item.itemId === uniqueItemId);
      const newQuantity = existingCartItem ? existingCartItem.quantity + quantity : quantity;
      
      // เพิ่มสินค้าลงตะกร้า - สะสมจำนวน
      console.log('📤 เรียก setCartItemQuantity');
      setCartItemQuantity(menuItem, newQuantity);
      
      // แสดง snackbar
      console.log('📢 แสดง snackbar');
      setSnackbarOpen(true);
      
      // ไม่รีเซ็ตค่า - ให้ user เลือกต่อได้
    } else {
      console.log('❌ ไม่มีข้อมูลร้าน - ไม่สามารถเพิ่มสินค้าได้');
    }
  };

  // Loading state - แสดงเมื่อ restaurant context กำลังโหลดหรือยังไม่มีข้อมูล item
  if (restaurantLoading || (!itemData && !error)) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ color: '#10B981' }} />
        <Typography sx={{ mt: 2, color: '#6B7280' }}>
          กำลังโหลดข้อมูลเมนู...
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

  // No data state
  if (!itemData) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#6B7280', mb: 2 }}>
          ไม่พบข้อมูลเมนู
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

  const discountPercent = itemData.originalPrice 
    ? Math.round(((itemData.originalPrice - itemData.price) / itemData.originalPrice) * 100)
    : 0;

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: '#FFFFFF',
        overflowY: 'auto',
        pb: 12
      }}
    >
      {/* Product Image */}
      <Box 
        sx={{ 
          position: 'relative',
          width: '100vw',
          height: { xs: '300px', sm: '400px' },
          overflow: 'hidden'
        }}
      >
        <Box
          component="img"
          src={itemData.imageUrl || '/images/default_cover.jpg'}
          alt={itemData.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {/* Discount Badge - Bottom Left */}
        {discountPercent > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 30,
            left: 16,
            background: '#FF6F61',
            px: 1.5,
            py: 0.3,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Typography 
            sx={{ 
                fontWeight: 500,
              color: '#FFFFFF',
                fontSize: { xs: '0.75rem', sm: '0.7rem' }
            }}
          >
            -{discountPercent}%
          </Typography>
        </Box>
        )}

        {/* Header - Floating */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: { xs: 16, sm: 20 },
            left: { xs: 16, sm: 20 },
            right: { xs: 16, sm: 20 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10
          }}
        >
          <IconButton 
            onClick={() => router.back()}
            sx={{ 
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              color: 'white',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <ArrowBack sx={{ fontSize: 18 }} />
          </IconButton>

          {/* Cart Button */}
          <IconButton 
            onClick={() => router.push(`/cart/${restaurant?.id}`)}
            sx={{ 
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              color: 'white',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <CartBadge cart={cart} />
          </IconButton>
        </Box>

        {/* Calories Badge - Top Right of Image */}
        {itemData.calories && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 30,
            right: 16,
            background: '#10B981',
            borderRadius: '6px',
            px: 1.5,
            py: 0.3,
            display: 'flex',
            alignItems: 'center',
            gap: 0.3
          }}
        >
          <LocalFireDepartment sx={{ fontSize: { xs: 12, sm: 12 }, color: 'white' }} />
            <Typography sx={{ color: 'white', fontSize: { xs: '0.75rem', sm: '0.7rem' }, fontWeight: 500 }}>
            {itemData.calories} แคล
          </Typography>
        </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ position: 'relative', top: '-20px', zIndex: 5 }}>
                 {/* Product Info */}
         <Box 
           sx={{ 
             background: '#FFFFFF',
             borderRadius: { xs: '16px 16px 0 0', sm: '16px 16px 0 0' },
             px: { xs: 3, sm: 4 },
             pt: { xs: 3, sm: 4 },
             pb: 2
           }}
         >
          <Typography 
            sx={{ 
              fontSize: { xs: '1.375rem', sm: '1.5rem' },
              fontWeight: 700,
              color: '#111827',
              mb: 1,
              lineHeight: 1.2
            }}
          >
            {itemData.name}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Box sx={{ fontSize: { xs: '1rem', sm: '1rem' } }}>🥗</Box>
            <Typography 
              sx={{ 
                color: '#6B7280',
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                fontWeight: 500
              }}
            >
              {itemData.restaurant.name}
            </Typography>
                                                        <Chip 
              label={itemData.category.name}
               size="small"
               sx={{ 
                 backgroundColor: '#F0FDF4',
                 color: '#059669',
                 fontWeight: 500,
                 fontSize: '0.7rem',
                 border: 'none',
                 height: 24,
                 '& .MuiChip-label': {
                   px: 1,
                   py: 0
                 }
               }}
             />
          </Box>



          {/* Price */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography 
              sx={{ 
                color: '#10B981',
                fontSize: { xs: '1.375rem', sm: '1.5rem' },
                fontWeight: 800
              }}
            >
              ฿{itemData.price}
            </Typography>
            {itemData.originalPrice && (
            <Typography 
              sx={{ 
                color: '#9CA3AF',
                fontSize: { xs: '1rem', sm: '1rem' },
                textDecoration: 'line-through'
              }}
            >
              ฿{itemData.originalPrice}
            </Typography>
            )}
          </Box>

          <Typography 
            sx={{ 
              color: '#6B7280',
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              lineHeight: 1.5,
              mb: 4
            }}
          >
            {itemData.description}
          </Typography>
        </Box>

                {/* Add Ingredients - Minimal */}
        {itemData.addons.length > 0 && (
        <Box sx={{ px: { xs: 3, sm: 4 }, mb: 6 }}>
          <Typography 
            sx={{ 
              fontSize: { xs: '1.125rem', sm: '1.125rem' },
              fontWeight: 700,
              color: '#111827',
              mb: 3
            }}
          >
            เพิ่มเติม
          </Typography>
          
          <Box 
            sx={{
              background: '#FAFAFA',
              borderRadius: '12px',
              p: 1.5
            }}
          >
              {itemData.addons.map((addOn, index) => (
              <Box key={addOn.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedAddOns.includes(addOn.id)}
                      onChange={() => handleAddOnToggle(addOn.id)}
                      sx={{
                        color: '#10B981',
                        '&.Mui-checked': {
                          color: '#10B981',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', ml: 1 }}>
                      <Typography 
                        sx={{ 
                          color: '#111827',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}
                      >
                        {addOn.name}
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: '#10B981',
                          fontSize: '0.875rem',
                          fontWeight: 700
                        }}
                      >
                        +฿{addOn.price}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    margin: 0,
                    width: '100%',
                    py: 0.25
                  }}
                />
                  {index < itemData.addons.length - 1 && (
                  <Box sx={{ borderBottom: '1px solid #F3F4F6', mx: 1, my: 0.25 }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>
        )}

        {/* Bottom Actions */}
                  <Box 
            sx={{ 
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#FFFFFF',
              borderTop: '1px solid #F3F4F6',
              px: { xs: 3, sm: 4 },
              py: 2,
              zIndex: 1000
            }}
          >
          {/* Quantity Controls */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                sx={{
                  color: '#6B7280',
                  width: 32,
                  height: 32,
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  '&:hover': {
                    background: '#F3F4F6'
                  }
                }}
              >
                <Remove sx={{ fontSize: 16 }} />
              </IconButton>
              <Typography 
                sx={{ 
                  color: '#111827',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minWidth: '24px',
                  textAlign: 'center'
                }}
              >
                {quantity}
              </Typography>
              <IconButton 
                onClick={() => setQuantity(quantity + 1)}
                sx={{
                  color: '#6B7280',
                  width: 32,
                  height: 32,
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  '&:hover': {
                    background: '#F3F4F6'
                  }
                }}
              >
                <Add sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <Box textAlign="right">
              <Typography 
                sx={{ 
                  color: '#10B981',
                  fontSize: { xs: '1.25rem', sm: '1.25rem' },
                  fontWeight: 800,
                  lineHeight: 1
                }}
              >
                ฿{calculateTotal()}
              </Typography>
              {selectedAddOns.length > 0 && itemData.originalPrice && (
                <Typography 
                  sx={{ 
                    color: '#9CA3AF',
                    fontSize: { xs: '0.8rem', sm: '0.75rem' },
                    textDecoration: 'line-through'
                  }}
                >
                  ฿{(itemData.originalPrice + selectedAddOns.reduce((total, addOnId) => {
                    const addOn = itemData.addons.find(a => a.id === addOnId);
                    return total + (addOn ? addOn.price : 0);
                  }, 0)) * quantity}
                </Typography>
              )}
            </Box>
          </Box>

          <Button 
            onClick={handleAddToCart}
            disabled={!itemData.isAvailable}
            fullWidth
            sx={{
              background: itemData.isAvailable ? '#10B981' : '#9CA3AF',
              borderRadius: '8px',
              py: 1.25,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'white',
              '&:hover': {
                background: itemData.isAvailable ? '#059669' : '#9CA3AF'
              },
              '&.Mui-disabled': {
                background: '#9CA3AF',
                color: 'white'
              }
            }}
          >
            <Restaurant sx={{ mr: 1, fontSize: 18 }} />
            {itemData.isAvailable ? 'เพิ่มในตะกร้า' : 'ไม่พร้อมจำหน่าย'}
          </Button>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ 
            width: '100%',
            backgroundColor: '#10B981',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          เพิ่ม "{itemData.name}" ลงตะกร้าแล้ว!
        </Alert>
      </Snackbar>
    </Box>
  );
} 