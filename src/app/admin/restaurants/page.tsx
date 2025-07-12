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
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  useMediaQuery,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Search,
  Edit,
  Visibility,
  Store,
  CheckCircle,
  Cancel,
  Pause,
  LocationOn,
  Phone,
  Email,
  FilterList,
  CalendarToday,
  Description,
  Image,
  Business,
  Payment,
  DeliveryDining
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/contexts/NotificationContext';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  status: string;
  businessType?: string;
  taxId?: string;
  bankAccount?: string;
  bankName?: string;
  acceptCash: boolean;
  acceptTransfer: boolean;
  promptpayId?: string;
  promptpayType?: string;
  promptpayName?: string;
  minOrderAmount?: number;
  deliveryFee?: number;
  deliveryRadius?: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  documents?: {
    id: string;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    documentType: string;
    createdAt: string;
  }[];
  _count: {
    menuItems: number;
    orders: number;
    categories: number;
  };
}

interface RestaurantsResponse {
  restaurants: Restaurant[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: Record<string, number>;
}

interface RestaurantEditFormProps {
  restaurant: Restaurant;
  onClose: () => void;
  onUpdate: () => void;
}

function RestaurantEditForm({ restaurant, onClose, onUpdate }: RestaurantEditFormProps) {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: restaurant.name,
    description: restaurant.description || '',
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email || '',
    businessType: restaurant.businessType || '',
    taxId: restaurant.taxId || '',
    bankAccount: restaurant.bankAccount || '',
    bankName: restaurant.bankName || '',
    minOrderAmount: restaurant.minOrderAmount || 0,
    deliveryFee: restaurant.deliveryFee || 0,
    deliveryRadius: restaurant.deliveryRadius || 5,
    acceptCash: restaurant.acceptCash,
    acceptTransfer: restaurant.acceptTransfer,
    promptpayId: restaurant.promptpayId || '',
    promptpayType: restaurant.promptpayType || 'PHONE_NUMBER',
    promptpayName: restaurant.promptpayName || '',
    status: restaurant.status
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promptpayError, setPromptpayError] = useState('');

