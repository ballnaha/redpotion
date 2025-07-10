'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Divider,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import {
  Restaurant,
  Person,
  Phone,
  LocationOn,
  Schedule,
  Payment,
  LocalShipping,
  MoreVert,
  CheckCircle,
  Cancel,
  AccessTime,
  Search,
  Receipt,
  Fastfood,
  Add
} from '@mui/icons-material';
import { useNotification } from '@/hooks/useGlobalNotification';

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
}

const statusConfig = {
  PENDING: { 
    label: 'รอยืนยัน', 
    color: '#FF9800' as const, 
    bgColor: '#FFF3E0',
    icon: AccessTime
  },
  CONFIRMED: { 
    label: 'ยืนยันแล้ว', 
    color: '#2196F3' as const, 
    bgColor: '#E3F2FD',
    icon: CheckCircle
  },
  PREPARING: { 
    label: 'กำลังทำ', 
    color: '#9C27B0' as const, 
    bgColor: '#F3E5F5',
    icon: Fastfood
  },
  READY: { 
    label: 'พร้อมส่ง', 
    color: '#4CAF50' as const, 
    bgColor: '#E8F5E8',
    icon: LocalShipping
  },
  DELIVERED: { 
    label: 'ส่งแล้ว', 
    color: '#4CAF50' as const, 
    bgColor: '#E8F5E8',
    icon: CheckCircle
  },
  CANCELLED: { 
    label: 'ยกเลิก', 
    color: '#F44336' as const, 
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

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  const statusTabs = [
    { label: 'ทั้งหมด', value: 'ALL' },
    { label: 'รอยืนยัน', value: 'PENDING' },
    { label: 'ยืนยันแล้ว', value: 'CONFIRMED' },
    { label: 'กำลังทำ', value: 'PREPARING' },
    { label: 'พร้อมส่ง', value: 'READY' },
    { label: 'เสร็จสิ้น', value: 'DELIVERED' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/restaurant/orders');
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/restaurant/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrders(); // Refresh orders
        showSuccess('อัปเดตสถานะเรียบร้อย');
        setAnchorEl(null);
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'ไม่สามารถอัปเดตสถานะได้');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    
    const selectedTabValue = statusTabs[selectedTab].value;
    const matchesStatus = selectedTabValue === 'ALL' || order.status === selectedTabValue;
    
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusCounts = () => {
    return statusTabs.map(tab => ({
      ...tab,
      count: tab.value === 'ALL' 
        ? orders.length 
        : orders.filter(order => order.status === tab.value).length
    }));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    event.stopPropagation();
    setSelectedOrder(order);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleViewDetails = () => {
    setDetailDialogOpen(true);
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          📋 รายการคำสั่งซื้อ
        </Typography>
        <Typography variant="body1" color="text.secondary">
          จัดการและติดตามคำสั่งซื้อของลูกค้า
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="ค้นหาด้วยเลขออเดอร์, ชื่อลูกค้า, หรือเบอร์โทร"
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

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีคำสั่งซื้อ'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'ลองใช้คำค้นหาอื่น' : 'คำสั่งซื้อจะแสดงที่นี่เมื่อมีลูกค้าสั่งซื้อ'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
          gap: 3 
        }}>
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const StatusIcon = statusInfo.icon;

            return (
              <Box key={order.id}>
                <Card
                  sx={{
                    height: '100%',
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
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, order)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Customer Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, backgroundColor: 'primary.light' }}>
                        <Person sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {order.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customerPhone}
                        </Typography>
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
                      <Typography variant="body2" color="text.secondary">
                        ยอดรวม
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                        ฿{order.total.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        การชำระเงิน
                      </Typography>
                      <Typography variant="caption">
                        {paymentMethodLabels[order.paymentMethod || ''] || order.paymentMethod}
                        {order.isPaid && (
                          <Chip 
                            label="ชำระแล้ว" 
                            size="small" 
                            color="success" 
                            sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        เวลาสั่ง
                      </Typography>
                      <Typography variant="caption">
                        {formatDateTime(order.createdAt)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 180,
            borderRadius: 2
          }
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <Receipt />
          </ListItemIcon>
          <ListItemText>ดูรายละเอียด</ListItemText>
        </MenuItem>
        
        {selectedOrder?.status === 'PENDING' && (
          <MenuItem onClick={() => updateOrderStatus(selectedOrder.id, 'CONFIRMED')}>
            <ListItemIcon>
              <CheckCircle />
            </ListItemIcon>
            <ListItemText>ยืนยันออเดอร์</ListItemText>
          </MenuItem>
        )}
        
        {selectedOrder?.status === 'CONFIRMED' && (
          <MenuItem onClick={() => updateOrderStatus(selectedOrder.id, 'PREPARING')}>
            <ListItemIcon>
              <Fastfood />
            </ListItemIcon>
            <ListItemText>เริ่มทำอาหาร</ListItemText>
          </MenuItem>
        )}
        
        {selectedOrder?.status === 'PREPARING' && (
          <MenuItem onClick={() => updateOrderStatus(selectedOrder.id, 'READY')}>
            <ListItemIcon>
              <LocalShipping />
            </ListItemIcon>
            <ListItemText>พร้อมส่ง</ListItemText>
          </MenuItem>
        )}
        
        {selectedOrder?.status === 'READY' && (
          <MenuItem onClick={() => updateOrderStatus(selectedOrder.id, 'DELIVERED')}>
            <ListItemIcon>
              <CheckCircle />
            </ListItemIcon>
            <ListItemText>ส่งแล้ว</ListItemText>
          </MenuItem>
        )}
        
        {selectedOrder?.status !== 'DELIVERED' && selectedOrder?.status !== 'CANCELLED' && (
          <MenuItem 
            onClick={() => selectedOrder && updateOrderStatus(selectedOrder.id, 'CANCELLED')}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Cancel sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>ยกเลิกออเดอร์</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Order Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  รายละเอียดออเดอร์ #{selectedOrder.orderNumber}
                </Typography>
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
              </Box>
            </DialogTitle>

            <DialogContent>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                gap: 3, 
                mb: 3 
              }}>
                {/* Customer Information */}
                <Box>
                  <Card variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person /> ข้อมูลลูกค้า
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>ชื่อ:</strong> {selectedOrder.customerName}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>โทร:</strong> {selectedOrder.customerPhone}
                    </Typography>
                    {selectedOrder.customerEmail && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>อีเมล:</strong> {selectedOrder.customerEmail}
                      </Typography>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <Typography variant="body2">
                        <strong>ที่อยู่:</strong> {selectedOrder.deliveryAddress}
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
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>การชำระเงิน:</strong> {paymentMethodLabels[selectedOrder.paymentMethod || ''] || selectedOrder.paymentMethod}
                      {selectedOrder.isPaid && (
                        <Chip label="ชำระแล้ว" size="small" color="success" sx={{ ml: 1 }} />
                      )}
                    </Typography>
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
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>ยอดรวม</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ฿{selectedOrder.total.toLocaleString()}
                      </Typography>
                    </Box>
                  </Card>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>
                ปิด
              </Button>
              {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                <Button
                  variant="contained"
                  disabled={actionLoading}
                  onClick={() => {
                    let nextStatus = '';
                    switch (selectedOrder.status) {
                      case 'PENDING': nextStatus = 'CONFIRMED'; break;
                      case 'CONFIRMED': nextStatus = 'PREPARING'; break;
                      case 'PREPARING': nextStatus = 'READY'; break;
                      case 'READY': nextStatus = 'DELIVERED'; break;
                    }
                    if (nextStatus) {
                      updateOrderStatus(selectedOrder.id, nextStatus);
                      setDetailDialogOpen(false);
                    }
                  }}
                  startIcon={actionLoading ? <CircularProgress size={16} /> : null}
                >
                  {actionLoading ? 'กำลังอัปเดต...' : 
                    selectedOrder.status === 'PENDING' ? 'ยืนยันออเดอร์' :
                    selectedOrder.status === 'CONFIRMED' ? 'เริ่มทำอาหาร' :
                    selectedOrder.status === 'PREPARING' ? 'พร้อมส่ง' :
                    selectedOrder.status === 'READY' ? 'ส่งแล้ว' : ''
                  }
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 