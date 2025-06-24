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
// Removed Swiper imports as we're using single banner now

interface Banner {
  title: string;
  subtitle: string;
  date: string;
  image: string;
  color: string;
}

export default function CustomerMenuPage() {
  const router = useRouter();
  const { restaurant, loading, error, cart, cartTotal, addToCart, 
          removeFromCart, updateCartItemQuantity } = useRestaurant();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [bottomValue, setBottomValue] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Quick categories for filter
  const quickCategories = [
    { id: 'all', name: 'ทั้งหมด', icon: Category },
    { id: 'southern', name: 'อาหารใต้', icon: Restaurant },
    { id: 'sushi', name: 'ซูชิ', icon: LocalPizza },
    { id: 'isaan', name: 'อีสาน', icon: RamenDining },
  ];

  // สร้าง banner ตามข้อมูลร้าน
  const getBanner = () => {
    if (!restaurant) return null;
    
    return {
      title: '30%',
      subtitle: 'ส่วนลดพิเศษ',
      date: 'วันนี้เท่านั้น!',
      image: restaurant.banner || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
      color: restaurant.theme.primaryColor || '#10B981'
    };
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
          {getBanner() && (
            <Card 
              sx={{ 
                background: `linear-gradient(135deg, ${getBanner()!.color} 0%, ${getBanner()!.color}CC 100%)`,
                borderRadius: '16px',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                overflow: 'hidden',
                position: 'relative',
                minHeight: '140px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 70%)',
                  opacity: 0.8
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, flex: 1 }}>
                <Typography 
                  sx={{ 
                    color: 'white',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    fontWeight: 900,
                    mb: 0.5,
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    lineHeight: 1
                  }}
                >
                  {getBanner()!.title}
                </Typography>
                <Typography 
                  sx={{ 
                    color: 'white',
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    fontWeight: 700,
                    mb: 0.5,
                    textShadow: '0 1px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {getBanner()!.subtitle}
                </Typography>
                <Typography 
                  sx={{ 
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 600,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {getBanner()!.date}
                </Typography>
              </Box>
              <Box 
                component="img"
                src={getBanner()!.image}
                alt={getBanner()!.title}
                sx={{ 
                  height: 100,
                  width: 100,
                  objectFit: 'cover',
                  borderRadius: '12px',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
                  flexShrink: 0
                }}
              />
            </Card>
          )}
        </Box>

        {/* Categories */}
        <Box sx={{ mb: 4 }}>
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 2,
              mb: 3
            }}
          >
            {[
              { name: 'Hamburger', icon: '🍔' },
              { name: 'Pizza', icon: '🍕' },
              { name: 'Noodles', icon: '🍜' },
              { name: 'Meat', icon: '🥩' },
              { name: 'Vegetable', icon: '🥬' },
              { name: 'Dessert', icon: '🍰' },
              { name: 'Drink', icon: '🥤' },
              { name: 'More', icon: '⋯' }
            ].map((category) => (
              <Box 
                key={category.name}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 2
                }}
              >
                <Box 
                  sx={{ 
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
                    }
                  }}
                >
                  {category.icon}
                </Box>
                <Typography 
                  sx={{ 
                    color: '#111827',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textAlign: 'center'
                  }}
                >
                  {category.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Discount Guaranteed Section */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#111827',
                  fontWeight: 700,
                  fontSize: '1.25rem'
                }}
              >
                Discount Guaranteed!
              </Typography>
              <Typography sx={{ fontSize: '1.25rem' }}>👌</Typography>
            </Box>
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

          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)' },
              gap: 2
            }}
          >
            {[
              {
                name: 'Quinoa Power Bowl',
                price: 189,
                originalPrice: 220,
                image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
                discount: '15%',
                tag: 'PROMO'
              },
              {
                name: 'Green Detox Smoothie',
                price: 89,
                originalPrice: 110,
                image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=300&q=80',
                discount: '20%',
                tag: 'PROMO'
              }
            ].map((item) => (
              <Card
                key={item.name}
                onClick={() => window.location.href = `/menu/${restaurant.id}/item/healthy-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
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
                {/* Promo Tag */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: '#10B981',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: '6px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    zIndex: 1
                  }}
                >
                  {item.tag}
                </Box>
                
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
                    <Typography 
                      sx={{ 
                        color: '#9CA3AF',
                        fontSize: '0.875rem',
                        textDecoration: 'line-through'
                      }}
                    >
                      ฿{item.originalPrice}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Best Sellers */}
        <Box mb={3}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={2}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#111827',
                fontWeight: 700,
                fontSize: { xs: '1.125rem', sm: '1.25rem' }
              }}
            >
              Best Sellers
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

          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2
            }}
          >
            {[
              {
                name: 'Grilled Salmon Bowl',
                price: 259,
                image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=300&q=80',
                tag: 'PROMO'
              },
              {
                name: 'Avocado Toast Bowl',
                price: 149,
                image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&q=80',
                tag: 'PROMO'
              }
            ].map((item) => (
                    <Card
                key={item.name}
                      onClick={() => window.location.href = `/menu/${restaurant.id}/item/healthy-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
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
                        {/* Promo Tag */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            background: '#10B981',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: '6px',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            zIndex: 1
                          }}
                        >
                          {item.tag}
                        </Box>
                        
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
                              <Typography 
                                sx={{ 
                      color: '#10B981',
                      fontWeight: 700,
                      fontSize: '1rem'
                                }}
                              >
                    ฿{item.price}
                              </Typography>
                      </CardContent>
                    </Card>
            ))}
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