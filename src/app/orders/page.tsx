'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  IconButton
} from '@mui/material';
import {
  Restaurant,
  Phone,
  LocationOn,
  Schedule,
  Payment,
  LocalShipping,
  Search,
  Receipt,
  Fastfood,
  CheckCircle,
  AccessTime,
  Cancel,
  Person,
  Close,
  CloudUpload,
  AttachMoney,
  Camera,
  DeleteOutline,
  PendingActions // เพิ่ม icon สำหรับ pending slip
} from '@mui/icons-material';
// import { useSession } from 'next-auth/react'; // ไม่ใช้แล้ว ใช้ session API แทน
import { useNotification } from '@/hooks/useGlobalNotification';
import FooterNavbar from '../components/FooterNavbar';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  notes?: string;
  menuItem: {
    id: string;
    name: string;
    imageUrl?: string;
    price: number;
  };
  addons: Array<{
    id: string;
    quantity: number;
    price: number;
    addon: {
      id: string;
      name: string;
      price: number;
    };
  }>;
}

interface PaymentSlip {
  id: string;
  slipImageUrl: string;
  transferAmount: number;
  transferDate: string;
  transferReference?: string;
  accountName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNotes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  promoCode?: string;
  total: number;
  paymentMethod?: string;
  isPaid: boolean;
  paidAt?: string;
  estimatedTime?: number;
  confirmedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  paymentSlips?: PaymentSlip[]; // เพิ่ม payment slips
  restaurant: {
    id: string;
    name: string;
    imageUrl?: string;
    address?: string;
    phone?: string;
  };
}

const statusConfig = {
  PENDING: { 
    label: 'รอยืนยัน', 
    color: '#FF9800', 
    bgColor: '#FFF3E0',
    icon: AccessTime
  },
  CONFIRMED: { 
    label: 'ยืนยันแล้ว', 
    color: '#2196F3', 
    bgColor: '#E3F2FD',
    icon: CheckCircle
  },
  PREPARING: { 
    label: 'กำลังทำ', 
    color: '#9C27B0', 
    bgColor: '#F3E5F5',
    icon: Fastfood
  },
  READY: { 
    label: 'พร้อมส่ง', 
    color: '#4CAF50', 
    bgColor: '#E8F5E8',
    icon: LocalShipping
  },
  DELIVERED: { 
    label: 'ส่งแล้ว', 
    color: '#4CAF50', 
    bgColor: '#E8F5E8',
    icon: CheckCircle
  },
  CANCELLED: { 
    label: 'ยกเลิก', 
    color: '#F44336', 
    bgColor: '#FFEBEE',
    icon: Cancel
  }
};

