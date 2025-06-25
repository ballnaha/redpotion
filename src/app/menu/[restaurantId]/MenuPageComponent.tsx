'use client';

import { useRestaurant } from './context/RestaurantContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
         LocalCafe, Icecream } from '@mui/icons-material';
// Swiper imports for smooth carousels (for special offers)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Add custom styles for animations
const globalStyles = `
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
      transform: translateY(15px) scale(0.98);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .menu-items-container {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
  }
  
  .menu-items-container.changing {
    opacity: 0;
    transform: translateY(10px);
  }
`;

// Inject styles only once
if (typeof document !== 'undefined' && !document.getElementById('menu-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'menu-animations';
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}

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

export default function MenuPageComponent() {
  const router = useRouter();
  const { restaurant, loading, error, cart, cartTotal, addToCart, 
          removeFromCart, updateCartItemQuantity } = useRestaurant();
  
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
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
      name: 'ยอดนิยม',
      icon: 'TrendingUp',
      items: []
    },
    {
      id: 'recommended',
      name: 'แนะนำ',
      icon: 'Recommend',
      items: []
    },
    {
      id: 'snacks',
      name: 'อาหารว่าง',
      icon: 'Fastfood',
      items: []
    },
    {
      id: 'salad',
      name: 'สลัด',
      icon: 'LocalDining',
      items: []
    },
    {
      id: 'pizza',
      name: 'พิซซ่า',
      icon: 'LocalPizza',
      items: []
    },
    {
      id: 'burger',
      name: 'เบอร์เกอร์',
      icon: 'LunchDining',
      items: []
    },
    {
      id: 'drink',
      name: 'เครื่องดื่ม',
      icon: 'LocalCafe',
      items: []
    },
    {
      id: 'dessert',
      name: 'ของหวาน',
      icon: 'Icecream',
      items: []
    }
  ];

  const menuItems: MenuItem[] = [
    // Popular Items
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
    },

    // Recommended Items
    {
      id: '5',
      name: 'แกงเผ็ดไก่',
      description: 'แกงเผ็ดสูตรดั้งเดิม ไก่นุ่ม เผ็ดร้อนกำลังดี',
      price: 110,
      originalPrice: 140,
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop',
      category: 'recommended',
      available: true,
      cookingTime: 20,
      isPopular: false,
      tags: ['แนะนำ']
    },
    {
      id: '6',
      name: 'ส้มตำไทย',
      description: 'ส้มตำรสชาติแซ่บ เปรี้ยว หวาน เผ็ด กำลังดี',
      price: 70,
      originalPrice: 90,
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      category: 'recommended',
      available: true,
      cookingTime: 8,
      isPopular: false,
      tags: ['แนะนำ']
    },

    // Snacks
    {
      id: '7',
      name: 'ปอเปี๊ยะทอด',
      description: 'ปอเปี๊ยะทอดกรอบ ไส้หมูสับ กุ้ง ผักใส',
      price: 45,
      image: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop',
      category: 'snacks',
      available: true,
      cookingTime: 12,
      isPopular: false,
      tags: ['ทอด']
    },
    {
      id: '8',
      name: 'ไก่ทอดกรอบ',
      description: 'ไก่ทอดกรอบนอกนุ่มใน เสิร์ฟพร้อมซอสเผ็ด',
      price: 85,
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop',
      category: 'snacks',
      available: true,
      cookingTime: 15,
      isPopular: false,
      tags: ['ทอด', 'กรอบ']
    },

    // Salad
    {
      id: '9',
      name: 'สลัดผักโขม',
      description: 'สลัดผักโขมสด ราดด้วยน้ำสลัดงาขาว',
      price: 65,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      category: 'salad',
      available: true,
      cookingTime: 5,
      isPopular: false,
      tags: ['สุขภาพ']
    },
    {
      id: '10',
      name: 'สลัดผลไม้',
      description: 'สลัดผลไม้รวม สดใหม่ ราดน้ำผึ้งมะนาว',
      price: 75,
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop',
      category: 'salad',
      available: true,
      cookingTime: 8,
      isPopular: false,
      tags: ['สุขภาพ', 'ผลไม้']
    },

    // Pizza
    {
      id: '11',
      name: 'พิซซ่าซีฟู้ด',
      description: 'พิซซ่าหน้าซีฟู้ดรวม กุ้ง หมึก ปู หน้าแน่น',
      price: 285,
      originalPrice: 320,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
      category: 'pizza',
      available: true,
      cookingTime: 25,
      isPopular: false,
      tags: ['พิซซ่า', 'ซีฟู้ด']
    },
    {
      id: '12',
      name: 'พิซซ่าฮาวายเอี้ยน',
      description: 'พิซซ่าหน้าแฮมและสับปะรด รสชาติหวานมัน',
      price: 250,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      category: 'pizza',
      available: true,
      cookingTime: 22,
      isPopular: false,
      tags: ['พิซซ่า', 'หวาน']
    },

    // Burger
    {
      id: '13',
      name: 'เบอร์เกอร์เนื้อ',
      description: 'เบอร์เกอร์เนื้อวัวแบบคลาสสิค พร้อมชีสและผัก',
      price: 135,
      originalPrice: 160,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      category: 'burger',
      available: true,
      cookingTime: 18,
      isPopular: false,
      tags: ['เบอร์เกอร์', 'เนื้อ']
    },
    {
      id: '14',
      name: 'เบอร์เกอร์ไก่ทอด',
      description: 'เบอร์เกอร์ไก่ทอดกรอบ พร้อมซอสมายองเนส',
      price: 115,
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
      category: 'burger',
      available: true,
      cookingTime: 15,
      isPopular: false,
      tags: ['เบอร์เกอร์', 'ไก่']
    },

    // Drinks
    {
      id: '15',
      name: 'ชาเขียวเย็น',
      description: 'ชาเขียวสดชื่น เพิ่มน้ำแข็งและน้ำตาล',
      price: 35,
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
      category: 'drink',
      available: true,
      cookingTime: 3,
      isPopular: false,
      tags: ['เย็น', 'ชา']
    },
    {
      id: '16',
      name: 'น้ำส้มคั้นสด',
      description: 'น้ำส้มคั้นสด 100% ไม่ใส่น้ำตาล',
      price: 45,
      image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop',
      category: 'drink',
      available: true,
      cookingTime: 5,
      isPopular: false,
      tags: ['สด', 'วิตามิน']
    },

    // Desserts
    {
      id: '17',
      name: 'ขนมปังปิ้งน้ำผึ้ง',
      description: 'ขนมปังปิ้งกรอบ ราดน้ำผึ้งแท้และเนย',
      price: 55,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
      category: 'dessert',
      available: true,
      cookingTime: 8,
      isPopular: false,
      tags: ['หวาน', 'ปิ้ง']
    },
    {
      id: '18',
      name: 'ไอศกรีมวนิลลา',
      description: 'ไอศกรีมวนิลลาเนื้อเนียนนุ่ม รสชาติหอมหวาน',
      price: 65,
      image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=400&h=300&fit=crop',
      category: 'dessert',
      available: true,
      cookingTime: 2,
      isPopular: false,
      tags: ['เย็น', 'หวาน']
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

  // Handle category change with smooth animation
  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === selectedCategory || isAnimating) return;
    
    setIsAnimating(true);
    
    // Smooth transition without jarring animations
    setTimeout(() => {
      setSelectedCategory(categoryId);
      setAnimationKey(prev => prev + 1);
      
      // Reset animation state
      setTimeout(() => {
        setIsAnimating(false);
      }, 100);
    }, 150);
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



  // ลบการตรวจสอบ loading เพราะจัดการใน ClientMenuPage แล้ว
  // จัดการเฉพาะ error และ !restaurant เท่านั้น
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
                  backdropFilter: 'blur(5px)',
                  borderRadius: '20px',
                  px: 2,
                  py: 1,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                }}
              >
                
                <Typography sx={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 500, 
                  color: 'rgba(0, 0, 0, 0.8)',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.5)'
                }}>
                  {restaurant?.name}
                </Typography>
              </Box>
            </Box>
            
            <CardContent sx={{ px: 3, py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                
                <Box sx={{ flex: 1 }}>
                  
                  
                  {/* Status and Time */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                      เปิด 08:00 - 22:00
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
                      fontSize: '0.85rem', 
                      color: 'rgba(0, 0, 0, 0.7)',
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}>
                      456 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240
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
                      fontSize: '0.85rem', 
                      color: 'rgba(0, 0, 0, 0.7)',
                      fontWeight: 500
                    }}>
                      02-123-4567
                    </Typography>
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

        {/* Premium Category Grid */}
        <Box sx={{ px: 2, mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0.8,
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
                  py: 1.2,
                  px: 0.5,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: selectedCategory === category.id 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                    : 'rgba(248, 250, 252, 0.8)',
                  border: selectedCategory === category.id 
                    ? '1.5px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid rgba(226, 232, 240, 0.6)',
                  position: 'relative',
                  minHeight: '48px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: selectedCategory === category.id
                    ? '0 4px 20px rgba(16, 185, 129, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    background: selectedCategory === category.id 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                      : 'rgba(255, 255, 255, 0.9)',
                    border: selectedCategory === category.id 
                      ? '1.5px solid rgba(16, 185, 129, 0.5)' 
                      : '1px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: selectedCategory === category.id
                      ? '0 8px 25px rgba(16, 185, 129, 0.25)'
                      : '0 4px 15px rgba(0, 0, 0, 0.08)',
                    '& .category-icon': {
                      transform: 'scale(1.15)'
                    },
                    '& .category-text': {
                      color: selectedCategory === category.id 
                        ? 'rgba(16, 185, 129, 1)' 
                        : 'rgba(16, 185, 129, 0.8)'
                    }
                  },
                  '&:active': {
                    transform: 'translateY(0px) scale(0.98)'
                  }
                }}
              >
                <Box 
                  className="category-icon"
                  sx={{ 
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <CategoryIcon 
                    iconName={category.icon} 
                    selected={selectedCategory === category.id}
                    size="18px"
                  />
                </Box>
                <Typography 
                  className="category-text"
                  sx={{ 
                    fontSize: '0.65rem', 
                    fontWeight: selectedCategory === category.id ? 600 : 500,
                    color: selectedCategory === category.id 
                      ? 'rgba(16, 185, 129, 0.95)' 
                      : 'rgba(71, 85, 105, 0.8)',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.01em',
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
        </Box>

        {/* Minimal Section Title ตาม Category ที่เลือก */}
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
                {categories.find(cat => cat.id === selectedCategory)?.name || 'เมนูยอดนิยม'}
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

        {/* Menu Items Grid - แสดงเฉพาะอาหารที่ตรงกับ category */}
        <Box sx={{ px: 2 }}>
          {searchFilteredItems.length > 0 ? (
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
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    cursor: 'pointer',
                    animation: !isAnimating ? `fadeInUp 0.4s ease-out ${index * 0.05}s both` : 'none',
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
          ) : (
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
          )}
        </Box>
      </Box>

      {/* Footer Navigation */}
      <FooterNavbar initialValue={1} />
    </Box>
  );
}