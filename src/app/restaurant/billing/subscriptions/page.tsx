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
  Grid,
  Stack,
  Fade,
  Skeleton
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
  TrendingUp,
  Check
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
  isPopular?: boolean;
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

  // แปลงฟีเจอร์เป็นภาษาไทยให้เข้าใจง่าย
  const translateFeature = (feature: string) => {
    const translations: { [key: string]: string } = {
      'Unlimited requests & revisions': 'คำขอและการแก้ไขไม่จำกัด',
      'up to 1 meeting per week': 'ประชุมได้สูงสุด 1 ครั้งต่อสัปดาห์',
      'Avg. 2-3 days delivery': 'ส่งมอบเฉลี่ย 2-3 วัน',
      'Dev ready Figma files': 'ไฟล์ Figma พร้อมใช้งาน',
      'Figma Prototypes': 'ต้นแบบ Figma',
      'Unlimited users': 'ผู้ใช้ไม่จำกัด',
      'Slack Collaboration': 'ทำงานร่วมกันผ่าน Slack',
      'Own project board': 'บอร์ดโปรเจกต์เฉพาะ',
      'Two-week design sprint': 'การออกแบบแบบเร่งด่วน 2 สัปดาห์',
      'One request at a time': 'คำขอทีละ 1 รายการ',
      'Two requests at a time': 'คำขอทีละ 2 รายการ',
      'Flexible weekly meetings': 'ประชุมประจำสัปดาห์แบบยืดหยุ่น'
    };
    return translations[feature] || feature;
  };

  // แปลงรายละเอียดแผนให้เป็นภาษาไทย
  const translatePlanDetails = (name: string, description?: string) => {
    const planTranslations: { [key: string]: { name: string; description: string } } = {
      'Sprint': {
        name: 'แผนเริ่มต้น',
        description: 'เหมาะสำหรับร้านอาหารขนาดเล็กที่ต้องการเริ่มต้นใช้งาน'
      },
      'Flip': {
        name: 'แผนยอดนิยม',
        description: 'เหมาะสำหรับร้านอาหารที่กำลังเติบโตและต้องการฟีเจอร์ครบครัน'
      },
      'Double Flip': {
        name: 'แผนธุรกิจ',
        description: 'เหมาะสำหรับร้านอาหารขนาดใหญ่และต้องการบริการสูงสุด'
      }
    };
    
    return {
      name: planTranslations[name]?.name || name,
      description: planTranslations[name]?.description || description || ''
    };
  };

  // กำหนดแผนที่เป็นยอดนิยม
  const addPopularFlag = (plans: PricingPlan[]) => {
    return plans.map((plan, index) => ({
      ...plan,
      isPopular: plan.name === 'Flip' || (plans.length > 1 && index === 1) // แผนกลางหรือ Flip
    }));
  };

  // Loading state เมื่อยังไม่ได้ authenticate
  if (sessionStatus === 'loading') {
    return (
      <Fade in={true}>
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
            กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
          </Typography>
        </Box>
      </Fade>
    );
  }

  // Don't render if not authenticated or wrong role
  if (sessionStatus !== 'authenticated' || !session?.user || session.user.role !== 'RESTAURANT_OWNER') {
    return null;
  }

  if (error) {
    return (
      <Fade in={true}>
        <Alert severity="error" sx={{ mb: 3 }}>
          เกิดข้อผิดพลาดในการดึงข้อมูล: {error.message}
        </Alert>
      </Fade>
    );
  }

  if (isLoading) {
    return (
      <Fade in={true}>
        <Box>
          {/* Header Skeleton */}
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Skeleton variant="text" width="60%" height={60} sx={{ mx: 'auto', mb: 2 }} />
          </Box>

          {/* Status Card Skeleton */}
          <Card sx={{ 
            mb: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <CardContent>
              <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                {[...Array(4)].map((_, i) => (
                  <Box key={i}>
                    <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" width="60%" height={32} sx={{ borderRadius: 1 }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Monthly Plans Skeleton */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="text" width="30%" height={40} />
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
              gap: 3,
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {[...Array(3)].map((_, i) => (
                <Card key={i} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Skeleton variant="text" width="70%" height={40} sx={{ mx: 'auto', mb: 1 }} />
                    <Skeleton variant="text" width="90%" height={24} sx={{ mx: 'auto', mb: 3 }} />
                    <Skeleton variant="text" width="50%" height={60} sx={{ mx: 'auto', mb: 4 }} />
                    <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2, mb: 3 }} />
                    
                    {[...Array(5)].map((_, j) => (
                      <Box key={j} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
                        <Skeleton variant="text" width="80%" height={24} />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Yearly Plans Skeleton */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="text" width="30%" height={40} />
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
              gap: 3,
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {[...Array(3)].map((_, i) => (
                <Card key={i} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Skeleton variant="text" width="70%" height={40} sx={{ mx: 'auto', mb: 1 }} />
                    <Skeleton variant="text" width="90%" height={24} sx={{ mx: 'auto', mb: 3 }} />
                    <Skeleton variant="text" width="50%" height={60} sx={{ mx: 'auto', mb: 4 }} />
                    <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2, mb: 3 }} />
                    
                    {[...Array(5)].map((_, j) => (
                      <Box key={j} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
                        <Skeleton variant="text" width="80%" height={24} />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </Box>
      </Fade>
    );
  }

  // แยกแผนตามประเภท และเพิ่ม popular flag
  const monthlyPlansWithPopular = addPopularFlag(pricingData?.pricingPlans.MONTHLY || []);
  const yearlyPlansWithPopular = addPopularFlag(pricingData?.pricingPlans.YEARLY || []);

  return (
    <Fade in={true}>
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

        {/* Header */}
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 5, 
            fontWeight: 700, 
            textAlign: 'center',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          เลือกแผนที่เหมาะกับคุณ
        </Typography>

        {/* Monthly Plans */}
        {monthlyPlansWithPopular.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ 
              mb: 3, 
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CalendarToday sx={{ color: '#2196F3' }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  color: '#1a1a1a'
                }}
              >
                แผนรายเดือน
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                md: monthlyPlansWithPopular.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' 
              }, 
              gap: 3,
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {monthlyPlansWithPopular.map((plan: PricingPlan, index: number) => {
                const planDetails = translatePlanDetails(plan.name, plan.description);
                const isPopular = plan.isPopular;
                
                return (
                  <Card 
                    key={plan.id}
                    sx={{ 
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      border: isPopular ? '3px solid' : '2px solid',
                      borderColor: isPopular ? '#8B5CF6' : 'rgba(0, 0, 0, 0.12)',
                      borderRadius: 3,
                      transform: isPopular ? 'scale(1.02)' : 'scale(1)',
                      background: isPopular 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                        : 'white',
                      '&:hover': {
                        transform: isPopular ? 'scale(1.03)' : 'scale(1.01)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
                      }
                    }}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {/* Popular Badge - minimal design */}
                    {isPopular && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        right: 16,
                        backgroundColor: '#8B5CF6', 
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderRadius: 1,
                        zIndex: 2,
                        textAlign: 'center',
                      }}>
                        ยอดนิยม
                      </Box>
                    )}

                    <CardContent sx={{ p: 4, textAlign: 'center', pt: 4 }}>
                      {/* Plan Name */}
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 1,
                          color: isPopular ? '#8B5CF6' : '#1a1a1a'
                        }}
                      >
                        {planDetails.name}
                      </Typography>
                      
                      {/* Plan Description */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 3, lineHeight: 1.6 }}
                      >
                        {planDetails.description}
                      </Typography>
                      
                      {/* Price */}
                      <Box sx={{ mb: 4 }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 800, 
                            color: isPopular ? '#8B5CF6' : '#1a1a1a',
                            lineHeight: 1
                          }}
                        >
                          {formatPrice(plan.finalPrice)}
                          <Typography 
                            component="span" 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 400, 
                              color: 'text.secondary',
                              ml: 0.5
                            }}
                          >
                            /เดือน
                          </Typography>
                        </Typography>
                        
                        {plan.discountPercent > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textDecoration: 'line-through', 
                                color: 'text.secondary',
                                mr: 1
                              }}
                            >
                              {formatPrice(plan.originalPrice)}
                            </Typography>
                            <Chip 
                              label={`ประหยัด ${plan.discountPercent}%`} 
                              size="small" 
                              sx={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          </Box>
                        )}
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          ยกเลิกได้ทุกเมื่อ<br />
                          รับประกันคืนเงิน 7 วัน
                        </Typography>
                      </Box>
                      
                      {/* Get Started Button */}
                      <Button 
                        variant={isPopular ? "contained" : "outlined"}
                        fullWidth
                        size="large"
                        sx={{ 
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          textTransform: 'none',
                          mb: 3,
                          pointerEvents: 'none', // ป้องกันการคลิกซ้อน
                          ...(isPopular ? {
                            background: 'linear-gradient(45deg, #8B5CF6 30%, #A855F7 90%)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #7C3AED 30%, #9333EA 90%)',
                            }
                          } : {
                            borderColor: '#8B5CF6',
                            color: '#8B5CF6',
                            '&:hover': {
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              borderColor: '#7C3AED'
                            }
                          })
                        }}
                      >
                        เริ่มใช้งาน
                      </Button>
                      
                      {/* Features List */}
                      <Box sx={{ textAlign: 'left' }}>
                        {plan.features.slice(0, 8).map((feature: string, featureIndex: number) => (
                          <Box 
                            key={featureIndex} 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              mb: 1.5,
                              gap: 1.5
                            }}
                          >
                            <Check 
                              sx={{ 
                                color: '#4CAF50', 
                                fontSize: '1.2rem',
                                mt: 0.25,
                                flexShrink: 0
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#4a4a4a',
                                lineHeight: 1.4,
                                fontSize: '0.9rem'
                              }}
                            >
                              {translateFeature(feature)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Yearly Plans */}
        {yearlyPlansWithPopular.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              mb: 3, 
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <TrendingUp sx={{ color: '#FF9800' }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  color: '#1a1a1a'
                }}
              >
                แผนรายปี
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                md: yearlyPlansWithPopular.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' 
              }, 
              gap: 3,
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {yearlyPlansWithPopular.map((plan: PricingPlan, index: number) => {
                const planDetails = translatePlanDetails(plan.name, plan.description);
                const isPopular = plan.isPopular;
                
                return (
                  <Card 
                    key={plan.id}
                    sx={{ 
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      border: isPopular ? '3px solid' : '2px solid',
                      borderColor: isPopular ? '#8B5CF6' : 'rgba(0, 0, 0, 0.12)',
                      borderRadius: 3,
                      transform: isPopular ? 'scale(1.02)' : 'scale(1)',
                      background: isPopular 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                        : 'white',
                      '&:hover': {
                        transform: isPopular ? 'scale(1.03)' : 'scale(1.01)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
                      }
                    }}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {/* Popular Badge - minimal design */}
                    {isPopular && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        right: 16,
                        backgroundColor: '#8B5CF6', 
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderRadius: 1,
                        zIndex: 2,
                        textAlign: 'center',
                      }}>
                        ยอดนิยม
                      </Box>
                    )}

                    <CardContent sx={{ p: 4, textAlign: 'center', pt: 4 }}>
                      {/* Plan Name */}
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 1,
                          color: isPopular ? '#8B5CF6' : '#1a1a1a'
                        }}
                      >
                        {planDetails.name}
                      </Typography>
                      
                      {/* Plan Description */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 3, lineHeight: 1.6 }}
                      >
                        {planDetails.description}
                      </Typography>
                      
                      {/* Price */}
                      <Box sx={{ mb: 4 }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 800, 
                            color: isPopular ? '#8B5CF6' : '#1a1a1a',
                            lineHeight: 1
                          }}
                        >
                          {formatPrice(plan.finalPrice)}
                          <Typography 
                            component="span" 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 400, 
                              color: 'text.secondary',
                              ml: 0.5
                            }}
                          >
                            /ปี
                          </Typography>
                        </Typography>
                        
                        {plan.discountPercent > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textDecoration: 'line-through', 
                                color: 'text.secondary',
                                mr: 1
                              }}
                            >
                              {formatPrice(plan.originalPrice)}
                            </Typography>
                            <Chip 
                              label={`ประหยัด ${plan.discountPercent}%`} 
                              size="small" 
                              sx={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          </Box>
                        )}
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          ยกเลิกได้ทุกเมื่อ<br />
                          รับประกันคืนเงิน 7 วัน
                        </Typography>
                      </Box>
                      
                      {/* Get Started Button */}
                      <Button 
                        variant={isPopular ? "contained" : "outlined"}
                        fullWidth
                        size="large"
                        sx={{ 
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          textTransform: 'none',
                          mb: 3,
                          pointerEvents: 'none', // ป้องกันการคลิกซ้อน
                          ...(isPopular ? {
                            background: 'linear-gradient(45deg, #8B5CF6 30%, #A855F7 90%)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #7C3AED 30%, #9333EA 90%)',
                            }
                          } : {
                            borderColor: '#8B5CF6',
                            color: '#8B5CF6',
                            '&:hover': {
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              borderColor: '#7C3AED'
                            }
                          })
                        }}
                      >
                        เริ่มใช้งาน
                      </Button>
                      
                      {/* Features List */}
                      <Box sx={{ textAlign: 'left' }}>
                        {plan.features.slice(0, 8).map((feature: string, featureIndex: number) => (
                          <Box 
                            key={featureIndex} 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              mb: 1.5,
                              gap: 1.5
                            }}
                          >
                            <Check 
                              sx={{ 
                                color: '#4CAF50', 
                                fontSize: '1.2rem',
                                mt: 0.25,
                                flexShrink: 0
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#4a4a4a',
                                lineHeight: 1.4,
                                fontSize: '0.9rem'
                              }}
                            >
                              {translateFeature(feature)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        )}

        {/* No plans available */}
        {monthlyPlansWithPopular.length === 0 && yearlyPlansWithPopular.length === 0 && (
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
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedPlan && translatePlanDetails(selectedPlan.name).name}
              </Typography>
              {selectedPlan?.isPopular && (
                <Chip 
                  label="ยอดนิยม" 
                  color="primary" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedPlan && (
              <Box>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                  {translatePlanDetails(selectedPlan.name).description}
                </Typography>
                
                <Box sx={{ mb: 4, textAlign: 'center', p: 3, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#8B5CF6', mb: 1 }}>
                    {formatPrice(selectedPlan.finalPrice)}
                    <Typography component="span" variant="h6" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                      /{selectedPlan.planType === 'MONTHLY' ? 'เดือน' : 'ปี'}
                    </Typography>
                  </Typography>
                  {selectedPlan.discountPercent > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                      >
                        {formatPrice(selectedPlan.originalPrice)}
                      </Typography>
                      <Chip 
                        label={`ประหยัด ${selectedPlan.discountPercent}%`} 
                        sx={{ backgroundColor: '#4CAF50', color: 'white', fontWeight: 600 }}
                      />
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    สำหรับ {selectedPlan.duration} {selectedPlan.planType === 'MONTHLY' ? 'เดือน' : 'ปี'} • ยกเลิกได้ทุกเมื่อ
                  </Typography>
                </Box>
                
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  ฟีเจอร์ที่ได้รับทั้งหมด:
                </Typography>
                             <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                 {selectedPlan.features.map((feature: string, index: number) => (
                   <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                     <Check sx={{ color: '#4CAF50', fontSize: '1.2rem', mt: 0.25, flexShrink: 0 }} />
                     <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                       {translateFeature(feature)}
                     </Typography>
                   </Box>
                 ))}
               </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ mr: 2 }}>
              ปิด
            </Button>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => {
                // TODO: Implement subscription process
                showSuccess('ฟีเจอร์การสมัครสมาชิกจะเปิดให้ใช้งานเร็วๆ นี้');
                handleCloseDialog();
              }}
              sx={{ 
                px: 4,
                py: 1.5,
                background: 'linear-gradient(45deg, #8B5CF6 30%, #A855F7 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #7C3AED 30%, #9333EA 90%)',
                }
              }}
            >
              เริ่มการสมัครสมาชิก
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
} 