const paymentMethodLabels: Record<string, string> = {
  'cash': 'เงินสด',
  'transfer': 'โอนเงิน',
  'promptpay': 'PromptPay',
  'credit_card': 'บัตรเครดิต'
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  // Payment slip upload states
  const [slipDialogOpen, setSlipDialogOpen] = useState(false);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferTime, setTransferTime] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<Order | null>(null);
  
  const { showError, showSuccess } = useNotification();

  const statusTabs = [
    { label: 'ทั้งหมด', value: 'ALL' },
    { label: 'รอยืนยัน', value: 'PENDING' },
    { label: 'กำลังดำเนินการ', value: 'PREPARING' },
    { label: 'เสร็จสิ้น', value: 'DELIVERED' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // ตรวจสอบ session ก่อน
      const sessionResponse = await fetch('/api/auth/line-session');
      const sessionData = await sessionResponse.json();
      
      if (!sessionData.authenticated || !sessionData.user) {
        showError('กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ');
        return;
      }
      
      // เก็บข้อมูล user จาก session
      setSessionUser(sessionData.user);
      
      // ใช้ Session API เป็นหลัก - ให้ backend จัดการ user identification
      const response = await fetch('/api/order/my-orders', {
        method: 'GET',
        credentials: 'include', // ส่ง session cookies ไปด้วย
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        showError('ไม่สามารถโหลดรายการคำสั่งซื้อได้');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const selectedTabValue = statusTabs[selectedTab].value;
    let matchesStatus = selectedTabValue === 'ALL';
    
    if (!matchesStatus) {
      if (selectedTabValue === 'PREPARING') {
        matchesStatus = ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status);
      } else {
        matchesStatus = order.status === selectedTabValue;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusCounts = () => {
    return statusTabs.map(tab => ({
      ...tab,
      count: tab.value === 'ALL' 
        ? orders.length 
        : tab.value === 'PREPARING'
        ? orders.filter(order => ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)).length
        : orders.filter(order => order.status === tab.value).length
    }));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemTotal = (item: OrderItem) => {
    const baseTotal = item.price * item.quantity;
    const addonsTotal = item.addons.reduce((sum, addon) => 
      sum + (addon.price * addon.quantity), 0
    );
    return baseTotal + addonsTotal;
  };

  // Payment slip helper functions
  const hasPaymentSlip = (order: Order) => {
    return order.paymentSlips && order.paymentSlips.length > 0;
  };

  const getLatestPaymentSlip = (order: Order): PaymentSlip | null => {
    if (!order.paymentSlips || order.paymentSlips.length === 0) return null;
    return order.paymentSlips[0]; // เรียงตาม submittedAt desc แล้ว
  };

  const getPaymentSlipStatusMessage = (order: Order) => {
    const slip = getLatestPaymentSlip(order);
    if (!slip) return null;
    
    switch (slip.status) {
      case 'PENDING':
        return { text: 'รอการตรวจสอบสลิป', color: '#FF9800', bgColor: '#FFF3E0' };
      case 'APPROVED':
        return { text: 'ยืนยันการชำระแล้ว', color: '#4CAF50', bgColor: '#E8F5E8' };
      case 'REJECTED':
        return { text: 'สลิปไม่ถูกต้อง', color: '#F44336', bgColor: '#FFEBEE' };
      default:
        return null;
    }
  };

  const shouldShowSlipIcon = (order: Order) => {
    return hasPaymentSlip(order) && 
           (order.paymentMethod === 'transfer' || order.paymentMethod === 'promptpay');
  };

  // Payment slip functions
  const handleOpenSlipDialog = (order: Order) => {
    setSelectedOrderForSlip(order);
    
    // ถ้ามีสลิปเดิม ให้เติมข้อมูลเดิม
    const latestSlip = getLatestPaymentSlip(order);
    if (latestSlip) {
      setTransferAmount(latestSlip.transferAmount.toString());
      setAccountName(latestSlip.accountName);
      setTransferRef(latestSlip.transferReference || '');
      
      // แปลงวันที่
      const transferDate = new Date(latestSlip.transferDate);
      setTransferDate(transferDate.toISOString().split('T')[0]);
      setTransferTime(transferDate.toTimeString().slice(0, 5));
    } else {
      // ถ้าไม่มีสลิปเดิม ใช้วันที่ปัจจุบัน
      setTransferAmount('');
      setAccountName('');
      setTransferRef('');
      
      const now = new Date();
      setTransferDate(now.toISOString().split('T')[0]);
      setTransferTime(now.toTimeString().slice(0, 5));
    }
    
    setSlipDialogOpen(true);
  };

  const handleCloseSlipDialog = () => {
    setSlipDialogOpen(false);
    setSelectedOrderForSlip(null);
    setSlipFile(null);
    setSlipPreview(null);
    setTransferAmount('');
    setTransferDate('');
    setTransferTime('');
    setTransferRef('');
    setAccountName('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      setSlipFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSlipPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSlipFile(null);
    setSlipPreview(null);
  };

  const handleSubmitSlip = async () => {
    if (!selectedOrderForSlip || !slipFile) {
      showError('กรุณาเลือกไฟล์สลิปการโอนเงิน');
      return;
    }

    if (!transferAmount || !transferDate || !transferTime || !accountName) {
      showError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setUploadingSlip(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('orderId', selectedOrderForSlip.id);
      formData.append('orderNumber', selectedOrderForSlip.orderNumber);
      formData.append('transferAmount', transferAmount);
      formData.append('transferDate', transferDate);
      formData.append('transferTime', transferTime);
      formData.append('transferRef', transferRef);
      formData.append('accountName', accountName);

      const response = await fetch('/api/order/upload-payment-slip', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('อัปโหลดสลิปการโอนเงินเรียบร้อย'); // Use as success notification
        handleCloseSlipDialog();
        
        // Refresh orders to update payment status
        await fetchOrders();
      } else {
        showError(result.error || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป');
      }
    } catch (error) {
      console.error('Upload slip error:', error);
      showError('เกิดข้อผิดพลาดในการอัปโหลดสลิป');
    } finally {
      setUploadingSlip(false);
    }
  };

  if (!sessionUser && !loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#10B981', mb: 2 }} size={32} />
          <Typography variant="body1" sx={{ color: '#065f46', fontWeight: 500 }}>
            กำลังโหลดเมนู...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          📋 ประวัติการสั่งซื้อ
        </Typography>
        <Typography variant="body1" color="text.secondary">
          ดูรายการคำสั่งซื้อและติดตามสถานะ
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="ค้นหาด้วยเลขออเดอร์หรือชื่อร้าน"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 600,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            }
          }}
        />
      </Box>

      {/* Status Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 120,
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          {getOrderStatusCounts().map((tab, index) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge
                      badgeContent={tab.count}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -8,
                          top: -4,
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีประวัติการสั่งซื้อ'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'ลองใช้คำค้นหาอื่น' : 'เริ่มสั่งอาหารกันเถอะ!'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr', 
          gap: 2 
        }}>
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const StatusIcon = statusInfo.icon;

            return (
              <Card
                key={order.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  },
                  border: `1px solid ${statusInfo.color}20`,
                }}
                onClick={() => {
                  setSelectedOrder(order);
                  setDetailDialogOpen(true);
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        #{order.orderNumber}
                      </Typography>
                      <Chip
                        icon={<StatusIcon sx={{ fontSize: 16 }} />}
                        label={statusInfo.label}
                        size="small"
                        sx={{
                          backgroundColor: statusInfo.bgColor,
                          color: statusInfo.color,
                          fontWeight: 500,
                          '& .MuiChip-icon': {
                            color: statusInfo.color
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Restaurant Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={order.restaurant.imageUrl}
                      sx={{ width: 40, height: 40 }}
                    >
                      <Restaurant />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {order.restaurant.name}
                      </Typography>
                      {order.restaurant.address && (
                        <Typography variant="caption" color="text.secondary">
                          {order.restaurant.address}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Order Items Summary */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      รายการสินค้า ({order.items.length} รายการ)
                    </Typography>
                    {order.items.slice(0, 2).map((item, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {item.menuItem.name} x{item.quantity}
                        {item.addons.length > 0 && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {' '}+ {item.addons.length} เสริม
                          </Typography>
                        )}
                      </Typography>
                    ))}
                    {order.items.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        และอีก {order.items.length - 2} รายการ...
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Order Details */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      การชำระเงิน
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {/* Slip Icon */}
                      {shouldShowSlipIcon(order) && (
                        <Receipt 
                          sx={{ 
                            fontSize: 16, 
                            color: '#10B981',
                            mr: 0.5
                          }} 
                        />
                      )}
                      <Typography variant="caption" component="span">
                        {paymentMethodLabels[order.paymentMethod || ''] || order.paymentMethod}
                      </Typography>
                      {order.isPaid && (
                        <Chip 
                          label="ชำระแล้ว" 
                          size="small" 
                          color="success" 
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Payment Slip Status */}
                  {(() => {
                    const slipStatus = getPaymentSlipStatusMessage(order);
                    if (slipStatus) {
                      return (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            สถานะสลิป
                          </Typography>
                          <Chip 
                            label={slipStatus.text}
                            size="small"
                            icon={slipStatus.text === 'รอการตรวจสอบสลิป' ? <PendingActions sx={{ fontSize: 14 }} /> : undefined}
                            sx={{ 
                              height: 20, 
                              fontSize: '0.65rem',
                              backgroundColor: slipStatus.bgColor,
                              color: slipStatus.color,
                              border: `1px solid ${slipStatus.color}25`
                            }}
                          />
                        </Box>
                      );
                    }
                    return null;
                  })()}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      เวลาสั่ง
                    </Typography>
                    <Typography variant="caption">
                      {formatDateTime(order.createdAt)}
                    </Typography>
                  </Box>

                  {/* Upload/Edit Slip Button for PromptPay */}
                  {(order.paymentMethod === 'transfer' || order.paymentMethod === 'promptpay') && 
                   !order.isPaid && (
                    <Box sx={{ mb: 2 }}>
                      {(() => {
                        const latestSlip = getLatestPaymentSlip(order);
                        const hasSlip = hasPaymentSlip(order);
                        
                        // ไม่มีสลิปเลย
                        if (!hasSlip) {
                          return (
                            <Button
                              fullWidth
                              variant="outlined"
                              color="primary"
                              startIcon={<CloudUpload />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSlipDialog(order);
                              }}
                              sx={{
                                borderRadius: '12px',
                                py: 1,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                borderColor: '#10B981',
                                color: '#10B981',
                                '&:hover': {
                                  borderColor: '#059669',
                                  backgroundColor: 'rgba(16, 185, 129, 0.05)'
                                }
                              }}
                            >
                              แนบสลิปการโอนเงิน
                            </Button>
                          );
                        }
                        
                        // มีสลิปแล้ว
                        if (latestSlip?.status === 'PENDING') {
                          return (
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<PendingActions />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSlipDialog(order);
                              }}
                              sx={{
                                borderRadius: '12px',
                                py: 1,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                borderColor: '#FF9800',
                                color: '#FF9800',
                                '&:hover': {
                                  borderColor: '#F57C00',
                                  backgroundColor: 'rgba(255, 152, 0, 0.05)'
                                }
                              }}
                            >
                              แก้ไขสลิป (รอตรวจสอบ)
                            </Button>
                          );
                        }
                        
                        if (latestSlip?.status === 'REJECTED') {
                          return (
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<CloudUpload />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSlipDialog(order);
                              }}
                              sx={{
                                borderRadius: '12px',
                                py: 1,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                borderColor: '#F44336',
                                color: '#F44336',
                                '&:hover': {
                                  borderColor: '#D32F2F',
                                  backgroundColor: 'rgba(244, 67, 54, 0.05)'
                                }
                              }}
                            >
                              ส่งสลิปใหม่ (ถูกปฏิเสธ)
                            </Button>
                          );
                        }
                        
                        return null;
                      })()}
                    </Box>
                  )}

                  {/* Total Price at Bottom */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      ยอดรวมทั้งหมด
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      ฿{order.total.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={false}
        PaperProps={{
          sx: {
            borderRadius: 1,
            maxHeight: '95vh',
            minHeight: '60vh',
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)' }
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }
        }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ 
              pb: 1, 
              px: { xs: 2, sm: 3 },
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              backgroundColor: 'background.paper',
              zIndex: 1
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                    รายละเอียดออเดอร์
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    #{selectedOrder.orderNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={(() => {
                      const IconComponent = statusConfig[selectedOrder.status].icon;
                      return <IconComponent sx={{ fontSize: 16 }} />;
                    })()}
                    label={statusConfig[selectedOrder.status].label}
                    sx={{
                      backgroundColor: statusConfig[selectedOrder.status].bgColor,
                      color: statusConfig[selectedOrder.status].color,
                      fontWeight: 500
                    }}
                  />
                  <IconButton 
                    onClick={() => setDetailDialogOpen(false)}
                    size="small"
                    sx={{ 
                      ml: 1,
                      backgroundColor: 'grey.100',
                      '&:hover': { backgroundColor: 'grey.200' }
                    }}
                  >
                    <Close />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent 
              sx={{ 
                px: { xs: 2, sm: 3 },
                py: 2,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '3px',
                  '&:hover': {
                    background: '#a8a8a8',
                  },
                },
              }}
            >
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                gap: 3, 
                mb: 3,
                mt:3
              }}>
                {/* Restaurant Information */}
                <Box>
                  <Card variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Restaurant /> ข้อมูลร้าน
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>ชื่อร้าน:</strong> {selectedOrder.restaurant.name}
                    </Typography>
                    {selectedOrder.restaurant.address && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>ที่อยู่:</strong> {selectedOrder.restaurant.address}
                      </Typography>
                    )}
                    {selectedOrder.restaurant.phone && (
                      <Typography variant="body2">
                        <strong>โทร:</strong> {selectedOrder.restaurant.phone}
                      </Typography>
                    )}
                  </Card>
                </Box>

                {/* Order Information */}
                <Box>
                  <Card variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Receipt /> ข้อมูลออเดอร์
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>เวลาสั่ง:</strong> {formatDateTime(selectedOrder.createdAt)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" component="span">
                        <strong>การชำระเงิน:</strong> {paymentMethodLabels[selectedOrder.paymentMethod || ''] || selectedOrder.paymentMethod}
                      </Typography>
                      {selectedOrder.isPaid && (
                        <Chip label="ชำระแล้ว" size="small" color="success" />
                      )}
                    </Box>
                    {selectedOrder.deliveryNotes && (
                      <Typography variant="body2">
                        <strong>หมายเหตุ:</strong> {selectedOrder.deliveryNotes}
                      </Typography>
                    )}
                  </Card>
                </Box>
              </Box>

              {/* Order Items */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  รายการสินค้า
                </Typography>
                {selectedOrder.items.map((item, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Avatar
                        variant="rounded"
                        src={item.menuItem.imageUrl}
                        sx={{ width: 60, height: 60 }}
                      >
                        <Fastfood />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {item.menuItem.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          จำนวน: {item.quantity} | ราคา: ฿{item.price.toLocaleString()} ต่อชิ้น
                        </Typography>
                        
                        {item.addons.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              รายการเสริม:
                            </Typography>
                            {item.addons.map((addon, addonIndex) => (
                              <Typography key={addonIndex} variant="caption" sx={{ display: 'block', ml: 1 }}>
                                • {addon.addon.name} x{addon.quantity} (+฿{addon.price.toLocaleString()})
                              </Typography>
                            ))}
                          </Box>
                        )}
                        
                        {item.notes && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            หมายเหตุ: {item.notes}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          ฿{getItemTotal(item).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>

              {/* Order Summary */}
              <Box>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    สรุปการสั่งซื้อ
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">ค่าอาหาร</Typography>
                    <Typography variant="body2">฿{selectedOrder.subtotal.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">ค่าจัดส่ง</Typography>
                    <Typography variant="body2">฿{selectedOrder.deliveryFee.toLocaleString()}</Typography>
                  </Box>
                  {selectedOrder.tax > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">ภาษี</Typography>
                      <Typography variant="body2">฿{selectedOrder.tax.toLocaleString()}</Typography>
                    </Box>
                  )}
                  {selectedOrder.discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">ส่วนลด</Typography>
                        {selectedOrder.promoCode && (
                          <Chip 
                            label={selectedOrder.promoCode} 
                            size="small" 
                            color="success" 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.7rem',
                              backgroundColor: '#E8F5E8',
                              color: '#2E7D32'
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#2E7D32', fontWeight: 500 }}>
                        -฿{selectedOrder.discount.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>ยอดรวม</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      ฿{selectedOrder.total.toLocaleString()}
                    </Typography>
                  </Box>
                </Card>
              </Box>

              {/* Payment Slip Information */}
              {hasPaymentSlip(selectedOrder) && (
                <Box sx={{ mb: 3 , mt: 3}}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt /> ข้อมูลสลิปการโอนเงิน
                  </Typography>
                  {(() => {
                    const slip = getLatestPaymentSlip(selectedOrder);
                    if (!slip) return null;
                    
                    return (
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          {/* Slip Image */}
                          <Box 
                            component="img"
                            src={slip.slipImageUrl}
                            alt="Payment Slip"
                            sx={{
                              width: 100,
                              height: 120,
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #E5E7EB',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              // เปิดรูปใหญ่ในหน้าต่างใหม่
                              window.open(slip.slipImageUrl, '_blank');
                            }}
                          />
                          
                          {/* Slip Details */}
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                สถานะ:
                              </Typography>
                              {(() => {
                                const statusMessage = getPaymentSlipStatusMessage(selectedOrder);
                                if (statusMessage) {
                                  return (
                                    <Chip 
                                      label={statusMessage.text}
                                      size="small"
                                      icon={statusMessage.text === 'รอการตรวจสอบสลิป' ? <PendingActions sx={{ fontSize: 14 }} /> : undefined}
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        backgroundColor: statusMessage.bgColor,
                                        color: statusMessage.color,
                                        border: `1px solid ${statusMessage.color}25`
                                      }}
                                    />
                                  );
                                }
                                return null;
                              })()}
                            </Box>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>ยอดโอน:</strong> ฿{slip.transferAmount.toLocaleString()}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>วันที่โอน:</strong> {formatDateTime(slip.transferDate)}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>ชื่อบัญชีผู้โอน:</strong> {slip.accountName}
                            </Typography>
                            
                            {slip.transferReference && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>หมายเลขอ้างอิง:</strong> {slip.transferReference}
                              </Typography>
                            )}
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>เวลาที่ส่ง:</strong> {formatDateTime(slip.submittedAt)}
                            </Typography>
                            
                            {slip.adminNotes && (
                              <Typography variant="body2" sx={{ 
                                mt: 1, 
                                p: 1, 
                                backgroundColor: slip.status === 'REJECTED' ? '#FFEBEE' : '#F0FDF4',
                                borderRadius: '6px',
                                fontSize: '0.85rem'
                              }}>
                                <strong>หมายเหตุจากแอดมิน:</strong> {slip.adminNotes}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })()}
                </Box>
              )}
            </DialogContent>

            <DialogActions 
              sx={{ 
                p: 3, 
                pt: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'grey.50',
                position: 'sticky',
                bottom: 0,
                zIndex: 1
              }}
            >
              {/* Upload/Edit Slip Button for PromptPay in Detail Dialog */}
              {(selectedOrder.paymentMethod === 'transfer' || selectedOrder.paymentMethod === 'promptpay') && 
               !selectedOrder.isPaid && (() => {
                 const latestSlip = getLatestPaymentSlip(selectedOrder);
                 const hasSlip = hasPaymentSlip(selectedOrder);
                 
                 if (!hasSlip) {
                   return (
                     <Button
                       onClick={() => {
                         setDetailDialogOpen(false);
                         handleOpenSlipDialog(selectedOrder);
                       }}
                       variant="outlined"
                       startIcon={<CloudUpload />}
                       sx={{
                         borderRadius: '12px',
                         py: 1.5,
                         mr: 1,
                         flex: 1,
                         borderColor: '#10B981',
                         color: '#10B981',
                         '&:hover': {
                           borderColor: '#059669',
                           backgroundColor: 'rgba(16, 185, 129, 0.05)'
                         }
                       }}
                     >
                       แนบสลิป
                     </Button>
                   );
                 }
                 
                 if (latestSlip?.status === 'PENDING') {
                   return (
                     <Button
                       onClick={() => {
                         setDetailDialogOpen(false);
                         handleOpenSlipDialog(selectedOrder);
                       }}
                       variant="outlined"
                       startIcon={<PendingActions />}
                       sx={{
                         borderRadius: '12px',
                         py: 1.5,
                         mr: 1,
                         flex: 1,
                         borderColor: '#FF9800',
                         color: '#FF9800',
                         '&:hover': {
                           borderColor: '#F57C00',
                           backgroundColor: 'rgba(255, 152, 0, 0.05)'
                         }
                       }}
                     >
                       แก้ไขสลิป
                     </Button>
                   );
                 }
                 
                 if (latestSlip?.status === 'REJECTED') {
                   return (
                     <Button
                       onClick={() => {
                         setDetailDialogOpen(false);
                         handleOpenSlipDialog(selectedOrder);
                       }}
                       variant="outlined"
                       startIcon={<CloudUpload />}
                       sx={{
                         borderRadius: '12px',
                         py: 1.5,
                         mr: 1,
                         flex: 1,
                         borderColor: '#F44336',
                         color: '#F44336',
                         '&:hover': {
                           borderColor: '#D32F2F',
                           backgroundColor: 'rgba(244, 67, 54, 0.05)'
                         }
                       }}
                     >
                       ส่งสลิปใหม่
                     </Button>
                   );
                 }
                 
                 return null;
               })()}
              
              <Button 
                onClick={() => setDetailDialogOpen(false)}
                variant="contained"
                size="large"
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  fontWeight: 600,
                  flex: (selectedOrder.paymentMethod === 'transfer' || selectedOrder.paymentMethod === 'promptpay') && !selectedOrder.isPaid ? 1 : 'auto',
                  minWidth: 'auto'
                }}
              >
                ปิด
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Payment Slip Upload Dialog */}
      <Dialog
        open={slipDialogOpen}
        onClose={handleCloseSlipDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={true} // เต็มหน้าจอในมือถือ
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: '20px' }, // ไม่มี border radius ในมือถือ
            overflow: 'hidden',
            height: { xs: '100vh', sm: 'auto' }, // เต็มความสูงในมือถือ
            backgroundColor: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white',
          textAlign: 'center',
          py: { xs: 2, sm: 3 }, // ลด padding ในมือถือ
          position: 'relative'
        }}>
          {/* ปุ่มปิดสำหรับมือถือ */}
          <IconButton
            onClick={handleCloseSlipDialog}
            sx={{
              position: 'absolute',
              right: { xs: 8, sm: 16 },
              top: { xs: 8, sm: 16 },
              color: 'black',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            <Close />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {(() => {
                if (!selectedOrderForSlip) return 'แนบสลิปการโอนเงิน';
                const latestSlip = getLatestPaymentSlip(selectedOrderForSlip);
                const hasSlip = hasPaymentSlip(selectedOrderForSlip);
                
                if (!hasSlip) return 'แนบสลิปการโอนเงิน';
                if (latestSlip?.status === 'PENDING') return 'แก้ไขสลิปการโอนเงิน';
                if (latestSlip?.status === 'REJECTED') return 'ส่งสลิปใหม่';
                
                return 'แนบสลิปการโอนเงิน';
              })()}
            </Typography>
          </Box>
          {selectedOrderForSlip && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              ออเดอร์ #{selectedOrderForSlip.orderNumber}
              {(() => {
                const latestSlip = getLatestPaymentSlip(selectedOrderForSlip);
                if (latestSlip?.status === 'REJECTED') {
                  return ' (สลิปถูกปฏิเสธ)';
                }
                if (latestSlip?.status === 'PENDING') {
                  return ' (รอการตรวจสอบ)';
                }
                return '';
              })()}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent sx={{ 
          p: { xs: 2, sm: 3 }, // ลด padding ในมือถือ
          flex: 1, // ใช้พื้นที่ที่เหลือ
          overflowY: 'auto' // scroll ได้ถ้าเนื้อหายาว
        }}>
          {/* Order Summary */}
          {selectedOrderForSlip && (
            <Box sx={{ 
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '12px',
              p: 2,
              mb: 3
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#065F46' }}>
                ข้อมูลการโอนเงิน
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">ร้านอาหาร:</Typography>
                <Typography variant="body2">{selectedOrderForSlip.restaurant.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">ยอดที่ต้องชำระ:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                  ฿{selectedOrderForSlip.total.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Show rejection reason if applicable */}
          {selectedOrderForSlip && (() => {
            const latestSlip = getLatestPaymentSlip(selectedOrderForSlip);
            if (latestSlip?.status === 'REJECTED' && latestSlip.adminNotes) {
              return (
                <Box sx={{ 
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  p: 2,
                  mb: 3
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#DC2626' }}>
                    เหตุผลที่ถูกปฏิเสธ
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#7F1D1D' }}>
                    {latestSlip.adminNotes}
                  </Typography>
                </Box>
              );
            }
            return null;
          })()}

          {/* File Upload Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Camera /> รูปสลิปการโอนเงิน
            </Typography>
            
            {!slipPreview ? (
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="slip-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="slip-upload">
                  <Box
                    sx={{
                      border: '2px dashed #D1D5DB',
                      borderRadius: '12px',
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#FAFAFA',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#10B981',
                        backgroundColor: '#F0FDF4'
                      }
                    }}
                  >
                    <CloudUpload sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                      คลิกเพื่อเลือกรูปสลิป
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      รองรับไฟล์: JPG, PNG (ขนาดไม่เกิน 5MB)
                    </Typography>
                  </Box>
                </label>
              </Box>
            ) : (
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={slipPreview}
                  alt="Slip Preview"
                  sx={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}
                />
                <IconButton
                  onClick={handleRemoveFile}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(220, 38, 38, 0.9)'
                    }
                  }}
                  size="small"
                >
                  <DeleteOutline />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Transfer Details Form */}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="ยอดเงินที่โอน"
              value={transferAmount}
             
              onChange={(e) => setTransferAmount(e.target.value)}
              type="number"
              required
              fullWidth
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>฿</Typography>,
                inputProps: { min: 0 }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                  
                }
              }}
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="วันที่โอน"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
              <TextField
                label="เวลาที่โอน"
                value={transferTime}
                onChange={(e) => setTransferTime(e.target.value)}
                type="time"
                required
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
            </Box>

            <TextField
              label="ชื่อบัญชีผู้โอน"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              fullWidth
              placeholder="เช่น นายสมชาย ใจดี"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />

            <TextField
              label="หมายเลขอ้างอิง (ถ้ามี)"
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
              fullWidth
              placeholder="เช่น T2024010112345"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 }, 
          pt: { xs: 1, sm: 1 },
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' } // แนวตั้งในมือถือ
        }}>
          <Button
            onClick={handleCloseSlipDialog}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: '12px',
              py: 1.5,
              borderColor: '#E5E7EB',
              color: '#6B7280',
              display: { xs: 'none', sm: 'flex' } // ซ่อนในมือถือ (มีปุ่ม X แล้ว)
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmitSlip}
            variant="contained"
            fullWidth
            disabled={uploadingSlip || !slipFile}
            sx={{
              borderRadius: '12px',
              py: 1.5,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              },
              '&:disabled': {
                background: '#E5E7EB',
                color: '#9CA3AF'
              }
            }}
          >
            {uploadingSlip ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
                กำลังอัปโหลด...
              </Box>
            ) : (
              'ส่งสลิปการโอนเงิน'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer Navigation */}
      <FooterNavbar />
    </Box>
  );
} 