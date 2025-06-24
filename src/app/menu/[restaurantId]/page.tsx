'use client';

import { useRestaurant } from './context/RestaurantContext';
import { useState } from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Button, Chip, 
         CircularProgress, Alert, Container, AppBar, Toolbar, 
         Badge, IconButton, Drawer, List, ListItem, ListItemText,
         ListItemSecondaryAction, ButtonGroup } from '@mui/material';
import { ShoppingCart, Add, Remove, Delete, Favorite, FavoriteBorder,
         Phone, AccessTime, LocationOn } from '@mui/icons-material';

export default function CustomerMenuPage() {
  const { restaurant, loading, error, cart, cartTotal, addToCart, 
          removeFromCart, updateCartItemQuantity } = useRestaurant();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>กำลังโหลดเมนู...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error" variant="filled">
          <Typography variant="h6">เกิดข้อผิดพลาด</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Container>
    );
  }

  if (!restaurant) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">ไม่พบข้อมูลร้านอาหาร</Alert>
      </Container>
    );
  }

  return (
    <>
      {/* App Bar */}
      <AppBar position="sticky" sx={{ bgcolor: restaurant.theme.primaryColor }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {restaurant.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {restaurant.description}
            </Typography>
          </Box>
          <IconButton 
            color="inherit" 
            onClick={() => setCartDrawerOpen(true)}
            sx={{ position: 'relative' }}
          >
            <Badge badgeContent={cart.length} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Restaurant Header */}
      <Box 
        sx={{ 
          backgroundImage: `url(${restaurant.banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: 200,
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            color: 'white',
            p: 2
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            {restaurant.name}
          </Typography>
          <Box display="flex" gap={2} mt={1}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Phone fontSize="small" />
              <Typography variant="body2">{restaurant.contact.phone}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTime fontSize="small" />
              <Typography variant="body2">{restaurant.contact.hours}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Menu Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {restaurant.menu.map((category) => (
          <Box key={category.id} sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom 
              sx={{ 
                color: restaurant.theme.primaryColor,
                fontWeight: 'bold',
                borderBottom: `2px solid ${restaurant.theme.primaryColor}`,
                pb: 1,
                mb: 3
              }}
            >
              {category.name}
            </Typography>
            
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)' 
                },
                gap: 3
              }}
            >
              {category.items.map((item) => {
                const quantityInCart = getItemQuantityInCart(item.id);
                const isFavorite = favorites.includes(item.id);
                
                return (
                  <Box key={item.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' },
                        border: item.isRecommended ? `2px solid ${restaurant.theme.primaryColor}` : 'none'
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={item.image}
                          alt={item.name}
                        />
                        {item.isRecommended && (
                          <Chip
                            label="แนะนำ"
                            color="primary"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: restaurant.theme.primaryColor
                            }}
                          />
                        )}
                        <IconButton
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                          }}
                          onClick={() => toggleFavorite(item.id)}
                        >
                          {isFavorite ? 
                            <Favorite sx={{ color: '#e53e3e' }} /> : 
                            <FavoriteBorder />
                          }
                        </IconButton>
                        
                        {!item.available && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography variant="h6" color="white">
                              หมด
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {item.description}
                        </Typography>
                        
                        {/* Tags */}
                        <Box sx={{ mb: 2 }}>
                          {item.tags?.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                        
                        {/* Price */}
                        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                          <Typography 
                            variant="h6" 
                            color="primary" 
                            fontWeight="bold"
                            sx={{ color: restaurant.theme.primaryColor }}
                          >
                            ฿{item.price}
                          </Typography>
                          {item.originalPrice && (
                            <Typography 
                              variant="body2" 
                              sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                            >
                              ฿{item.originalPrice}
                            </Typography>
                          )}
                          <Chip
                            label={`${item.cookingTime} นาที`}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                        
                        {/* Add to Cart */}
                        <Box>
                          {quantityInCart === 0 ? (
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => addToCart(item)}
                              disabled={!item.available}
                              sx={{ 
                                bgcolor: restaurant.theme.primaryColor,
                                '&:hover': { bgcolor: restaurant.theme.secondaryColor }
                              }}
                            >
                              เพิ่มในตะกร้า
                            </Button>
                          ) : (
                            <ButtonGroup fullWidth variant="outlined">
                              <Button
                                onClick={() => updateCartItemQuantity(item.id, quantityInCart - 1)}
                                sx={{ minWidth: '40px' }}
                              >
                                <Remove />
                              </Button>
                              <Button disabled sx={{ flexGrow: 1 }}>
                                {quantityInCart}
                              </Button>
                              <Button
                                onClick={() => updateCartItemQuantity(item.id, quantityInCart + 1)}
                                sx={{ minWidth: '40px' }}
                              >
                                <Add />
                              </Button>
                            </ButtonGroup>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Container>

      {/* Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            ตะกร้าสินค้า ({cart.length} รายการ)
          </Typography>
          
          {cart.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              ตะกร้าของคุณยังว่างอยู่
            </Typography>
          ) : (
            <>
              <List>
                {cart.map((item) => (
                  <ListItem key={item.itemId} divider>
                    <ListItemText
                      primary={item.name}
                      secondary={`฿${item.price} x ${item.quantity}`}
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ButtonGroup size="small">
                          <Button
                            onClick={() => updateCartItemQuantity(item.itemId, item.quantity - 1)}
                          >
                            <Remove fontSize="small" />
                          </Button>
                          <Button disabled>{item.quantity}</Button>
                          <Button
                            onClick={() => updateCartItemQuantity(item.itemId, item.quantity + 1)}
                          >
                            <Add fontSize="small" />
                          </Button>
                        </ButtonGroup>
                        <IconButton
                          onClick={() => removeFromCart(item.itemId)}
                          color="error"
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" textAlign="center">
                  ยอดรวม: ฿{cartTotal.toLocaleString()}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ 
                    mt: 2,
                    bgcolor: restaurant.theme.primaryColor,
                    '&:hover': { bgcolor: restaurant.theme.secondaryColor }
                  }}
                >
                  สั่งอาหาร
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <Button
            variant="contained"
            onClick={() => setCartDrawerOpen(true)}
            sx={{
              bgcolor: restaurant.theme.primaryColor,
              '&:hover': { bgcolor: restaurant.theme.secondaryColor },
              borderRadius: '25px',
              px: 3,
              py: 1.5,
              boxShadow: 3
            }}
            startIcon={
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCart />
              </Badge>
            }
          >
            ฿{cartTotal.toLocaleString()}
          </Button>
        </Box>
      )}
    </>
  );
} 