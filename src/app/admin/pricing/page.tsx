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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Grid,
  Skeleton,
  Tooltip,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNotification } from '../../../contexts/NotificationContext';

interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  planType: 'MONTHLY' | 'YEARLY';
  duration: number;
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  isActive: boolean;
  sortOrder: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  monthly: number;
  yearly: number;
}

interface PricingData {
  pricingPlans: PricingPlan[];
  stats: Stats;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export default function AdminPricingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  // SWR for pricing data
  const { 
    data: pricingData, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<PricingData>(
    sessionStatus === 'authenticated' && session?.user?.role === 'ADMIN' 
      ? '/api/admin/pricing' 
      : null, 
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 1000,
    }
  );

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    planType: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    duration: 1,
    originalPrice: 0,
    discountPercent: 0,
    features: [] as string[],
    isActive: true,
    sortOrder: 0
  });

  const [newFeature, setNewFeature] = useState('');

  // Redirect if not admin
  useEffect(() => {
    // Don't redirect while loading
    if (sessionStatus === 'loading') return;
    
    // Add a small delay to prevent flash redirects
    const timer = setTimeout(() => {
      if (sessionStatus === 'unauthenticated') {
        router.replace('/auth/signin');
      } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
        router.replace('/');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [sessionStatus, session?.user?.role, router]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!openDialog) {
      setEditingPlan(null);
      setSubmitting(false); // รีเซ็ต loading state
      setFormData({
        name: '',
        description: '',
        planType: 'MONTHLY',
        duration: 1,
        originalPrice: 0,
        discountPercent: 0,
        features: [],
        isActive: true,
        sortOrder: 0
      });
      setNewFeature('');
    }
  }, [openDialog]);

  // Populate form when editing
  useEffect(() => {
    if (editingPlan) {
      setFormData({
        name: editingPlan.name,
        description: editingPlan.description || '',
        planType: editingPlan.planType,
        duration: editingPlan.duration,
        originalPrice: editingPlan.originalPrice,
        discountPercent: editingPlan.discountPercent,
        features: editingPlan.features,
        isActive: editingPlan.isActive,
        sortOrder: editingPlan.sortOrder
      });
    }
  }, [editingPlan]);

  const handleOpenDialog = (plan?: PricingPlan) => {
    if (plan) {
      setEditingPlan(plan);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return; // ป้องกันการกดซ้ำ
    
    try {
      setSubmitting(true);
      const finalPrice = formData.originalPrice - (formData.originalPrice * formData.discountPercent / 100);
      
      const submitData = {
        ...formData,
        finalPrice
      };

      const url = editingPlan ? `/api/admin/pricing/${editingPlan.id}` : '/api/admin/pricing';
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        showSuccess(editingPlan ? 'แก้ไขแผนราคาเรียบร้อย' : 'เพิ่มแผนราคาเรียบร้อย');
        mutate();
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleting) return; // ป้องกันการกดซ้ำ
    
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccess('ลบแผนราคาเรียบร้อย');
        mutate();
        setDeleteConfirmId(null);
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'เกิดข้อผิดพลาดในการลบ');
      }
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPlanTypeLabel = (planType: string) => {
    switch (planType) {
      case 'MONTHLY': return 'รายเดือน';
      case 'YEARLY': return 'รายปี';
      default: return planType;
    }
  };

  const calculateFinalPrice = () => {
    return formData.originalPrice - (formData.originalPrice * formData.discountPercent / 100);
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
  if (sessionStatus === 'unauthenticated') {
    return null; // Let useEffect handle redirect
  }

  if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return null; // Let useEffect handle redirect
  }

  // Ensure we have a valid admin session before rendering
  if (sessionStatus !== 'authenticated' || !session?.user || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            จัดการราคาการต่ออายุ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ตั้งค่าราคาและแผนการต่ออายุสำหรับร้านอาหาร
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => mutate()}
            disabled={isLoading}
          >
            รีเฟรช
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            เพิ่มแผนราคา
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      {pricingData?.stats && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)', 
            lg: 'repeat(5, 1fr)' 
          }, 
          gap: 3, 
          mb: 3 
        }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {pricingData.stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    แผนทั้งหมด
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {pricingData.stats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    แผนที่เปิดใช้งาน
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ color: 'warning.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {pricingData.stats.inactive}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    แผนที่ปิดใช้งาน
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon sx={{ color: 'info.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {pricingData.stats.monthly}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    แผนรายเดือน
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: 'secondary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {pricingData.stats.yearly}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    แผนรายปี
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          เกิดข้อผิดพลาดในการดึงข้อมูล: {error.message}
        </Alert>
      )}

      {/* Pricing Plans Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            รายการแผนราคา
          </Typography>
          
          {isLoading ? (
            <Box>
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} variant="rectangular" height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ชื่อแผน</TableCell>
                    <TableCell>ประเภท</TableCell>
                    <TableCell>ระยะเวลา</TableCell>
                    <TableCell>ราคาเต็ม</TableCell>
                    <TableCell>ส่วนลด</TableCell>
                    <TableCell>ราคาสุทธิ</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pricingData?.pricingPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {plan.name}
                          </Typography>
                          {plan.description && (
                            <Typography variant="caption" color="text.secondary">
                              {plan.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getPlanTypeLabel(plan.planType)} 
                          size="small"
                          color={plan.planType === 'YEARLY' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {plan.duration} {plan.planType === 'MONTHLY' ? 'เดือน' : 'ปี'}
                      </TableCell>
                      <TableCell>{formatPrice(plan.originalPrice)}</TableCell>
                      <TableCell>
                        {plan.discountPercent > 0 ? (
                          <Chip 
                            label={`-${plan.discountPercent}%`} 
                            size="small" 
                            color="success"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {formatPrice(plan.finalPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={plan.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                          size="small"
                          color={plan.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="แก้ไข">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(plan)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบ">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteConfirmId(plan.id)}
                              color="error"
                              disabled={deleting && deleteConfirmId === plan.id}
                            >
                              {deleting && deleteConfirmId === plan.id ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pricingData?.pricingPlans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          ยังไม่มีแผนราคา
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlan ? 'แก้ไขแผนราคา' : 'เพิ่มแผนราคาใหม่'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
              gap: 3 
            }}>
              <TextField
                fullWidth
                label="ชื่อแผน"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <FormControl fullWidth>
                <InputLabel>ประเภทแผน</InputLabel>
                <Select
                  value={formData.planType}
                  onChange={(e) => setFormData(prev => ({ ...prev, planType: e.target.value as 'MONTHLY' | 'YEARLY' }))}
                  label="ประเภทแผน"
                >
                  <MenuItem value="MONTHLY">รายเดือน</MenuItem>
                  <MenuItem value="YEARLY">รายปี</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="คำอธิบาย"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
              gap: 3, 
              mt: 3 
            }}>
              <TextField
                fullWidth
                label="ระยะเวลา"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1 }}
                helperText={formData.planType === 'MONTHLY' ? 'เดือน' : 'ปี'}
              />
              <TextField
                fullWidth
                label="ราคาเต็ม"
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="บาท"
              />
              <TextField
                fullWidth
                label="ส่วนลด"
                type="number"
                value={formData.discountPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                helperText="%"
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <Typography variant="subtitle2">
                  ราคาสุทธิ: {formatPrice(calculateFinalPrice())}
                </Typography>
              </Alert>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                ฟีเจอร์ที่ได้รับ
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  label="เพิ่มฟีเจอร์"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddFeature();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddFeature}
                  disabled={!newFeature.trim()}
                >
                  เพิ่ม
                </Button>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {formData.features.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    onDelete={() => handleRemoveFeature(feature)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
              gap: 3, 
              mt: 3 
            }}>
              <TextField
                fullWidth
                label="ลำดับการแสดง"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label="เปิดใช้งาน"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.originalPrice || submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitting 
              ? (editingPlan ? 'กำลังบันทึก...' : 'กำลังเพิ่ม...') 
              : (editingPlan ? 'บันทึก' : 'เพิ่ม')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!deleteConfirmId} 
        onClose={() => !deleting && setDeleteConfirmId(null)}
      >
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณแน่ใจหรือไม่ที่จะลบแผนราคานี้? การกระทำนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmId(null)}
            disabled={deleting}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} 
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {deleting ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 