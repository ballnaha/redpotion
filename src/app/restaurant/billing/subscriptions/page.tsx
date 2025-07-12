'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Star,
  AllInclusive,
  Warning,
  Info,
  AttachMoney,
  CalendarToday,
  TrendingUp
} from '@mui/icons-material';
import { useNotification } from '../../../../contexts/NotificationContext';

interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  planType: 'MONTHLY' | 'YEARLY';
  duration: number;
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  features: string[];
  isActive: boolean;
}

interface RestaurantInfo {
  id: string;
  name: string;
  subscriptionType: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  liffExpiresAt?: string;
  isLiffActive: boolean;
  daysUntilExpiry?: number;
  isExpired: boolean;
  isNearExpiry: boolean;
}

interface PricingData {
  pricingPlans: {
    MONTHLY: PricingPlan[];
    YEARLY: PricingPlan[];
  };
  restaurant: RestaurantInfo;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export default function SubscriptionsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  // SWR for pricing data
  const { 
    data: pricingData, 
    error, 
    isLoading 
  } = useSWR<PricingData>(
    sessionStatus === 'authenticated' && session?.user?.role === 'RESTAURANT_OWNER' 
      ? '/api/restaurant/pricing' 
      : null, 
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60 * 1000,
    }
  );

  // Dialog state
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Redirect if not restaurant owner
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (sessionStatus === 'unauthenticated') {
      router.replace('/auth/signin');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER') {
      router.replace('/');
    }
  }, [sessionStatus, session?.user?.role, router]);

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedPlan(null);
    setOpenDialog(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionStatusColor = (restaurant: RestaurantInfo) => {
    if (restaurant.isExpired) return 'error';
    if (restaurant.isNearExpiry) return 'warning';
    return 'success';
  };

  const getSubscriptionStatusText = (restaurant: RestaurantInfo) => {
    if (restaurant.isExpired) return 'หมดอายุแล้ว';
    if (restaurant.isNearExpiry) return `ใกล้หมดอายุ (${restaurant.daysUntilExpiry} วัน)`;
    return 'ใช้งานได้';
  };

  const getPlanTypeIcon = (planType: string) => {
    switch (planType) {
      case 'MONTHLY': return <CalendarToday />;
      case 'YEARLY': return <TrendingUp />;
      default: return <Star />;
    }
  };

  const getPlanTypeLabel = (planType: string) => {
    switch (planType) {
      case 'MONTHLY': return 'รายเดือน';
      case 'YEARLY': return 'รายปี';
      default: return planType;
    }
  };

  // Show loading while session is loading
  if (sessionStatus === 'loading') {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
        </Typography>
      </Box>
    );
  }

  // Don't render if not authenticated or wrong role
  if (sessionStatus !== 'authenticated' || !session?.user || session.user.role !== 'RESTAURANT_OWNER') {
    return null;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        เกิดข้อผิดพลาดในการดึงข้อมูล: {error.message}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '40vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          กำลังโหลดข้อมูลแผนการสมัครสมาชิก...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Current Subscription Status */}
      {pricingData?.restaurant && (
        <Card sx={{ 
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              สถานะการสมัครสมาชิกปัจจุบัน
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  ประเภทการสมัครสมาชิก
                </Typography>
                <Chip 
                  label={pricingData.restaurant.subscriptionType || 'FREE'} 
                  color={pricingData.restaurant.subscriptionType === 'FREE' ? 'default' : 'primary'}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  สถานะ
                </Typography>
                <Chip 
                  label={getSubscriptionStatusText(pricingData.restaurant)}
                  color={getSubscriptionStatusColor(pricingData.restaurant)}
                  icon={pricingData.restaurant.isExpired ? <Warning /> : <CheckCircle />}
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  วันที่เริ่มสมาชิก
                </Typography>
                <Typography variant="body2">
                  {formatDate(pricingData.restaurant.subscriptionStartDate)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  วันที่หมดอายุ
                </Typography>
                <Typography variant="body2">
                  {formatDate(pricingData.restaurant.subscriptionEndDate || pricingData.restaurant.liffExpiresAt)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Warning for expired/near expiry */}
      {pricingData?.restaurant && (pricingData.restaurant.isExpired || pricingData.restaurant.isNearExpiry) && (
        <Alert 
          severity={pricingData.restaurant.isExpired ? 'error' : 'warning'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {pricingData.restaurant.isExpired ? 'การสมัครสมาชิกหมดอายุแล้ว' : 'การสมัครสมาชิกใกล้หมดอายุ'}
          </Typography>
          <Typography variant="body2">
            {pricingData.restaurant.isExpired 
              ? 'กรุณาต่ออายุการสมัครสมาชิกเพื่อใช้งานต่อไป' 
              : `การสมัครสมาชิกจะหมดอายุใน ${pricingData.restaurant.daysUntilExpiry} วัน`
            }
          </Typography>
        </Alert>
      )}

      {/* Monthly Plans */}
      {pricingData?.pricingPlans.MONTHLY && pricingData.pricingPlans.MONTHLY.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            แผนรายเดือน
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
            gap: 3 
          }}>
            {pricingData.pricingPlans.MONTHLY.map((plan) => (
              <Card 
                key={plan.id}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  }
                }}
                onClick={() => handleSelectPlan(plan)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getPlanTypeIcon(plan.planType)}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {plan.name}
                    </Typography>
                  </Box>
                  
                  {plan.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatPrice(plan.finalPrice)}
                    </Typography>
                    {plan.discountPercent > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                        >
                          {formatPrice(plan.originalPrice)}
                        </Typography>
                        <Chip 
                          label={`ประหยัด ${plan.discountPercent}%`} 
                          size="small" 
                          color="success"
                        />
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      สำหรับ {plan.duration} เดือน
                    </Typography>
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleSelectPlan(plan)}
                  >
                    เลือกแผนนี้
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Yearly Plans */}
      {pricingData?.pricingPlans.YEARLY && pricingData.pricingPlans.YEARLY.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            แผนรายปี
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
            gap: 3 
          }}>
            {pricingData.pricingPlans.YEARLY.map((plan) => (
              <Card 
                key={plan.id}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  border: plan.discountPercent >= 30 ? '2px solid' : '1px solid',
                  borderColor: plan.discountPercent >= 30 ? 'primary.main' : 'rgba(255, 255, 255, 0.18)',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  }
                }}
                onClick={() => handleSelectPlan(plan)}
              >
                {plan.discountPercent >= 30 && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -1, 
                    right: 16, 
                    backgroundColor: 'primary.main', 
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: '0 0 8px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    แนะนำ
                  </Box>
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getPlanTypeIcon(plan.planType)}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {plan.name}
                    </Typography>
                  </Box>
                  
                  {plan.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatPrice(plan.finalPrice)}
                    </Typography>
                    {plan.discountPercent > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                        >
                          {formatPrice(plan.originalPrice)}
                        </Typography>
                        <Chip 
                          label={`ประหยัด ${plan.discountPercent}%`} 
                          size="small" 
                          color="success"
                        />
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      สำหรับ {plan.duration} ปี
                    </Typography>
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleSelectPlan(plan)}
                  >
                    เลือกแผนนี้
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* No plans available */}
      {(!pricingData?.pricingPlans.MONTHLY?.length && !pricingData?.pricingPlans.YEARLY?.length) && (
        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            ไม่มีแผนการสมัครสมาชิกที่ใช้งานได้
          </Typography>
          <Typography variant="body2">
            กรุณาติดต่อผู้ดูแลระบบเพื่อขอข้อมูลเพิ่มเติม
          </Typography>
        </Alert>
      )}

      {/* Plan Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedPlan && getPlanTypeIcon(selectedPlan.planType)}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedPlan?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedPlan.description}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  {formatPrice(selectedPlan.finalPrice)}
                </Typography>
                {selectedPlan.discountPercent > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                    >
                      {formatPrice(selectedPlan.originalPrice)}
                    </Typography>
                    <Chip 
                      label={`ประหยัด ${selectedPlan.discountPercent}%`} 
                      color="success"
                    />
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  สำหรับ {selectedPlan.duration} {selectedPlan.planType === 'MONTHLY' ? 'เดือน' : 'ปี'}
                </Typography>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ฟีเจอร์ที่ได้รับ:
              </Typography>
              <List>
                {selectedPlan.features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            ปิด
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // TODO: Implement subscription process
              showSuccess('ฟีเจอร์การสมัครสมาชิกจะเปิดให้ใช้งานเร็วๆ นี้');
              handleCloseDialog();
            }}
          >
            เริ่มการสมัครสมาชิก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 