'use client';

import { useRestaurant } from './context/RestaurantContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, CardMedia, Button, Chip, 
         CircularProgress, Alert, IconButton, Drawer, List, ListItem, ListItemText,
         ListItemSecondaryAction, ButtonGroup, Avatar, InputBase, Badge, Paper,
         BottomNavigation, BottomNavigationAction, Container } from '@mui/material';
import NoSSR from '../../components/NoSSR';
import { ShoppingCart, Add, Remove, Delete, Favorite, FavoriteBorder,
         Search, NotificationsNone, Restaurant, LocalPizza, RamenDining, 
         LocalBar, Category, Star, Home, Person, Receipt, LocationOn,
         AccessTime, Visibility } from '@mui/icons-material';
// Swiper imports for smooth carousels
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/free-mode';

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
  available: boolean;
  cookingTime: number;
  isPopular?: boolean;
  isPromotion?: boolean;
  tags?: string[];
  isHit?: boolean;
}

interface SpecialOffer {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  background: string;
  image: string;
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
          fontWeight: 600,
          display: mounted && cartCount > 0 ? 'flex' : 'none'
        }
      }}
    >
      <ShoppingCart sx={{ fontSize: 18 }} />
    </Badge>
  );
}

export default function MenuPageComponent() {
  const router = useRouter();
  const { restaurant, loading, error, cart, cartTotal, addToCart, 
          removeFromCart, updateCartItemQuantity } = useRestaurant();
  
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [bottomValue, setBottomValue] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('popular');
  
  // Special offers data with multiple slides
  const specialOffers: SpecialOffer[] = [
    {
      id: '1',
      title: 'แนะนำผัดไทยพิเศษ',
      subtitle: 'เส้นหมี่แห้งยอดนิยม',
      description: 'ผัดไทยสูตรดั้งเดิม หอมหวานกำลังดี',
      buttonText: 'สั่งเลย',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
      image: 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=400&h=200&fit=crop'
    },
    {
      id: '2',
      title: 'โปรโมชั่นพิเศษ',
      subtitle: 'ลด 30% เมนูยอดนิยม',
      description: 'สำหรับสมาชิกใหม่เท่านั้น วันนี้ - 31 ธ.ค.',
      buttonText: 'รับส่วนลด',
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop'
    },
    {
      id: '3',
      title: 'เมนูใหม่มาแล้ว',
      subtitle: 'สูตรเชฟพิเศษ',
      description: 'ลิ้มลองรสชาติใหม่ที่คุณไม่เคยลอง',
      buttonText: 'ลองเลย',
      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=200&fit=crop'
    }
  ];

  const categories: MenuCategory[] = [
    {
      id: 'popular',
      name: '🔥 เมนูคนอังยอะ',
      icon: '🔥',
      items: []
    },
    {
      id: 'recommended',
      name: '👍 ไปโรเซีย',
      icon: '👍',
      items: []
    },
    {
      id: 'snacks',
      name: '🍎 อาหารร็อส',
      icon: '🍎',
      items: []
    },
    {
      id: 'salad',
      name: '🥗 สลัด',
      icon: '🥗',
      items: []
    },
    {
      id: 'pizza',
      name: '🍕 พิซซ่า',
      icon: '🍕',
      items: []
    },
    {
      id: 'burger',
      name: '🍔 เบอร์เกอร์',
      icon: '🍔',
      items: []
    },
    {
      id: 'drink',
      name: '🥤 เครื่องดื่ม',
      icon: '🥤',
      items: []
    },
    {
      id: 'dessert',
      name: '🍰 ของหวาน',
      icon: '🍰',
      items: []
    }
  ];

  const menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'ผัดไกรเขียวสด',
      description: 'ผัดไกรเขียวหอมกลิ่นหน่อไม้ เส้นหมี่เหนียวงาม',
      price: 120,
      originalPrice: 150,
      image: 'https://images.pexels.com/photos/5920742/pexels-photo-5920742.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'popular',
      available: true,
      cookingTime: 15,
      isPopular: true,
      isHit: true,
      tags: ['HIT']
    },
    {
      id: '2',
      name: 'สันคำไทย',
      description: 'สันคำรสแต้วดีนที่ เปรี้ยวอำพิเศษ หอมกลิ่นกะทิ',
      price: 80,
      originalPrice: 110,
      image: 'https://images.pexels.com/photos/4553111/pexels-photo-4553111.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'popular',
      available: true,
      cookingTime: 12,
      isHit: true,
      tags: ['HIT']
    },
    {
      id: '3',
      name: 'ผัดไทยเส้นหมี่',
      description: 'ผัดไทยรสชาติดั้งเดิม เส้นหมี่เหนียว หอมหวาน',
      price: 65,
      originalPrice: 85,
      image: 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'popular',
      available: true,
      cookingTime: 10,
      isHit: true,
      tags: ['HIT']
    },
    {
      id: '4',
      name: 'ต้มยำกุ้งน้ำข้น',
      description: 'ต้มยำรสจัดจ้าน กุ้งสดใหญ่ เผ็ดร้อนแบบไทย',
      price: 95,
      originalPrice: 120,
      image: 'https://images.pexels.com/photos/6249525/pexels-photo-6249525.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'popular',
      available: true,
      cookingTime: 18,
      isHit: true,
      tags: ['HIT']
    }
  ];

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

  const filteredItems = selectedCategory === 'popular' 
    ? menuItems.filter(item => item.isPopular)
    : menuItems.filter(item => item.category === selectedCategory);

  const searchFilteredItems = searchQuery 
    ? filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredItems;



  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
        p: 4 
      }}>
        <Alert severity="error" variant="filled">
          <Typography variant="h6">เกิดข้อผิดพลาด</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!restaurant) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
        p: 4 
      }}>
        <Alert severity="warning">ไม่พบข้อมูลร้านอาหาร</Alert>
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
        flexDirection: 'column'
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Customer Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 700,
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              T
            </Box>
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
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <NoSSR fallback={<ShoppingCart sx={{ fontSize: 18 }} />}>
                <CartBadge cart={cart} />
              </NoSSR>
            </IconButton>

            <IconButton 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.7)',
                width: 40,
                height: 40,
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <NotificationsNone sx={{ fontSize: 20 }} />
            </IconButton>
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
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px)',
              border: 'none',
              boxShadow: 'none',
              overflow: 'hidden',
              width: '100vw',
              marginLeft: 'calc(-50vw + 50%)',
              marginRight: 'calc(-50vw + 50%)'
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="120"
                image="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=300&fit=crop"
                alt="Restaurant"
                sx={{ 
                  objectFit: 'cover',
                  filter: 'brightness(0.9)'
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
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(15px)',
                  borderRadius: '20px',
                  px: 2,
                  py: 1,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 24, 
                    height: 24,
                    background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Restaurant sx={{ fontSize: 14, color: 'white' }} />
                </Avatar>
                <Typography sx={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: 'rgba(0, 0, 0, 0.8)',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.5)'
                }}>
                  ซูชิ โดนโฮ
                </Typography>
              </Box>
            </Box>
            
            <CardContent sx={{ px: 3, py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar 
                  sx={{ 
                    width: 44, 
                    height: 44,
                    background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <Restaurant sx={{ fontSize: 22, color: 'white' }} />
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    color: 'rgba(0, 0, 0, 0.9)', 
                    fontSize: '1.1rem',
                    mb: 0.5
                  }}>
                    ซูชิ โดนโฮ
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                      456 คนเมื่อเล็บ กรุงเทพฯ 10500
                    </Typography>
                    <Chip 
                      label="เปิดอยู่" 
                      size="small"
                      sx={{ 
                        background: 'rgba(46, 125, 50, 0.2)',
                        backdropFilter: 'blur(10px)',
                        color: '#2E7D32',
                        fontSize: '0.7rem',
                        height: '22px',
                        border: '1px solid rgba(46, 125, 50, 0.3)',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ color: '#FFD700', fontSize: 16 }} />
                      <Typography sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        color: 'rgba(0, 0, 0, 0.8)' 
                      }}>
                        4.8
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                        (1.2k)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: 16 }} />
                      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                        25-35 นาที
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Visibility sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: 16 }} />
                      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                        ฟรีเดลิเวอร์รี
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Special Offers Swiper Slider */}
        <Box sx={{ px: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: 'rgba(0, 0, 0, 0.9)',
              fontSize: '1.2rem'
            }}>
              Special Offers
            </Typography>
            <Button 
              sx={{ 
                color: '#10B981',
                fontSize: '0.85rem',
                textTransform: 'none',
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                px: 2,
                py: 0.5,
                border: '1px solid rgba(16, 185, 129, 0.2)',
                '&:hover': {
                  background: 'rgba(16, 185, 129, 0.2)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              See All
            </Button>
          </Box>
          
          {/* Special Offers Swiper */}
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={16}
            slidesPerView={1.2}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            loop={true}
            breakpoints={{
              640: {
                slidesPerView: 1.5,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 20,
              }
            }}
            style={{ 
              paddingBottom: '40px',
              overflow: 'visible'
            }}
          >
            {specialOffers.map((offer) => (
              <SwiperSlide key={offer.id}>
                <Card 
                  sx={{ 
                    borderRadius: 1,
                    background: offer.background,
                    backdropFilter: 'blur(20px)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 160,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                    }
                  }}
                >
                  {/* Background Image */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    right: -20,
                    width: '50%',
                    height: '100%',
                    backgroundImage: `url(${offer.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.3,
                    borderRadius: '50px 0 0 50px'
                  }} />
                  
                  {/* Floating Elements for Liquid Effect */}
                  <Box sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    bottom: -10,
                    left: -10,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)'
                  }} />
                  
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 2 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      mb: 0.5,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      fontSize: '1rem'
                    }}>
                      {offer.title}
                    </Typography>
                    <Typography sx={{ 
                      fontSize: '0.9rem', 
                      opacity: 0.9, 
                      mb: 0.5,
                      fontWeight: 500
                    }}>
                      {offer.subtitle}
                    </Typography>
                    <Typography sx={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.8, 
                      mb: 2.5,
                      lineHeight: 1.4
                    }}>
                      {offer.description}
                    </Typography>
                    
                    <Button 
                      variant="contained"
                      sx={{ 
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(15px)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '25px',
                        px: 3,
                        py: 0.8,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.35)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 20px rgba(255, 255, 255, 0.3)'
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {offer.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>

        {/* Category Swiper */}
        <Box sx={{ px: 2, mb: 4 }}>
          <Swiper
            modules={[FreeMode]}
            spaceBetween={12}
            slidesPerView="auto"
            freeMode={true}
            style={{ 
              paddingBottom: '8px',
              overflow: 'visible'
            }}
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id} style={{ width: 'auto' }}>
                <Button
                  onClick={() => setSelectedCategory(category.id)}
                  sx={{
                    minWidth: 'auto',
                    borderRadius: '25px',
                    px: 3,
                    py: 1.5,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    background: selectedCategory === category.id 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)'
                      : 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(15px)',
                    color: selectedCategory === category.id ? 'white' : 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textTransform: 'none',
                    boxShadow: selectedCategory === category.id 
                      ? '0 8px 25px rgba(16, 185, 129, 0.3)'
                      : '0 4px 15px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      background: selectedCategory === category.id
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)'
                        : 'rgba(255, 255, 255, 0.35)',
                      transform: 'translateY(-2px)',
                      boxShadow: selectedCategory === category.id 
                        ? '0 12px 30px rgba(16, 185, 129, 0.4)'
                        : '0 8px 25px rgba(0, 0, 0, 0.15)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {category.name}
                </Button>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>

        {/* Liquid Section Title */}
        <Box sx={{ px: 2, mb: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(15px)',
              borderRadius: '20px',
              px: 3,
              py: 2,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 600 }}>
              🔥
            </Typography>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: 'rgba(0, 0, 0, 0.9)',
              fontSize: '1.1rem'
            }}>
              เมนูคนยังยอะ
            </Typography>
            <Typography sx={{ 
              fontSize: '0.85rem', 
              color: 'rgba(0, 0, 0, 0.6)',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '15px',
              px: 2,
              py: 0.5,
              fontWeight: 600
            }}>
              (4 รายการ)
            </Typography>
          </Box>
        </Box>

                {/* Menu Items Grid */}
        <Box sx={{ px: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2
            }}
          >
            {menuItems.map((item) => (
              <Card
                key={item.id}
                onClick={() => router.push(`/menu/${restaurant?.id}/item/${item.id}`)}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.2)',
                    background: 'rgba(255, 255, 255, 0.35)'
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
                        background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        height: '20px',
                        minWidth: '28px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
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
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        height: '20px',
                        minWidth: '36px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                      }}
                    />
                  )}
                </Box>

                {/* Content */}
                <CardContent sx={{ p: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 0.5,
                      color: 'rgba(0, 0, 0, 0.9)',
                      fontSize: '0.9rem',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {item.name}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(0, 0, 0, 0.6)', 
                      mb: 1.5,
                      lineHeight: 1.4,
                      fontSize: '0.75rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
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
                          fontWeight: 800,
                          fontSize: '1rem'
                        }}
                      >
                        ฿{item.price}
                      </Typography>
                      {item.originalPrice && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(0, 0, 0, 0.4)',
                            textDecoration: 'line-through',
                            fontSize: '0.8rem',
                            fontWeight: 500
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
        </Box>
      </Box>

      {/* Liquid Glass Bottom Navigation */}
      <BottomNavigation
        value={bottomValue}
        onChange={(event, newValue) => setBottomValue(newValue)}
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
        <BottomNavigationAction 
          label="Home" 
          icon={<Home />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 600
            }
          }}
        />
        <BottomNavigationAction 
          label="สั่งอาหาร" 
          icon={<Restaurant />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 600
            }
          }}
        />
        <BottomNavigationAction 
          label="ถูกใจ" 
          icon={<Favorite />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 600
            }
          }}
        />
        <BottomNavigationAction 
          label="ประวัติ" 
          icon={<Receipt />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 600
            }
          }}
        />
        <BottomNavigationAction 
          label="โปรไฟล์" 
          icon={<Person />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 600
            }
          }}
        />
      </BottomNavigation>
    </Box>
  );
}