  // ฟังก์ชันตรวจสอบ PromptPay
  const validatePromptPay = (type: string, value: string): string => {
    if (!value.trim()) {
      return 'กรุณากรอกหมายเลขพร้อมเพย์';
    }

    // ลบช่องว่างและขีดออก
    const cleanValue = value.replace(/[\s-]/g, '');

    if (type === 'CITIZEN_ID') {
      // ตรวจสอบบัตรประชาชน - ต้องเป็นตัวเลข 13 หลัก
      if (!/^\d{13}$/.test(cleanValue)) {
        return 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น';
      }
      
      // ตรวจสอบเลขบัตรประชาชนที่ไม่ถูกต้อง (เลขซ้ำทั้งหมด)
      if (/^(\d)\1{12}$/.test(cleanValue)) {
        return 'เลขบัตรประชาชนไม่ถูกต้อง';
      }
    } else if (type === 'PHONE_NUMBER') {
      // ตรวจสอบเบอร์โทรศัพท์ - ต้องเป็นตัวเลข 10 หลัก
      if (!/^\d{10}$/.test(cleanValue)) {
        return 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น';
      }
      
      // ตรวจสอบเบอร์โทรศัพท์ที่ขึ้นต้นด้วย 0
      if (!cleanValue.startsWith('0')) {
        return 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0';
      }
      
      // ตรวจสอบเบอร์โทรศัพท์ที่ไม่ถูกต้อง (เลขซ้ำทั้งหมด)
      if (/^(\d)\1{9}$/.test(cleanValue)) {
        return 'เบอร์โทรศัพท์ไม่ถูกต้อง';
      }
    }

    return '';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    
    // ตรวจสอบ PromptPay เมื่อมีการเปลี่ยนแปลง
    if (field === 'promptpayId' || field === 'promptpayType') {
      const promptpayType = field === 'promptpayType' ? value : formData.promptpayType;
      const promptpayId = field === 'promptpayId' ? value : formData.promptpayId;
      
      if (formData.acceptTransfer && promptpayId) {
        const validationError = validatePromptPay(promptpayType, promptpayId);
        setPromptpayError(validationError);
      } else {
        setPromptpayError('');
      }
    }
    
    // ล้าง error เมื่อปิดการรับโอนเงิน
    if (field === 'acceptTransfer' && !value) {
      setPromptpayError('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setPromptpayError('');

    // ตรวจสอบ PromptPay ก่อนส่งข้อมูล
    if (formData.acceptTransfer && formData.promptpayId) {
      const validationError = validatePromptPay(formData.promptpayType, formData.promptpayId);
      if (validationError) {
        setPromptpayError(validationError);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

             if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to update restaurant');
       }

       const data = await response.json();
       showSuccess('อัปเดตข้อมูลร้านอาหารเรียบร้อยแล้ว');
       
       onUpdate();
       onClose();
    } catch (error: any) {
      console.error('Error updating restaurant:', error);
      showError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
      {error && (
        <Alert severity="error">{error}</Alert>
      )}

      {/* Basic Info */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          ข้อมูลพื้นฐาน
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="ชื่อร้าน"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              sx={{ flex: '1 1 300px' }}
              required
            />
            <FormControl sx={{ flex: '1 1 200px' }}>
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="สถานะ"
              >
                <MenuItem value="PENDING">รอการอนุมัติ</MenuItem>
                <MenuItem value="ACTIVE">ใช้งาน</MenuItem>
                <MenuItem value="SUSPENDED">ระงับ</MenuItem>
                <MenuItem value="REJECTED">ปฏิเสธ</MenuItem>
                <MenuItem value="CLOSED">ปิด</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <TextField
            label="คำอธิบายร้าน"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          
          <TextField
            label="ที่อยู่"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            multiline
            rows={2}
            fullWidth
            required
          />
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="โทรศัพท์"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              sx={{ flex: '1 1 200px' }}
              required
            />
            <TextField
              label="อีเมล"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              sx={{ flex: '1 1 200px' }}
              type="email"
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Business Info */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          ข้อมูลธุรกิจ
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="ประเภทธุรกิจ"
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="เลขประจำตัวผู้เสียภาษี"
              value={formData.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              sx={{ flex: '1 1 200px' }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="ธนาคาร"
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="เลขบัญชี"
              value={formData.bankAccount}
              onChange={(e) => handleInputChange('bankAccount', e.target.value)}
              sx={{ flex: '1 1 200px' }}
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Payment Settings */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          การรับชำระเงิน
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.acceptCash}
                  onChange={(e) => handleInputChange('acceptCash', e.target.checked)}
                />
              }
              label="รับเงินสด"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.acceptTransfer}
                  onChange={(e) => handleInputChange('acceptTransfer', e.target.checked)}
                />
              }
              label="รับโอนเงิน"
            />
          </Box>
          
          {formData.acceptTransfer && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ flex: '1 1 150px' }}>
                <InputLabel>ประเภทพร้อมเพย์</InputLabel>
                <Select
                  value={formData.promptpayType}
                  onChange={(e) => handleInputChange('promptpayType', e.target.value)}
                  label="ประเภทพร้อมเพย์"
                >
                  <MenuItem value="PHONE_NUMBER">เบอร์โทรศัพท์</MenuItem>
                  <MenuItem value="CITIZEN_ID">บัตรประชาชน</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="หมายเลขพร้อมเพย์"
                value={formData.promptpayId}
                onChange={(e) => handleInputChange('promptpayId', e.target.value)}
                sx={{ flex: '1 1 200px' }}
                error={!!promptpayError}
                helperText={promptpayError || (formData.promptpayType === 'CITIZEN_ID' ? 'กรอกเลขบัตรประชาชน 13 หลัก' : 'กรอกเบอร์โทรศัพท์ 10 หลัก')}
                placeholder={formData.promptpayType === 'CITIZEN_ID' ? '1234567890123' : '0812345678'}
                InputProps={{
                  endAdornment: formData.promptpayId && !promptpayError ? (
                    <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  ) : undefined
                }}
              />
              <TextField
                label="ชื่อบัญชี"
                value={formData.promptpayName}
                onChange={(e) => handleInputChange('promptpayName', e.target.value)}
                sx={{ flex: '1 1 200px' }}
                helperText="ชื่อเจ้าของบัญชี"
              />
            </Box>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Order Settings */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          การจัดส่ง
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="ยอดขั้นต่ำ"
            type="number"
            value={formData.minOrderAmount}
            onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value) || 0)}
            sx={{ flex: '1 1 150px' }}
            InputProps={{
              endAdornment: <Typography variant="body2">บาท</Typography>
            }}
          />
          <TextField
            label="ค่าจัดส่ง"
            type="number"
            value={formData.deliveryFee}
            onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
            sx={{ flex: '1 1 150px' }}
            InputProps={{
              endAdornment: <Typography variant="body2">บาท</Typography>
            }}
          />
          <TextField
            label="รัศมีจัดส่ง"
            type="number"
            value={formData.deliveryRadius}
            onChange={(e) => handleInputChange('deliveryRadius', parseFloat(e.target.value) || 5)}
            sx={{ flex: '1 1 150px' }}
            InputProps={{
              endAdornment: <Typography variant="body2">กม.</Typography>
            }}
          />
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          ยกเลิก
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading || !!promptpayError}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </Button>
      </Box>
    </Box>
  );
}

