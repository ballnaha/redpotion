'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Container,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Restaurant,
  ArrowBack,
  LocationOn,
  Phone,
  AccessTime
} from '@mui/icons-material';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  imageUrl?: string;
  status: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('/api/restaurant');
        if (response.ok) {
          const data = await response.json();
          setRestaurants(data);
        } else {
          setError('ไม่สามารถโหลดรายการร้านอาหารได้');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const handleRestaurantClick = (restaurantId: string) => {
    router.push(`/menu/${restaurantId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'เปิดให้บริการ';
      case 'PENDING':
        return 'รอการอนุมัติ';
      case 'REJECTED':
        return 'ไม่ได้รับอนุมัติ';
      case 'SUSPENDED':
        return 'ระงับการใช้งาน';
      case 'CLOSED':
        return 'ปิดชั่วคราว';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress sx={{ color: '#10B981' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ 
        bgcolor: 'white', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Container maxWidth="md">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            py: 2,
            gap: 2
          }}>
            <IconButton onClick={() => router.back()}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ร้านอาหารทั้งหมด
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 3 }}>
        {restaurants.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Restaurant sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
              ไม่พบร้านอาหาร
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              ยังไม่มีร้านอาหารในระบบ
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant.id)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex' }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 120, height: 120, objectFit: 'cover' }}
                    image={restaurant.imageUrl || '/images/default_restaurant.jpg'}
                    alt={restaurant.name}
                  />
                  <CardContent sx={{ flex: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {restaurant.name}
                      </Typography>
                      <Chip
                        label={getStatusText(restaurant.status)}
                        color={getStatusColor(restaurant.status) as any}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>
                    
                    {restaurant.description && (
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                        {restaurant.description}
                      </Typography>
                    )}
                    
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {restaurant.address}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {restaurant.phone}
                        </Typography>
                      </Box>
                      
                      {restaurant.openTime && restaurant.closeTime && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 16, color: '#94a3b8' }} />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {restaurant.openTime} - {restaurant.closeTime}
                          </Typography>
                          <Chip
                            label={restaurant.isOpen ? 'เปิด' : 'ปิด'}
                            color={restaurant.isOpen ? 'success' : 'default'}
                            size="small"
                            sx={{ fontSize: '0.7rem', ml: 1 }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
} 