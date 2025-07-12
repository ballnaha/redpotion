'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  useMediaQuery,
  IconButton,
  Avatar,
  Collapse,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  FormControlLabel,
  Switch,
  Skeleton
} from '@mui/material';
import {
  Search,
  PhoneAndroid,
  Edit,
  CheckCircle,
  Cancel,
  Store,
  ContentCopy,
  Refresh,
  Schedule,
  Warning,
  AccessTime,
  CalendarToday,
  Payment,
  Subscriptions,
  MoreVert,
  ExpandMore,
  ExpandLess,
  Smartphone,
  EventAvailable,
  EventBusy,
  Star,
  Diamond,
  Timer,
  AllInclusive,
  Add,
  Remove
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/contexts/NotificationContext';

interface RestaurantLiff {
  id: string;
  name: string;
  status: string;
  liffId?: string;
  liffExpiresAt?: string;
  subscriptionType?: 'FREE' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isLiffActive: boolean;
  // Last Extension Info
  lastExtensionDate?: string;
  lastExtensionType?: 'FREE' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  lastExtensionAmount?: number;
  lastExtensionBy?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    orders: number;
    menuItems: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface LiffSettingsResponse {
  restaurants: RestaurantLiff[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
  stats: {
    total: number;
    active: number;
    withLiff: number;
    withoutLiff: number;
    expired: number;
    expiringSoon: number;
  };
}

export default function AdminLiffSettingsPage() {
  const theme = useTheme();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { showSuccess, showError } = useNotification();
  
  const [restaurants, setRestaurants] = useState<RestaurantLiff[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withLiff: 0,
    withoutLiff: 0,
    expired: 0,
    expiringSoon: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantLiff | null>(null);
  const [liffModalOpen, setLiffModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Form states
  const [liffId, setLiffId] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<'FREE' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME'>('FREE');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');
  const [extendMonths, setExtendMonths] = useState(1);
  const [extendYears, setExtendYears] = useState(1);
  const [useAutoCalculate, setUseAutoCalculate] = useState(true);
  
  // Mobile states
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRestaurant, setMenuRestaurant] = useState<RestaurantLiff | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchRestaurants();
    }
  }, [session, page, statusFilter, searchTerm]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/liff-settings?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      
      const data: LiffSettingsResponse = await response.json();
      setRestaurants(data.restaurants);
      setPagination(data.pagination);
      setStats(data.stats);
      
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลร้านอาหาร');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLiff = (restaurant: RestaurantLiff) => {
    setSelectedRestaurant(restaurant);
    setLiffId(restaurant.liffId || '');
    setSubscriptionType(restaurant.subscriptionType || 'FREE');
    
    // Format date for HTML date input (yyyy-mm-dd)
    if (restaurant.subscriptionEndDate) {
      const date = new Date(restaurant.subscriptionEndDate);
      const formattedDate = date.toISOString().split('T')[0];
      setSubscriptionEndDate(formattedDate);
    } else {
      setSubscriptionEndDate('');
    }
    
    // Reset form states
    setExtendMonths(1);
    setExtendYears(1);
    setUseAutoCalculate(true);
    
    setLiffModalOpen(true);
    setAnchorEl(null);
  };

  const calculateEndDate = () => {
    if (!useAutoCalculate || subscriptionType === 'FREE' || subscriptionType === 'LIFETIME') {
      return null;
    }

    const baseDate = selectedRestaurant?.subscriptionEndDate 
      ? new Date(selectedRestaurant.subscriptionEndDate) 
      : new Date();

    // ถ้าวันหมดอายุเดิมผ่านมาแล้ว ให้ใช้วันปัจจุบัน
    if (baseDate < new Date()) {
      baseDate.setTime(new Date().getTime());
    }

    if (subscriptionType === 'TRIAL') {
      // ทดลอง 30 วัน
      baseDate.setDate(baseDate.getDate() + 30);
    } else if (subscriptionType === 'MONTHLY') {
      // รายเดือน - บวกตามจำนวนเดือนที่ระบุ
      baseDate.setMonth(baseDate.getMonth() + extendMonths);
    } else if (subscriptionType === 'YEARLY') {
      // รายปี - บวกตามจำนวนปีที่ระบุ
      baseDate.setFullYear(baseDate.getFullYear() + extendYears);
    }

    return baseDate.toISOString().split('T')[0];
  };

  const handleSaveLiff = async () => {
    if (!selectedRestaurant) return;
    
    try {
      setActionLoading(selectedRestaurant.id);
      
      // คำนวณวันหมดอายุ
      let calculatedEndDate: string | null = null;
      
      if (useAutoCalculate) {
        calculatedEndDate = calculateEndDate();
      } else {
        // ใช้วันที่ที่ผู้ใช้ระบุ
        if (subscriptionType !== 'FREE' && subscriptionType !== 'LIFETIME') {
          calculatedEndDate = subscriptionEndDate || null;
        }
      }
      
      const response = await fetch(`/api/admin/liff-settings/${selectedRestaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          liffId,
          subscriptionType,
          subscriptionEndDate: calculatedEndDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update LIFF settings');
      }

      showSuccess('อัปเดตการตั้งค่า LIFF เรียบร้อยแล้ว');
      setLiffModalOpen(false);
      await fetchRestaurants();
      
    } catch (error: any) {
      console.error('Error updating LIFF settings:', error);
      showError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า LIFF');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('คัดลอกแล้ว!');
  };

  const generateLiffUrl = (restaurantId: string, liffId: string) => {
    return `https://liff.line.me/${liffId}?restaurant=${restaurantId}`;
  };

  const getSubscriptionStatus = (restaurant: RestaurantLiff) => {
    // ฟรี - ไม่มีวันหมดอายุ แต่ฟีเจอร์จำกัด
    if (restaurant.subscriptionType === 'FREE') {
      return { status: 'FREE', color: 'default' as const, text: 'ฟรี (จำกัด)', icon: <Star /> };
    }
    
    // ตลอดชีพ - ไม่มีวันหมดอายุ และฟีเจอร์เต็ม
    if (restaurant.subscriptionType === 'LIFETIME') {
      return { status: 'LIFETIME', color: 'primary' as const, text: 'ตลอดชีพ', icon: <AllInclusive /> };
    }

    if (!restaurant.subscriptionEndDate) {
      return { status: 'FREE', color: 'default' as const, text: 'ฟรี (จำกัด)', icon: <Star /> };
    }

    const now = new Date();
    const endDate = new Date(restaurant.subscriptionEndDate);
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'EXPIRED', color: 'error' as const, text: 'หมดอายุ', icon: <EventBusy /> };
    } else if (diffDays <= 7) {
      return { status: 'EXPIRING_SOON', color: 'warning' as const, text: `เหลือ ${diffDays} วัน`, icon: <Timer /> };
    } else {
      return { status: 'ACTIVE', color: 'success' as const, text: getSubscriptionTypeText(restaurant.subscriptionType), icon: <EventAvailable /> };
    }
  };

  const getSubscriptionTypeText = (type?: string) => {
    switch (type) {
      case 'FREE': return 'ฟรี (จำกัด)';
      case 'TRIAL': return 'ทดลอง';
      case 'MONTHLY': return 'รายเดือน';
      case 'YEARLY': return 'รายปี';
      case 'LIFETIME': return 'ตลอดชีพ';
      default: return 'ฟรี (จำกัด)';
    }
  };

  const extendSubscription = async (restaurantId: string, type: 'TRIAL' | 'MONTHLY' | 'YEARLY', customMonths?: number, customYears?: number) => {
    try {
      setActionLoading(restaurantId);
      
      let months = 1;
      let typeText = '';
      
      if (type === 'TRIAL') {
        months = 0; // ทดลอง 30 วัน
        typeText = 'ทดลอง 30 วัน';
      } else if (type === 'MONTHLY') {
        months = customMonths || 1;
        typeText = `${months} เดือน`;
      } else if (type === 'YEARLY') {
        const years = customYears || 1;
        months = years * 12;
        typeText = `${years} ปี`;
      }
      
      const response = await fetch(`/api/admin/liff-settings/${restaurantId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ months, subscriptionType: type })
      });

      if (!response.ok) {
        throw new Error('Failed to extend subscription');
      }

      showSuccess(`ต่ออายุสมาชิก ${typeText} เรียบร้อยแล้ว`);
      await fetchRestaurants();
      setAnchorEl(null);
      setLiffModalOpen(false);
      
    } catch (error: any) {
      console.error('Error extending subscription:', error);
      showError('เกิดข้อผิดพลาดในการต่ออายุสมาชิก');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, restaurant: RestaurantLiff) => {
    setAnchorEl(event.currentTarget);
    setMenuRestaurant(restaurant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRestaurant(null);
  };

  const renderStatsCard = (icon: React.ReactNode, value: number, label: string, isLoading: boolean = false) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
          {isLoading ? (
            <Skeleton variant="circular" width={isMobile ? 24 : 40} height={isMobile ? 24 : 40} />
          ) : (
            icon
          )}
          <Box>
            {isLoading ? (
              <>
                <Skeleton variant="text" width={40} height={isMobile ? 24 : 32} />
                <Skeleton variant="text" width={80} height={isMobile ? 16 : 20} />
              </>
            ) : (
              <>
                <Typography variant={isMobile ? "h6" : "h4"} sx={{ fontWeight: 700 }}>
                  {value}
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} color="textSecondary">
                  {label}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Check admin access
  if (session?.user?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้
        </Alert>
      </Box>
    );
  }

  // Show loading screen when initially loading data
  if (loading && restaurants.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        gap: 3
      }}>
        <CircularProgress size={60} thickness={4} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            กำลังโหลดข้อมูล LIFF Settings
          </Typography>
          <Typography variant="body2" color="textSecondary">
            กรุณารอสักครู่...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
          จัดการ LIFF Settings
        </Typography>
        {loading && restaurants.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="textSecondary">
              กำลังอัปเดต...
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: 'repeat(2, 1fr)', 
          sm: 'repeat(3, 1fr)', 
          md: 'repeat(6, 1fr)' 
        }, 
        gap: 2, 
        mb: 4 
      }}>
        {renderStatsCard(
          <Store color="primary" sx={{ fontSize: { xs: 24, md: 40 } }} />,
          stats.total,
          'ร้านทั้งหมด',
          loading && restaurants.length === 0
        )}
        
        {renderStatsCard(
          <CheckCircle color="success" sx={{ fontSize: { xs: 24, md: 40 } }} />,
          stats.active,
          'ร้านที่เปิดใช้งาน',
          loading && restaurants.length === 0
        )}
        
        {renderStatsCard(
          <PhoneAndroid color="info" sx={{ fontSize: { xs: 24, md: 40 } }} />,
          stats.withLiff,
          'มี LIFF ID',
          loading && restaurants.length === 0
        )}
        
        {renderStatsCard(
          <Cancel color="warning" sx={{ fontSize: { xs: 24, md: 40 } }} />,
          stats.withoutLiff,
          'ไม่มี LIFF ID',
          loading && restaurants.length === 0
        )}
        
        {renderStatsCard(
          <Warning color="error" sx={{ fontSize: { xs: 24, md: 40 } }} />,
          stats.expired,
          'หมดอายุแล้ว',
          loading && restaurants.length === 0
        )}
        
        {renderStatsCard(
          <AccessTime color="warning" sx={{ fontSize: { xs: 24, md: 40 } }} />,
          stats.expiringSoon,
          'ใกล้หมดอายุ',
          loading && restaurants.length === 0
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: { xs: 2, md: 3 } }}>
        {loading && restaurants.length === 0 ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1, width: '100%' }}>
              <Skeleton variant="rectangular" height={isMobile ? 40 : 56} sx={{ borderRadius: 1 }} />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', md: 200 } }}>
              <Skeleton variant="rectangular" height={isMobile ? 40 : 56} sx={{ borderRadius: 1 }} />
            </Box>
            <Skeleton variant="rectangular" width={100} height={isMobile ? 32 : 36} sx={{ borderRadius: 1 }} />
          </Stack>
        ) : (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1, width: '100%' }}>
              <TextField
                fullWidth
                placeholder="ค้นหาร้านอาหาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size={isMobile ? "small" : "medium"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', md: 200 } }}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>สถานะ</InputLabel>
                <Select
                  value={statusFilter}
                  label="สถานะ"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">ทั้งหมด</MenuItem>
                  <MenuItem value="WITH_LIFF">มี LIFF ID</MenuItem>
                  <MenuItem value="WITHOUT_LIFF">ไม่มี LIFF ID</MenuItem>
                  <MenuItem value="ACTIVE">ร้านที่เปิดใช้งาน</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPage(1);
              }}
              size={isMobile ? "small" : "medium"}
            >
              รีเซ็ต
            </Button>
          </Stack>
        )}
      </Card>

      {/* Desktop Table View */}
      {!isMobile && (
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ร้านอาหาร</TableCell>
                  <TableCell>LIFF ID</TableCell>
                  <TableCell>สถานะร้าน</TableCell>
                  <TableCell>สมาชิก</TableCell>
                  <TableCell>ต่ออายุครั้งล่าสุด</TableCell>
                  <TableCell>สถิติ</TableCell>
                  <TableCell align="center">การกระทำ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 1 }}>กำลังโหลด...</Typography>
                    </TableCell>
                  </TableRow>
                ) : restaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        ไม่พบข้อมูลร้านอาหาร
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  restaurants.map((restaurant) => (
                    <TableRow key={restaurant.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Store />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {restaurant.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {restaurant.owner.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {restaurant.liffId ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {restaurant.liffId}
                            </Typography>
                            <Tooltip title="คัดลอก LIFF URL">
                              <IconButton 
                                size="small"
                                onClick={() => copyToClipboard(generateLiffUrl(restaurant.id, restaurant.liffId!))}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            ไม่ได้ตั้งค่า
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={restaurant.status === 'ACTIVE' ? 'เปิดใช้งาน' : restaurant.status}
                          color={restaurant.status === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const subscriptionStatus = getSubscriptionStatus(restaurant);
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip
                                label={subscriptionStatus.text}
                                color={subscriptionStatus.color}
                                size="small"
                                variant="outlined"
                                icon={subscriptionStatus.icon}
                              />
                              {restaurant.subscriptionEndDate && restaurant.subscriptionType !== 'LIFETIME' && (
                                <Typography variant="caption" color="textSecondary">
                                  หมดอายุ: {new Date(restaurant.subscriptionEndDate).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Typography>
                              )}
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {restaurant.lastExtensionDate ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {new Date(restaurant.lastExtensionDate).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {restaurant.lastExtensionAmount}{' '}
                              {restaurant.lastExtensionType === 'YEARLY' ? 'ปี' : 
                               restaurant.lastExtensionType === 'TRIAL' ? 'เดือน (ทดลอง)' : 'เดือน'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            ไม่เคยต่ออายุ
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {restaurant._count.menuItems} เมนู
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {restaurant._count.orders} ออเดอร์
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="แก้ไข LIFF">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditLiff(restaurant)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="ตัวเลือกเพิ่มเติม">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, restaurant)}
                            >
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : restaurants.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                ไม่พบข้อมูลร้านอาหาร
              </Typography>
            </Card>
          ) : (
            restaurants.map((restaurant) => (
              <Card key={restaurant.id} sx={{ overflow: 'hidden' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        <Store />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {restaurant.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {restaurant.owner.name}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setExpandedCard(expandedCard === restaurant.id ? null : restaurant.id)}
                      >
                        {expandedCard === restaurant.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, restaurant)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={restaurant.status === 'ACTIVE' ? 'เปิดใช้งาน' : restaurant.status}
                      color={restaurant.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                    {(() => {
                      const subscriptionStatus = getSubscriptionStatus(restaurant);
                      return (
                        <Chip
                          label={subscriptionStatus.text}
                          color={subscriptionStatus.color}
                          size="small"
                          variant="outlined"
                          icon={subscriptionStatus.icon}
                        />
                      );
                    })()}
                  </Box>

                  <Collapse in={expandedCard === restaurant.id}>
                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        LIFF ID:
                      </Typography>
                      {restaurant.liffId ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                            {restaurant.liffId}
                          </Typography>
                          <IconButton 
                            size="small"
                            onClick={() => copyToClipboard(generateLiffUrl(restaurant.id, restaurant.liffId!))}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          ไม่ได้ตั้งค่า
                        </Typography>
                      )}

                      {restaurant.subscriptionEndDate && restaurant.subscriptionType !== 'LIFETIME' && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          หมดอายุ: {new Date(restaurant.subscriptionEndDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      )}

                      {restaurant.lastExtensionDate && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            ต่ออายุครั้งล่าสุด:
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(restaurant.lastExtensionDate).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })} ({restaurant.lastExtensionAmount}{' '}
                            {restaurant.lastExtensionType === 'YEARLY' ? 'ปี' : 
                             restaurant.lastExtensionType === 'TRIAL' ? 'เดือน (ทดลอง)' : 'เดือน'})
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="body2" sx={{ mb: 1 }}>
                        สถิติ: {restaurant._count.menuItems} เมนู, {restaurant._count.orders} ออเดอร์
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => handleEditLiff(restaurant)}
                          fullWidth
                        >
                          แก้ไข LIFF
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleEditLiff(menuRestaurant!)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>แก้ไข LIFF</ListItemText>
        </MenuItem>
        
        {menuRestaurant?.liffId && [
          <Divider key="divider" />,
          <MenuItem key="trial" onClick={() => extendSubscription(menuRestaurant.id, 'TRIAL')}>
            <ListItemIcon>
              <Timer fontSize="small" />
            </ListItemIcon>
            <ListItemText>ทดลอง 30 วัน</ListItemText>
          </MenuItem>,
          <MenuItem key="monthly" onClick={() => extendSubscription(menuRestaurant.id, 'MONTHLY')}>
            <ListItemIcon>
              <Schedule fontSize="small" />
            </ListItemIcon>
            <ListItemText>ต่ออายุ 1 เดือน</ListItemText>
          </MenuItem>,
          <MenuItem key="yearly" onClick={() => extendSubscription(menuRestaurant.id, 'YEARLY')}>
            <ListItemIcon>
              <CalendarToday fontSize="small" />
            </ListItemIcon>
            <ListItemText>ต่ออายุ 1 ปี</ListItemText>
          </MenuItem>
        ]}
      </Menu>

      {/* LIFF Settings Modal */}
      <Dialog 
        open={liffModalOpen} 
        onClose={() => setLiffModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.05) 0%, rgba(102, 126, 234, 0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 3
          }}
        >
          <Subscriptions sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              จัดการ LIFF และสมาชิก
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedRestaurant?.name}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* LIFF Settings Section */}
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneAndroid color="primary" />
                  การตั้งค่า LIFF
                </Typography>
                
                <TextField
                  fullWidth
                  label="LIFF ID"
                  value={liffId}
                  onChange={(e) => setLiffId(e.target.value)}
                  helperText="ใส่ LIFF ID ที่ได้จาก LINE Developers Console (เช่น 2007609360-3Z0L8Ekg)"
                  placeholder="2007609360-3Z0L8Ekg"
                  sx={{ mb: 3 }}
                />
                
                {liffId && selectedRestaurant && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(0, 122, 255, 0.1)', 
                    borderRadius: 2,
                    border: '1px solid rgba(0, 122, 255, 0.3)'
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      LIFF URL:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        fullWidth
                        value={generateLiffUrl(selectedRestaurant.id, liffId)}
                        InputProps={{ readOnly: true }}
                        size="small"
                      />
                      <IconButton
                        onClick={() => copyToClipboard(generateLiffUrl(selectedRestaurant.id, liffId))}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Subscription Settings Section */}
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment color="primary" />
                  การจัดการสมาชิก
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>ประเภทสมาชิก</InputLabel>
                    <Select
                      value={subscriptionType}
                      label="ประเภทสมาชิก"
                      onChange={(e) => {
                        setSubscriptionType(e.target.value as any);
                        setUseAutoCalculate(true); // Reset to auto calculate when type changes
                      }}
                    >
                      <MenuItem value="FREE">ฟรี (จำกัดฟีเจอร์)</MenuItem>
                      <MenuItem value="TRIAL">ทดลอง (30 วัน)</MenuItem>
                      <MenuItem value="MONTHLY">รายเดือน</MenuItem>
                      <MenuItem value="YEARLY">รายปี</MenuItem>
                      <MenuItem value="LIFETIME">ตลอดชีพ (ฟีเจอร์เต็ม)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {subscriptionType !== 'FREE' && subscriptionType !== 'LIFETIME' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={useAutoCalculate}
                            onChange={(e) => setUseAutoCalculate(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="คำนวณวันหมดอายุอัตโนมัติ"
                      />
                      
                      {useAutoCalculate ? (
                        <Box>
                          {subscriptionType === 'MONTHLY' && (
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setExtendMonths(Math.max(1, extendMonths - 1))}
                                    disabled={extendMonths <= 1}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      '&:hover': { borderColor: 'primary.main' }
                                    }}
                                  >
                                    <Remove fontSize="small" />
                                  </IconButton>
                                  <TextField
                                    type="number"
                                    label="จำนวนเดือน"
                                    value={extendMonths}
                                    onChange={(e) => setExtendMonths(Math.max(1, Math.min(36, parseInt(e.target.value) || 1)))}
                                    inputProps={{ min: 1, max: 36 }}
                                    sx={{ width: '120px' }}
                                    size="small"
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => setExtendMonths(Math.min(36, extendMonths + 1))}
                                    disabled={extendMonths >= 36}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      '&:hover': { borderColor: 'primary.main' }
                                    }}
                                  >
                                    <Add fontSize="small" />
                                  </IconButton>
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                  เดือน (สูงสุด 36 เดือน)
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ minWidth: 'fit-content' }}>
                                  เพิ่มเร็ว:
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setExtendMonths(Math.min(36, extendMonths + 3))}
                                  disabled={extendMonths >= 34}
                                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                                >
                                  +3
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setExtendMonths(Math.min(36, extendMonths + 6))}
                                  disabled={extendMonths >= 31}
                                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                                >
                                  +6
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setExtendMonths(Math.min(36, extendMonths + 12))}
                                  disabled={extendMonths >= 25}
                                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                                >
                                  +12
                                </Button>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => setExtendMonths(1)}
                                  disabled={extendMonths === 1}
                                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem', color: 'text.secondary' }}
                                >
                                  รีเซ็ต
                                </Button>
                              </Box>
                              
                              {selectedRestaurant && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => extendSubscription(selectedRestaurant.id, 'MONTHLY', extendMonths)}
                                    disabled={actionLoading === selectedRestaurant.id}
                                    sx={{ px: 3 }}
                                  >
                                    ต่ออายุทันที ({extendMonths} เดือน)
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}
                          
                          {subscriptionType === 'YEARLY' && (
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setExtendYears(Math.max(1, extendYears - 1))}
                                    disabled={extendYears <= 1}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      '&:hover': { borderColor: 'primary.main' }
                                    }}
                                  >
                                    <Remove fontSize="small" />
                                  </IconButton>
                                  <TextField
                                    type="number"
                                    label="จำนวนปี"
                                    value={extendYears}
                                    onChange={(e) => setExtendYears(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                    inputProps={{ min: 1, max: 10 }}
                                    sx={{ width: '120px' }}
                                    size="small"
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => setExtendYears(Math.min(10, extendYears + 1))}
                                    disabled={extendYears >= 10}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      '&:hover': { borderColor: 'primary.main' }
                                    }}
                                  >
                                    <Add fontSize="small" />
                                  </IconButton>
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                  ปี (สูงสุด 10 ปี)
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ minWidth: 'fit-content' }}>
                                  เพิ่มเร็ว:
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setExtendYears(Math.min(10, extendYears + 2))}
                                  disabled={extendYears >= 9}
                                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                                >
                                  +2
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setExtendYears(Math.min(10, extendYears + 5))}
                                  disabled={extendYears >= 6}
                                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                                >
                                  +5
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setExtendYears(10)}
                                  disabled={extendYears >= 10}
                                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                                >
                                  MAX
                                </Button>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => setExtendYears(1)}
                                  disabled={extendYears === 1}
                                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem', color: 'text.secondary' }}
                                >
                                  รีเซ็ต
                                </Button>
                              </Box>
                              
                              {selectedRestaurant && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => extendSubscription(selectedRestaurant.id, 'YEARLY', undefined, extendYears)}
                                    disabled={actionLoading === selectedRestaurant.id}
                                    sx={{ px: 3 }}
                                  >
                                    ต่ออายุทันที ({extendYears} ปี)
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}
                          
                          {subscriptionType === 'TRIAL' && (
                            <Box sx={{ mb: 2 }}>
                              <Alert severity="info" sx={{ mb: 2 }}>
                                ระบบจะคำนวณวันหมดอายุอัตโนมัติเป็น 30 วันจากวันที่ปัจจุบัน
                              </Alert>
                              {selectedRestaurant && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => extendSubscription(selectedRestaurant.id, 'TRIAL')}
                                    disabled={actionLoading === selectedRestaurant.id}
                                  >
                                    ต่ออายุทันที (30 วัน)
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}
                          
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: 'rgba(76, 175, 80, 0.1)', 
                            borderRadius: 2,
                            border: '1px solid rgba(76, 175, 80, 0.3)'
                          }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              วันหมดอายุที่จะตั้ง:
                            </Typography>
                            <Typography variant="body2">
                              {(() => {
                                const calculatedDate = calculateEndDate();
                                return calculatedDate ? new Date(calculatedDate).toLocaleDateString('th-TH', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                }) : 'ไม่มีวันหมดอายุ';
                              })()}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <TextField
                          fullWidth
                          label="วันหมดอายุ"
                          type="date"
                          value={subscriptionEndDate}
                          onChange={(e) => setSubscriptionEndDate(e.target.value)}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          helperText="ระบุวันหมดอายุด้วยตัวเอง"
                        />
                      )}
                    </Box>
                  )}
                </Box>
                
                {selectedRestaurant?.subscriptionEndDate && (
                  <Box sx={{ 
                    mt: 3, 
                    p: 2, 
                    bgcolor: 'rgba(255, 193, 7, 0.1)', 
                    borderRadius: 2,
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      สถานะปัจจุบัน:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={getSubscriptionStatus(selectedRestaurant).text}
                        color={getSubscriptionStatus(selectedRestaurant).color}
                        size="small"
                        icon={getSubscriptionStatus(selectedRestaurant).icon}
                      />
                      {selectedRestaurant.subscriptionType !== 'LIFETIME' && (
                        <Typography variant="body2" color="textSecondary">
                          หมดอายุ: {new Date(selectedRestaurant.subscriptionEndDate).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Last Extension Info */}
                {selectedRestaurant?.lastExtensionDate && (
                  <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime color="primary" />
                        การต่ออายุครั้งล่าสุด
                      </Typography>
                      
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            วันที่ต่ออายุ
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {new Date(selectedRestaurant.lastExtensionDate).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            ประเภทการต่ออายุ
                          </Typography>
                          <Chip
                            label={getSubscriptionTypeText(selectedRestaurant.lastExtensionType)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        
                        {selectedRestaurant.lastExtensionAmount && (
                          <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              จำนวนที่ต่อ
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedRestaurant.lastExtensionAmount}{' '}
                              {selectedRestaurant.lastExtensionType === 'YEARLY' ? 'ปี' : 
                               selectedRestaurant.lastExtensionType === 'TRIAL' ? 'เดือน (ทดลอง)' : 'เดือน'}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedRestaurant.lastExtensionBy && (
                          <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              ผู้ดำเนินการ
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedRestaurant.lastExtensionBy}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Information Section */}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>ความแตกต่างระหว่างแผนสมาชิก:</strong>
                <br />
                • <strong>ฟรี:</strong> ใช้งานได้ แต่ฟีเจอร์จำกัด (เช่น จำกัดจำนวนเมนู, ออเดอร์ต่อเดือน)
                <br />
                • <strong>ตลอดชีพ:</strong> ใช้งานได้ตลอดไป ฟีเจอร์เต็ม ไม่มีวันหมดอายุ
                <br />
                • <strong>ทดลอง:</strong> ฟีเจอร์เต็ม 30 วัน
                <br />
                • <strong>รายเดือน:</strong> ฟีเจอร์เต็ม สามารถต่อได้ 1-36 เดือน
                <br />
                • <strong>รายปี:</strong> ฟีเจอร์เต็ม สามารถต่อได้ 1-10 ปี
                <br />
                <br />
                <strong>การคำนวณวันหมดอายุ:</strong>
                <br />
                • <strong>อัตโนมัติ:</strong> ระบบจะคำนวณจากวันหมดอายุเดิม (หรือวันปัจจุบันถ้าหมดอายุแล้ว)
                <br />
                • <strong>กำหนดเอง:</strong> สามารถระบุวันหมดอายุด้วยตัวเองได้
                <br />
                <br />
                <strong>หมายเหตุ:</strong>
                <br />
                • ใน LINE Developers Console ให้ตั้งค่า Endpoint URL เป็น: https://yourdomain.com/liff
                <br />
                • LIFF URL นี้จะใช้สำหรับให้ลูกค้าเข้าถึงเมนูของร้านผ่าน LINE
                <br />
                • ระบบจะแจ้งเตือนก่อนหมดอายุ 7 วัน
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions 
          sx={{ 
            borderTop: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.02) 0%, rgba(102, 126, 234, 0.02) 100%)',
            p: 3,
            gap: 2
          }}
        >
          <Button 
            onClick={() => setLiffModalOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            ยกเลิก
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveLiff}
            disabled={actionLoading === selectedRestaurant?.id}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4
            }}
          >
            {actionLoading === selectedRestaurant?.id ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 