export default function AdminRestaurantsPage() {
  const theme = useTheme();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError } = useNotification();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
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
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
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

      const response = await fetch(`/api/admin/restaurants?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      
      const data: RestaurantsResponse = await response.json();
      setRestaurants(data.restaurants);
      setPagination(data.pagination);
      setStats(data.stats);
      
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลร้านอาหาร');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (restaurantId: string, newStatus: string) => {
    try {
      setActionLoading(restaurantId);
      
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      const data = await response.json();
      
      // Show success message based on status
      let message = '';
      switch (newStatus) {
        case 'ACTIVE':
          message = `อนุมัติร้าน "${data.restaurant.name}" เรียบร้อยแล้ว`;
          break;
        case 'REJECTED':
          message = `ปฏิเสธร้าน "${data.restaurant.name}" เรียบร้อยแล้ว`;
          break;
        case 'SUSPENDED':
          message = `ระงับร้าน "${data.restaurant.name}" เรียบร้อยแล้ว`;
          break;
        default:
          message = 'อัปเดตสถานะเรียบร้อยแล้ว';
      }
      
      // Show success message
      showSuccess(message);
      setError(null);

      // Refresh data
      await fetchRestaurants();
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      showError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'SUSPENDED': return 'error';
      case 'REJECTED': return 'error';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'เปิดใช้งาน';
      case 'PENDING': return 'รออนุมัติ';
      case 'SUSPENDED': return 'ระงับการใช้งาน';
      case 'REJECTED': return 'ปฏิเสธ';
      case 'CLOSED': return 'ปิด';
      default: return status;
    }
  };

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        จัดการร้านอาหาร
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      


      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {Object.entries(stats).map(([status, count]) => (
          <Box key={status} sx={{ flex: '1 1 180px', minWidth: 180 }}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  {getStatusText(status)}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {count.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
            <TextField
              fullWidth
              placeholder="ค้นหาร้านอาหาร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={statusFilter}
                label="สถานะ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">ทั้งหมด</MenuItem>
                <MenuItem value="PENDING">รออนุมัติ</MenuItem>
                <MenuItem value="ACTIVE">เปิดใช้งาน</MenuItem>
                <MenuItem value="SUSPENDED">ระงับการใช้งาน</MenuItem>
                <MenuItem value="REJECTED">ปฏิเสธ</MenuItem>
                <MenuItem value="CLOSED">ปิด</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '0 0 auto' }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={fetchRestaurants}
              disabled={loading}
            >
              ค้นหา
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Restaurants Table/Cards */}
      <Card>
        {isMobile ? (
          // Mobile Card Layout
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 1, ml: 2 }}>กำลังโหลด...</Typography>
              </Box>
            ) : restaurants.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  ไม่พบข้อมูลร้านอาหาร
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {restaurants.map((restaurant) => (
                  <Card key={restaurant.id} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar 
                        src={restaurant.imageUrl || undefined}
                        sx={{ width: 50, height: 50 }}
                      >
                        <Store />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {restaurant.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                          {restaurant.address}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          <Phone sx={{ fontSize: 14, mr: 0.5 }} />
                          {restaurant.phone}
                        </Typography>
                        <Chip
                          label={getStatusText(restaurant.status)}
                          color={getStatusColor(restaurant.status) as any}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        เจ้าของร้าน: {restaurant.owner.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        {restaurant.owner.email}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {restaurant._count.menuItems} เมนู | {restaurant._count.orders} ออเดอร์
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14 }} />
                        <Typography variant="caption" color="textSecondary">
                          {new Date(restaurant.createdAt).toLocaleDateString('th-TH')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setDetailsOpen(true);
                          }}
                          sx={{ flex: 1 }}
                        >
                          ดูรายละเอียด
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setEditOpen(true);
                          }}
                          sx={{ flex: 1 }}
                        >
                          แก้ไข
                        </Button>
                      </Box>
                      
                      {restaurant.documents && restaurant.documents.length > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          startIcon={<Description />}
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setDocumentsOpen(true);
                          }}
                        >
                          ดูเอกสารการสมัคร ({restaurant.documents.length})
                        </Button>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                      
                      {restaurant.status === 'ACTIVE' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          startIcon={<Pause />}
                          onClick={() => handleStatusChange(restaurant.id, 'SUSPENDED')}
                          disabled={actionLoading === restaurant.id}
                        >
                          ระงับ
                        </Button>
                      )}
                      
                      {restaurant.status === 'SUSPENDED' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleStatusChange(restaurant.id, 'ACTIVE')}
                          disabled={actionLoading === restaurant.id}
                        >
                          เปิดใช้งาน
                        </Button>
                      )}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          // Desktop Table Layout
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ร้านอาหาร</TableCell>
                  <TableCell>เจ้าของร้าน</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>เมนู/ออเดอร์</TableCell>
                  <TableCell>วันที่สมัคร</TableCell>
                  <TableCell align="center">การกระทำ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 1 }}>กำลังโหลด...</Typography>
                    </TableCell>
                  </TableRow>
                ) : restaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                          <Avatar 
                            src={restaurant.imageUrl || undefined}
                            sx={{ width: 50, height: 50 }}
                          >
                            <Store />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {restaurant.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                              {restaurant.address}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              <Phone sx={{ fontSize: 14, mr: 0.5 }} />
                              {restaurant.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {restaurant.owner.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {restaurant.owner.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(restaurant.status)}
                          color={getStatusColor(restaurant.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {restaurant._count.menuItems} เมนู
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {restaurant._count.orders} ออเดอร์
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(restaurant.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Tooltip title="ดูรายละเอียด">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setDetailsOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="แก้ไข">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setEditOpen(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          
                          {restaurant.documents && restaurant.documents.length > 0 && (
                            <Tooltip title={`ดูเอกสารการสมัคร (${restaurant.documents.length})`}>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => {
                                  setSelectedRestaurant(restaurant);
                                  setDocumentsOpen(true);
                                }}
                              >
                                <Description />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {restaurant.status === 'ACTIVE' && (
                            <Tooltip title="ระงับการใช้งาน">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleStatusChange(restaurant.id, 'SUSPENDED')}
                                disabled={actionLoading === restaurant.id}
                              >
                                <Pause />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {restaurant.status === 'SUSPENDED' && (
                            <Tooltip title="เปิดใช้งานอีกครั้ง">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleStatusChange(restaurant.id, 'ACTIVE')}
                                disabled={actionLoading === restaurant.id}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={pagination.totalPages}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Restaurant Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="lg" 
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
          <Store sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {selectedRestaurant?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              รายละเอียดร้านอาหาร
            </Typography>
          </Box>
          {selectedRestaurant && (
            <Box sx={{ ml: 'auto' }}>
              <Chip
                label={getStatusText(selectedRestaurant.status)}
                color={getStatusColor(selectedRestaurant.status) as any}
                variant="filled"
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 1
                }}
              />
            </Box>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedRestaurant && (
            <Box sx={{ p: 4 }}>
              {/* Restaurant Header Card */}
              <Card 
                sx={{ 
                  mb: 4,
                  background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(102, 126, 234, 0.08) 100%)',
                  border: '1px solid rgba(74, 144, 226, 0.15)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        fontWeight: 700
                      }}
                    >
                      {selectedRestaurant.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {selectedRestaurant.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {selectedRestaurant.description || 'ไม่มีคำอธิบาย'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="textSecondary">
                          สมัครเมื่อ {new Date(selectedRestaurant.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Quick Stats */}
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {selectedRestaurant._count.menuItems}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        เมนู
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {selectedRestaurant._count.orders}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ออเดอร์
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        {selectedRestaurant._count.categories}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        หมวดหมู่
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Information Grid */}
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                
                {/* Contact Information */}
                <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Phone sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        ข้อมูลติดต่อ
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                          โทรศัพท์
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedRestaurant.phone}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                          อีเมล
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedRestaurant.email || 'ไม่ระบุ'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                          ที่อยู่
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.6 }}>
                          {selectedRestaurant.address}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Business Information */}
                <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Business sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        ข้อมูลธุรกิจ
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                          ประเภทธุรกิจ
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedRestaurant.businessType || 'ไม่ระบุ'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                          เลขประจำตัวผู้เสียภาษี
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedRestaurant.taxId || 'ไม่ระบุ'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                          เจ้าของร้าน
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedRestaurant.owner.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {selectedRestaurant.owner.email}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Payment sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        การรับชำระเงิน
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          รับเงินสด
                        </Typography>
                        <Chip
                          label={selectedRestaurant.acceptCash ? 'รับ' : 'ไม่รับ'}
                          color={selectedRestaurant.acceptCash ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          รับโอนเงิน
                        </Typography>
                        <Chip
                          label={selectedRestaurant.acceptTransfer ? 'รับ' : 'ไม่รับ'}
                          color={selectedRestaurant.acceptTransfer ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      
                      {selectedRestaurant.acceptTransfer && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Box>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                              พร้อมเพย์
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedRestaurant.promptpayId || 'ไม่ระบุ'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
                              ชื่อบัญชี
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedRestaurant.promptpayName || 'ไม่ระบุ'}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Delivery Information */}
                <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <DeliveryDining sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        การจัดส่ง
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          ค่าจัดส่ง
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ฿{selectedRestaurant.deliveryFee || 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          ยอดขั้นต่ำ
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                          ฿{selectedRestaurant.minOrderAmount || 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          รัศมีจัดส่ง
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {selectedRestaurant.deliveryRadius || 0} กม.
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            borderTop: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.02) 0%, rgba(102, 126, 234, 0.02) 100%)',
            p: 3,
            gap: 2
          }}
        >
          {selectedRestaurant?.documents && selectedRestaurant.documents.length > 0 && (
            <Button 
              variant="outlined"
              startIcon={<Description />}
              onClick={() => {
                setDetailsOpen(false);
                setDocumentsOpen(true);
              }}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              ดูเอกสารการสมัคร
            </Button>
          )}
          <Button 
            variant="contained"
            onClick={() => setDetailsOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4
            }}
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Restaurant Dialog */}
      <Dialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        maxWidth="lg" 
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
          <Edit sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              แก้ไขข้อมูลร้านอาหาร
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedRestaurant?.name}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedRestaurant && (
            <Box sx={{ p: 4 }}>
              <RestaurantEditForm 
                restaurant={selectedRestaurant}
                onClose={() => setEditOpen(false)}
                onUpdate={fetchRestaurants}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog 
        open={documentsOpen} 
        onClose={() => setDocumentsOpen(false)} 
        maxWidth="lg" 
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
          <Description sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              เอกสารการสมัคร
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedRestaurant?.name}
            </Typography>
          </Box>
          {selectedRestaurant?.status && (
            <Chip
              label={getStatusText(selectedRestaurant.status)}
              color={getStatusColor(selectedRestaurant.status) as any}
              variant="filled"
              sx={{ 
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 2,
                py: 1
              }}
            />
          )}
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedRestaurant?.documents && selectedRestaurant.documents.length > 0 ? (
            <Box sx={{ p: 4 }}>
              <Alert 
                severity={selectedRestaurant.status === 'PENDING' ? 'warning' : 'info'}
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  background: selectedRestaurant.status === 'PENDING' 
                    ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)',
                  border: `1px solid ${selectedRestaurant.status === 'PENDING' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(74, 144, 226, 0.3)'}`,
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRestaurant.status === 'PENDING' 
                    ? 'ตรวจสอบเอกสารการสมัครของร้านอาหารก่อนอนุมัติ'
                    : 'เอกสารการสมัครของร้านอาหารนี้'
                  }
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {selectedRestaurant.documents.map((doc: any, index: number) => (
                  <Card 
                    key={doc.id} 
                    sx={{ 
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar
                          sx={{
                            bgcolor: doc.mimeType.includes('image') ? 'success.main' : 'primary.main',
                            width: 48,
                            height: 48
                          }}
                        >
                          <Description />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            เอกสารที่ {index + 1}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {doc.fileName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="textSecondary">
                              อัปโหลดเมื่อ: {new Date(doc.createdAt).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={doc.mimeType.split('/')[1].toUpperCase()}
                          size="small"
                          color={doc.mimeType.includes('image') ? 'success' : 'primary'}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          ดูเอกสาร
                        </Button>
                      </Box>
                      
                      {doc.mimeType.includes('image') && (
                        <Box 
                          component="img"
                          src={doc.fileUrl}
                          alt={doc.fileName}
                          sx={{
                            width: '100%',
                            maxHeight: 300,
                            objectFit: 'contain',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: 2,
                            background: 'rgba(255,255,255,0.8)'
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
              
              {selectedRestaurant.status === 'PENDING' && (
                <Card 
                  sx={{ 
                    mt: 3,
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 193, 7, 0.03) 100%)',
                    border: '1px solid rgba(255, 193, 7, 0.2)',
                    borderRadius: 2
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
                      การอนุมัติร้านอาหาร
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => {
                          setDocumentsOpen(false);
                          handleStatusChange(selectedRestaurant.id, 'ACTIVE');
                        }}
                        disabled={actionLoading === selectedRestaurant.id}
                        sx={{ 
                          flex: 1,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5
                        }}
                      >
                        อนุมัติร้านอาหาร
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => {
                          setDocumentsOpen(false);
                          handleStatusChange(selectedRestaurant.id, 'REJECTED');
                        }}
                        disabled={actionLoading === selectedRestaurant.id}
                        sx={{ 
                          flex: 1,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5
                        }}
                      >
                        ปฏิเสธการสมัคร
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 3,
                  bgcolor: 'grey.100',
                  color: 'grey.400'
                }}
              >
                <Description sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                ไม่พบเอกสารการสมัคร
              </Typography>
              <Typography variant="body1" color="textSecondary">
                ร้านอาหารนี้ยังไม่ได้อัปโหลดเอกสารการสมัคร
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            borderTop: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.02) 0%, rgba(102, 126, 234, 0.02) 100%)',
            p: 3
          }}
        >
          <Button 
            variant="contained"
            onClick={() => setDocumentsOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4
            }}
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 