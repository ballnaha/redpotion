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
  Alert
} from '@mui/material';
import { 
  ArrowBack, 
  Add, 
  Remove,
  Star,
  LocalFireDepartment,
  Timer,
  Restaurant,
  ShoppingCart
} from '@mui/icons-material';
import { useRestaurant } from '../../context/RestaurantContext';

interface AddOn {
  id: string;
  name: string;
  price: number;
}

export default function ItemPage({ params }: { params: Promise<{ restaurantId: string; itemId: string }> }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { cart, cartTotal, restaurant, setCartItemQuantity } = useRestaurant();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const resolvedParams = use(params);

  const itemData = {
    id: resolvedParams.itemId,
    name: 'ควินัว เพาเวอร์ โบล์',
    restaurant: 'กรีน โบล์ - อาหารสุขภาพ',
    rating: 4.8,
    reviews: '(156)',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    basePrice: 189,
    originalPrice: 229,
    calories: 420,
    prepTime: '15-20 นาที',
    description: 'ควินัวออร์แกนิค ผักใบเขียวสด อโวคาโด้สุก เมล็ดชีอา และโปรตีนคุณภาพสูง สำหรับมื้อที่อิ่มอร่อยและดีต่อสุขภาพ',
    tags: ['Organic', 'High Protein', 'Superfood']
  };

  const addOns: AddOn[] = [
    { id: '1', name: 'ไก่ย่าง', price: 35 },
    { id: '2', name: 'ไข่ต้ม', price: 15 },
    { id: '3', name: 'อโวคาโด้', price: 25 },
    { id: '4', name: 'เมล็ดชีอา', price: 20 },
    { id: '5', name: 'อัลมอนด์', price: 30 },
    { id: '6', name: 'มันเทศ', price: 18 }
  ];

  const discountPercent = Math.round(((itemData.originalPrice - itemData.basePrice) / itemData.originalPrice) * 100);

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotal = () => {
    const addOnTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId);
      return total + (addOn ? addOn.price : 0);
    }, 0);
    return (itemData.basePrice + addOnTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (restaurant) {
      // สร้าง unique ID สำหรับสินค้าที่มี add-ons ต่างกัน
      const addOnIds = selectedAddOns.sort().join('-');
      const uniqueItemId = addOnIds ? `${itemData.id}-addons-${addOnIds}` : itemData.id;
      
      // เตรียมข้อมูล add-ons และคำนวณราคา
      let totalPrice = itemData.basePrice;
      const selectedAddOnsData = selectedAddOns.map(addOnId => {
        const addOn = addOns.find(a => a.id === addOnId);
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
        price: itemData.basePrice, // ราคาฐานเท่านั้น
        originalPrice: itemData.originalPrice,
        image: itemData.image,
        category: 'healthy-bowls',
        available: true,
        cookingTime: 15,
        addOns: selectedAddOnsData // เก็บ add-ons แยกต่างหาก
      };
      
      // ตรวจสอบว่าสินค้านี้มีในตะกร้าแล้วหรือไม่
      const existingCartItem = cart.find(item => item.itemId === uniqueItemId);
      const newQuantity = existingCartItem ? existingCartItem.quantity + quantity : quantity;
      
      // เพิ่มสินค้าลงตะกร้า - สะสมจำนวน
      setCartItemQuantity(menuItem, newQuantity);
      
      // แสดง snackbar
      setSnackbarOpen(true);
      
      // ไม่รีเซ็ตค่า - ให้ user เลือกต่อได้
    }
  };

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
          src={itemData.image}
          alt={itemData.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {/* Discount Badge - Bottom Left */}
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
              fontWeight: 600,
              color: '#FFFFFF',
              fontSize: { xs: '0.7rem', sm: '0.7rem' }
            }}
          >
            -{discountPercent}%
          </Typography>
        </Box>

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
            <Badge 
              badgeContent={0} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#FF6F61',
                  color: 'white',
                  fontSize: '0.6rem',
                  minWidth: '16px',
                  height: '16px',
                  display: 'none' // ซ่อน badge ชั่วคราวเพื่อป้องกัน hydration mismatch
                }
              }}
            >
              <ShoppingCart sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>
        </Box>

        {/* Health Badge - Top Right of Image */}
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
          <Typography sx={{ color: 'white', fontSize: { xs: '0.7rem', sm: '0.7rem' }, fontWeight: 600 }}>
            {itemData.calories} แคล
          </Typography>
        </Box>
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
              {itemData.restaurant}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Star sx={{ fontSize: { xs: 14, sm: 14 }, color: '#10B981' }} />
              <Typography 
                sx={{ 
                  color: '#111827',
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  fontWeight: 600
                }}
              >
                {itemData.rating}
              </Typography>
              <Typography 
                sx={{ 
                  color: '#6B7280',
                  fontSize: { xs: '0.8rem', sm: '0.75rem' }
                }}
              >
                {itemData.reviews}
              </Typography>
            </Box>
                                                        <Chip 
               label="สุขภาพ"
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

          {/* Quick Info */}
          <Box display="flex" gap={3} mb={3}>
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1
              }}
            >
              <Timer sx={{ fontSize: 18, color: '#6B7280', mb: 0.5 }} />
              <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 0.25 }}>
                เวลาเตรียม
              </Typography>
              <Typography sx={{ color: '#111827', fontWeight: 500, fontSize: '0.75rem' }}>
                {itemData.prepTime}
              </Typography>
            </Box>
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1
              }}
            >
              <LocalFireDepartment sx={{ fontSize: 18, color: '#6B7280', mb: 0.5 }} />
              <Typography sx={{ color: '#6B7280', fontSize: '0.7rem', mb: 0.25 }}>
                แคลอรี่
              </Typography>
              <Typography sx={{ color: '#111827', fontWeight: 500, fontSize: '0.75rem' }}>
                {itemData.calories} แคล
              </Typography>
            </Box>
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
              ฿{itemData.basePrice}
            </Typography>
            <Typography 
              sx={{ 
                color: '#9CA3AF',
                fontSize: { xs: '1rem', sm: '1rem' },
                textDecoration: 'line-through'
              }}
            >
              ฿{itemData.originalPrice}
            </Typography>
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
            {addOns.map((addOn, index) => (
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
                {index < addOns.length - 1 && (
                  <Box sx={{ borderBottom: '1px solid #F3F4F6', mx: 1, my: 0.25 }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>

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
              {selectedAddOns.length > 0 && (
                <Typography 
                  sx={{ 
                    color: '#9CA3AF',
                    fontSize: { xs: '0.8rem', sm: '0.75rem' },
                    textDecoration: 'line-through'
                  }}
                >
                  ฿{(itemData.originalPrice + selectedAddOns.reduce((total, addOnId) => {
                    const addOn = addOns.find(a => a.id === addOnId);
                    return total + (addOn ? addOn.price : 0);
                  }, 0)) * quantity}
                </Typography>
              )}
            </Box>
          </Box>

          <Button 
            onClick={handleAddToCart}
            fullWidth
            sx={{
              background: '#10B981',
              borderRadius: '8px',
              py: 1.25,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'white',
              '&:hover': {
                background: '#059669'
              }
            }}
          >
            <Restaurant sx={{ mr: 1, fontSize: 18 }} />
            เพิ่มในตะกร้า
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