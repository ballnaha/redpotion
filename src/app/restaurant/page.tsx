'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Paper, 
  CircularProgress, 
  Alert, 
  Avatar, 
  Button,
  useMediaQuery
} from '@mui/material';
import { 
  TrendingUp, 
  Restaurant, 
  DeliveryDining, 
  AttachMoney, 
  Store, 
  Phone, 
  Email, 
  Edit, 
  Add 
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import RestaurantProfileModal from './components/RestaurantProfileModalSimple';
import AddMenuModal from './components/AddMenuModal';

interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  status: string;
  openTime?: string;
  closeTime?: string;
  isOpen: boolean;
  minOrderAmount?: number;
  deliveryFee?: number;
  deliveryRadius?: number;
  _count: {
    categories: number;
    menuItems: number;
    orders: number;
  };
}

export default function RestaurantPage() {
  const theme = useTheme();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [addMenuModalOpen, setAddMenuModalOpen] = useState(false);

  useEffect(() => {
    if (session) {
      fetchRestaurantData();
    }
  }, [session]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/restaurant/my-restaurant');
      
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data);
      } else if (response.status === 404) {
        setError('ไม่พบข้อมูลร้านอาหาร กรุณาติดต่อผู้ดูแลระบบ');
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลร้าน');
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantUpdate = (updatedRestaurant: any) => {
    setRestaurant(updatedRestaurant);
  };

  const handleMenuAdded = () => {
    fetchRestaurantData();
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!restaurant) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          ไม่พบข้อมูลร้านอาหาร
        </Alert>
      </Box>
    );
  }

  const stats = [
    { 
      title: 'Orders Today', 
      value: '0',
      icon: <DeliveryDining />, 
      color: theme.palette.primary.main,
      change: 'Today'
    },
    { 
      title: 'Menu Items', 
      value: restaurant._count?.menuItems?.toString() || '0', 
      icon: <Restaurant />, 
      color: 'rgba(255, 149, 0, 0.85)',
      change: 'Active items'
    },
    { 
      title: 'Categories', 
      value: restaurant._count?.categories?.toString() || '0', 
      icon: <Store />, 
      color: 'rgba(52, 199, 89, 0.85)',
      change: 'Menu categories'
    },
    { 
      title: 'Total Orders', 
      value: restaurant._count?.orders?.toString() || '0', 
      icon: <TrendingUp />, 
      color: 'rgba(175, 82, 222, 0.85)',
      change: 'All time'
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Restaurant Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          gap: { xs: 2, md: 3 }, 
          mb: 3,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            width: isMobile ? '100%' : 'auto'
          }}>
            <Avatar
              src={restaurant.imageUrl || undefined}
              alt={restaurant.name}
              sx={{ 
                width: isMobile ? 60 : 80, 
                height: isMobile ? 60 : 80,
                bgcolor: theme.palette.primary.main,
                fontSize: isMobile ? '1.5rem' : '2rem'
              }}
            >
              {restaurant.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                sx={{ fontWeight: 700, mb: 1 }}
              >
                {restaurant.name}
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                ระบบจัดการร้านอาหาร
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: restaurant.isOpen ? 'success.main' : 'error.main' 
                  }} 
                />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {restaurant.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
                  {restaurant.openTime && restaurant.closeTime && 
                    ` • ${restaurant.openTime} - ${restaurant.closeTime}`
                  }
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setProfileModalOpen(true)}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              alignSelf: isMobile ? 'flex-end' : 'flex-start',
              minWidth: isMobile ? 'auto' : 'unset'
            }}
          >
            {isMobile ? 'แก้ไข' : 'แก้ไขข้อมูล'}
          </Button>
        </Box>

        {/* Restaurant Info Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexWrap: 'wrap',
          '& > *': {
            flex: { xs: '1 1 calc(100% - 4px)', sm: '1 1 200px' }
          }
        }}>
          <Card sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            backgroundColor: 'rgba(255, 255, 255, 0.1)' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 24 } }} />
              <Box>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  โทรศัพท์ : 
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontWeight: 500 , pl: 1 }}>
                  {restaurant.phone}
      </Typography>
              </Box>
            </Box>
          </Card>
          
          {restaurant.email && (
            <Card sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              backgroundColor: 'rgba(255, 255, 255, 0.1)' 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 24 } }} />
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    อีเมล
                  </Typography>
                  <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontWeight: 500 , pl: 1 }}>
                    {restaurant.email}
                  </Typography>
                </Box>
              </Box>
            </Card>
          )}

          <Card sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            flex: { xs: '1 1 100%', sm: '1 1 300px' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Store sx={{ color: theme.palette.primary.main, mt: 0.5, fontSize: { xs: 20, sm: 24 } }} />
              <Box>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  ที่อยู่
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontWeight: 500 , pl: 1 }}>
                  {restaurant.address}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)'
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 3, md: 4 }
      }}>
        {stats.map((stat, index) => (
            <Card
            key={index}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                transform: isMobile ? 'none' : 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                    width: { xs: 40, sm: 50 },
                    height: { xs: 40, sm: 50 },
                      borderRadius: 2,
                      backgroundColor: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                sx={{ fontWeight: 700, mb: 1 }}
              >
                  {stat.value}
                </Typography>
              <Typography 
                variant={isMobile ? "caption" : "body2"} 
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                  {stat.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: stat.color,
                  fontWeight: 500,
                  }}
                >
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
        ))}
      </Box>

      {/* Recent Activity */}
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 2, md: 3 }, 
        flexDirection: { xs: 'column', lg: 'row' }
      }}>
        <Box sx={{ flex: { lg: '2 1 500px' } }}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 3,
            }}
          >
            <Typography 
              variant={isMobile ? "h6" : "h6"} 
              sx={{ mb: 3, fontWeight: 500 }}
            >
              Recent Orders
            </Typography>
            {(restaurant._count?.orders || 0) > 0 ? (
              <Box sx={{ 
                p: 3,
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
              }}>
                <DeliveryDining sx={{ 
                  fontSize: { xs: 32, sm: 48 }, 
                  color: theme.palette.text.secondary, 
                  mb: 1 
                }} />
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  กำลังพัฒนาระบบแสดง Orders
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Orders ทั้งหมด: {restaurant._count?.orders || 0} รายการ
                    </Typography>
                  </Box>
            ) : (
              <Box sx={{ 
                p: 3,
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}>
                <DeliveryDining sx={{ 
                  fontSize: { xs: 32, sm: 48 }, 
                  color: theme.palette.text.secondary, 
                  mb: 1 
                }} />
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  ยังไม่มี Orders
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  เมื่อมีลูกค้าสั่งอาหาร จะแสดงที่นี่
                  </Typography>
                </Box>
            )}
          </Paper>
        </Box>

        <Box sx={{ flex: { lg: '1 1 300px' } }}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 3,
            }}
          >
            <Typography 
              variant={isMobile ? "h6" : "h6"} 
              sx={{ mb: 3, fontWeight: 500 }}
            >
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { 
                  title: 'จัดการเมนู', 
                  desc: `${restaurant._count?.menuItems || 0} รายการ • ${restaurant._count?.categories || 0} หมวดหมู่`,
                  available: true,
                  action: () => setAddMenuModalOpen(true)
                },
                { 
                  title: 'ดูรายงาน', 
                  desc: 'รายงานยอดขายและสถิติ',
                  available: false
                },
                { 
                  title: 'จัดการออร์เดอร์', 
                  desc: `${restaurant._count?.orders || 0} ออร์เดอร์ทั้งหมด`,
                  available: false
                },
                { 
                  title: 'ตั้งค่าร้าน', 
                  desc: 'แก้ไขข้อมูลร้านอาหาร',
                  available: true,
                  action: () => setProfileModalOpen(true)
                },
              ].map((action, index) => (
                <Box 
                  key={index}
                  onClick={action.available && action.action ? action.action : undefined}
                  sx={{ 
                    p: { xs: 1.5, sm: 2 },
                    backgroundColor: action.available 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    cursor: action.available ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    opacity: action.available ? 1 : 0.6,
                    '&:hover': action.available ? {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      transform: isMobile ? 'none' : 'translateX(4px)',
                    } : {},
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant={isMobile ? "body2" : "body1"} 
                        sx={{ fontWeight: 500, mb: 0.5 }}
                      >
                    {action.title}
                  </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        sx={{ color: theme.palette.text.secondary }}
                      >
                    {action.desc}
                  </Typography>
                    </Box>
                    {!action.available && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          color: theme.palette.text.secondary,
                          fontSize: isMobile ? '0.7rem' : '0.75rem'
                        }}
                      >
                        เร็วๆ นี้
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Modals */}
      <RestaurantProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        restaurant={restaurant}
        onUpdate={handleRestaurantUpdate}
      />

      <AddMenuModal
        open={addMenuModalOpen}
        onClose={() => setAddMenuModalOpen(false)}
        onSuccess={handleMenuAdded}
        restaurantId={restaurant?.id}
      />
    </Box>
  );
} 