'use client';

import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip,
  IconButton,
  Button,
  Paper,
  Avatar,
  Rating,
  Badge
} from '@mui/material';
import { 
  Star,
  AccessTime,
  Add,
  LocationOn,
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  NotificationsNone,
  Search
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRestaurant } from './context/RestaurantContext';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';

export default function RestaurantSitePage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const theme = useTheme();
  // Unwrap the params Promise using React.use()
  const { restaurantId } = use(params);
  const { restaurant, loading, error } = useRestaurant();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug info - only log on client side
  useEffect(() => {
    if (mounted) {
      console.log('RestaurantSitePage: restaurantId =', restaurantId);
      console.log('RestaurantSitePage: restaurant =', restaurant);
      console.log('RestaurantSitePage: loading =', loading);
      console.log('RestaurantSitePage: error =', error);
    }
  }, [mounted, restaurantId, restaurant, loading, error]);

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return newFavorites;
    });
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#ffffff',
      }}>
        <Typography>กำลังโหลด...</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#ffffff',
      }}>
        <Typography>กำลังโหลดเมนู...</Typography>
      </Box>
    );
  }

  if (error || !restaurant) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            maxWidth: 400,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            เกิดข้อผิดพลาด
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {error || 'ไม่พบร้านอาหารที่คุณต้องการ'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Restaurant ID: {restaurantId}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, 
          rgba(255, 255, 255, 0.95) 0%,
          rgba(248, 250, 252, 0.9) 50%,
          rgba(241, 245, 249, 0.85) 100%
        )
      `,
      position: 'relative',
      // Hide scrollbar
      '& ::-webkit-scrollbar': {
        display: 'none',
      },
      '& *': {
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 50%)
        `,
        zIndex: 0,
      }
    }}>
      {/* Fixed Header */}
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 8px rgba(31, 38, 135, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        pt: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32,
            background: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <Image 
              src={restaurant.logo}
              width={32}
              height={32}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              alt={restaurant.name}
            />
          </Avatar>
          <Box>
            <Typography variant="caption" sx={{ 
              color: 'rgba(0, 0, 0, 0.6)', 
              fontSize: '0.7rem',
              fontWeight: 500,
            }}>
              Order from
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                fontSize: '0.85rem',
                color: 'rgba(0, 0, 0, 0.9)',
              }}>
                {restaurant.name}
              </Typography>
              <LocationOn sx={{ 
                fontSize: 12, 
                color: theme.palette.primary.main,
              }} />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[Search, NotificationsNone, ShoppingCart].map((Icon, index) => (
            <IconButton 
              key={index}
              size="small" 
              sx={{ 
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&:hover': { 
                  background: 'rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <Icon sx={{ fontSize: 20, color: 'rgba(0, 0, 0, 0.7)' }} />
              {index === 2 && getCartCount() > 0 && (
                <Badge 
                  badgeContent={getCartCount()} 
                  color="error"
                  sx={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      minWidth: 16,
                      height: 16,
                      backgroundColor: theme.palette.primary.main
                    }
                  }}
                />
              )}
            </IconButton>
          ))}
        </Box>
      </Box>

      {/* Scrollable Body Content */}
      <Box sx={{ 
        pt: '80px',
        width: '100%',
        overflowX: 'hidden',
        position: 'relative',
        zIndex: 1,
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        px: 2,
        pb: 2
      }}>
        {/* Debug Banner - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <Paper sx={{ 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.main}80)`, 
            color: 'white', 
            p: 2, 
            mb: 3,
            borderRadius: '12px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
          }}>
            <Typography variant="caption">
              🔧 DEBUG: Restaurant ID = {restaurantId} | Restaurant Name = {restaurant.name} | Using Customer Theme = {theme.palette.primary.main}
            </Typography>
          </Paper>
        )}

        {/* Restaurant Banner */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 180,
            overflow: 'hidden',
            borderRadius: '16px',
            mb: 3,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${restaurant.banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {restaurant.name}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {restaurant.description}
            </Typography>
          </Box>
        </Box>

        {/* Restaurant Info Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Paper
            sx={{
              flex: 1,
              minWidth: '150px',
              p: 2,
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}
          >
            <Star sx={{ color: '#ffa726', fontSize: 24, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              4.8
            </Typography>
            <Typography variant="caption" color="text.secondary">
              324 รีวิว
            </Typography>
          </Paper>

          <Paper
            sx={{
              flex: 1,
              minWidth: '150px',
              p: 2,
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}
          >
            <AccessTime sx={{ color: theme.palette.primary.main, fontSize: 24, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              15-25
            </Typography>
            <Typography variant="caption" color="text.secondary">
              นาที
            </Typography>
          </Paper>

          <Paper
            sx={{
              flex: 1,
              minWidth: '150px',
              p: 2,
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}
          >
            <LocationOn sx={{ color: theme.palette.primary.main, fontSize: 24, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              1.2
            </Typography>
            <Typography variant="caption" color="text.secondary">
              กิโลเมตร
            </Typography>
          </Paper>
        </Box>

        {/* Promo Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip 
            label="ส่งฟรี" 
            size="small" 
            sx={{ 
              backgroundColor: `${theme.palette.primary.main}15`,
              color: theme.palette.primary.main,
              fontWeight: 600,
              border: `1px solid ${theme.palette.primary.main}40`
            }} 
          />
          <Chip 
            label="โปรโมชัน" 
            size="small" 
            sx={{ 
              backgroundColor: '#f59e0b15',
              color: '#f59e0b',
              fontWeight: 600,
              border: '1px solid #f59e0b40'
            }} 
          />
          <Chip 
            label="เมนูยอดฮิต" 
            size="small" 
            sx={{ 
              backgroundColor: '#8b5cf615',
              color: '#8b5cf6',
              fontWeight: 600,
              border: '1px solid #8b5cf640'
            }} 
          />
        </Box>

        {/* Menu by Categories */}
        {restaurant.menu.map((category, categoryIndex) => (
          <Box key={category.id} sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                mb: 3,
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${theme.palette.primary.main}20`,
                paddingBottom: 1,
                display: 'inline-block'
              }}
            >
              {category.name}
            </Typography>

            {/* Items Grid for this category */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2
            }}>
              {category.items.map((item, index) => (
                <Card
                  key={item.id}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.image}
                      alt={item.name}
                      sx={{
                        filter: 'brightness(0.95)',
                      }}
                    />
                    
                    {/* Favorite Button */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        width: 32,
                        height: 32,
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                    >
                      {favorites.has(item.id) ? 
                        <Favorite sx={{ color: theme.palette.primary.main, fontSize: 18 }} /> : 
                        <FavoriteBorder sx={{ color: 'text.secondary', fontSize: 18 }} />
                      }
                    </IconButton>

                    {/* Badges */}
                    <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <Chip
                          label={`-${Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%`}
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      )}

                      {item.isRecommended && (
                        <Chip
                          label="แนะนำ"
                          size="small"
                          sx={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3, fontSize: '1rem' }}>
                      {item.name}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2, lineHeight: 1.4, minHeight: '32px', fontSize: '0.85rem' }}
                    >
                      {item.description}
                    </Typography>

                    {/* Tags */}
                    {item.tags && (
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                        {item.tags.slice(0, 2).map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 18,
                              borderColor: `${theme.palette.primary.main}40`,
                              color: theme.palette.primary.main
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={4.5} precision={0.1} size="small" readOnly />
                      <Typography variant="caption" color="text.secondary">
                        (4.5)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                        <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {item.cookingTime} นาที
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              textDecoration: 'line-through', 
                              color: 'text.secondary',
                              mr: 1,
                              fontSize: '0.75rem'
                            }}
                          >
                            ฿{item.originalPrice}
                          </Typography>
                        )}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                            fontSize: '1.1rem'
                          }}
                        >
                          ฿{item.price}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add sx={{ fontSize: 16 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item.id);
                        }}
                        disabled={!item.available}
                        sx={{
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.8rem',
                          minWidth: 'auto',
                          '&:hover': {
                            backgroundColor: `${theme.palette.primary.main}dd`,
                          },
                          '&:disabled': {
                            backgroundColor: 'grey.300',
                            color: 'grey.500'
                          }
                        }}
                      >
                        {item.available ? 'เพิ่ม' : 'หมด'}
                      </Button>
                    </Box>

                    {cart[item.id] && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          mt: 1,
                          display: 'block',
                          fontSize: '0.75rem'
                        }}
                      >
                        ✓ เพิ่มในตะกร้าแล้ว ({cart[item.id]} ชิ้น)
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
} 