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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Search,
  Visibility,
  Receipt,
  Restaurant,
  Person,
  Payment,
  DeliveryDining,
  FilterList,
  TrendingUp,
  CalendarToday
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  notes?: string;
  menuItem: {
    name: string;
    price: number;
    imageUrl?: string;
  };
  addons: {
    id: string;
    quantity: number;
    price: number;
    addon: {
      name: string;
      price: number;
    };
  }[];
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  isPaid: boolean;
  paidAt?: string;
  estimatedTime?: number;
  confirmedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  items: OrderItem[];
  paymentSlips: {
    id: string;
    status: string;
    transferAmount: number;
    submittedAt: string;
  }[];
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    byStatus: Record<string, { count: number; revenue: number }>;
    monthly: {
      revenue: number;
      orders: number;
    };
  };
}

export default function AdminOrdersPage() {
  const theme = useTheme();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrdersResponse['stats']>({
    byStatus: {},
    monthly: { revenue: 0, orders: 0 }
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchOrders();
    }
  }, [session, page, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
      setStats(data.stats);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PREPARING': return 'primary';
      case 'READY': return 'secondary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รอยืนยัน';
      case 'CONFIRMED': return 'ยืนยันแล้ว';
      case 'PREPARING': return 'กำลังเตรียม';
      case 'READY': return 'พร้อมส่ง';
      case 'DELIVERED': return 'ส่งเรียบร้อย';
      case 'CANCELLED': return 'ยกเลิก';
      default: return status;
    }
  };

  const getPaymentSlipStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
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
        จัดการออเดอร์
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 3,
          mb: 4,
          flexWrap: 'wrap'
        }}
      >
        {/* Monthly Revenue */}
        <Card
          sx={{
            flex: isMobile ? '1 1 100%' : '1 1 250px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp />
              <Typography variant="h6">รายได้เดือนนี้</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
              ฿{(stats.monthly?.revenue || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {stats.monthly?.orders || 0} ออเดอร์
            </Typography>
          </CardContent>
        </Card>

        {/* Order Status Stats */}
        {Object.entries(stats.byStatus).map(([status, data]) => (
          <Card
            key={status}
            sx={{
              flex: isMobile ? '1 1 100%' : '1 1 200px',
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
                {data.count}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ฿{data.revenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
            alignItems: isMobile ? 'stretch' : 'center'
          }}
        >
          <Box sx={{ flex: isMobile ? 1 : 2 }}>
            <TextField
              fullWidth
              placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า, เบอร์โทร..."
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
          <Box sx={{ flex: isMobile ? 1 : 1, minWidth: isMobile ? '100%' : 200 }}>
            <FormControl fullWidth>
              <InputLabel>สถานะออเดอร์</InputLabel>
              <Select
                value={statusFilter}
                label="สถานะออเดอร์"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">ทั้งหมด</MenuItem>
                <MenuItem value="PENDING">รอยืนยัน</MenuItem>
                <MenuItem value="CONFIRMED">ยืนยันแล้ว</MenuItem>
                <MenuItem value="PREPARING">กำลังเตรียม</MenuItem>
                <MenuItem value="READY">พร้อมส่ง</MenuItem>
                <MenuItem value="DELIVERED">ส่งเรียบร้อย</MenuItem>
                <MenuItem value="CANCELLED">ยกเลิก</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: isMobile ? 1 : 1, minWidth: isMobile ? '100%' : 120 }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={fetchOrders}
              fullWidth
              disabled={loading}
            >
              ค้นหา
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Orders List */}
      <Card>
        {isMobile ? (
          // Mobile Card Layout
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 1, ml: 2 }}>กำลังโหลด...</Typography>
              </Box>
            ) : orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  ไม่พบข้อมูลออเดอร์
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    sx={{
                      p: 2,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)'
                    }}
                  >
                    {/* Order Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        src={order.restaurant.imageUrl || undefined}
                        sx={{ width: 40, height: 40 }}
                      >
                        <Restaurant />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {order.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {order.restaurant.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                        <Chip
                          label={getStatusText(order.status)}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                        {order.paymentSlips.length > 0 && (
                          <Chip
                            label={`Payment: ${order.paymentSlips[0].status}`}
                            color={getPaymentSlipStatusColor(order.paymentSlips[0].status) as any}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Order Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          ลูกค้า:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.customerName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          เบอร์โทร:
                        </Typography>
                        <Typography variant="body2">
                          {order.customerPhone}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          รายการ:
                        </Typography>
                        <Typography variant="body2">
                          {order.items.length} รายการ
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          ยอดรวม:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ฿{order.total.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          สถานะการชำระ:
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: order.isPaid ? 'success.main' : 'warning.main' 
                        }}>
                          {order.isPaid ? '✅ ชำระแล้ว' : '⏳ รอชำระ'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          วันที่สั่ง:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(order.createdAt).toLocaleDateString('th-TH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailsOpen(true);
                        }}
                      >
                        ดูรายละเอียด
                      </Button>
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
                  <TableCell>เลขออเดอร์</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>ร้านอาหาร</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>ยอดรวม</TableCell>
                  <TableCell>วันที่สั่ง</TableCell>
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
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        ไม่พบข้อมูลออเดอร์
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {order.orderNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {order.items.length} รายการ
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {order.customerName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {order.customerPhone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={order.restaurant.imageUrl || undefined}
                            sx={{ width: 32, height: 32 }}
                          >
                            <Restaurant />
                          </Avatar>
                          <Typography variant="body2">
                            {order.restaurant.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(order.status)}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                        {order.paymentSlips.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={`Payment: ${order.paymentSlips[0].status}`}
                              color={getPaymentSlipStatusColor(order.paymentSlips[0].status) as any}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ฿{order.total.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.isPaid ? '✅ ชำระแล้ว' : '⏳ รอชำระ'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString('th-TH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="ดูรายละเอียด">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDetailsOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
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

      {/* Order Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>รายละเอียดออเดอร์</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 3
              }}
            >
              {/* Order Info */}
              <Box sx={{ flex: 1 }}>
                <Card sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    ข้อมูลออเดอร์
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">เลขออเดอร์</Typography>
                        <Typography variant="body1">{selectedOrder.orderNumber}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">สถานะ</Typography>
                        <Chip
                          label={getStatusText(selectedOrder.status)}
                          color={getStatusColor(selectedOrder.status) as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">วันที่สั่ง</Typography>
                        <Typography variant="body2">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">การชำระเงิน</Typography>
                        <Chip
                          label={selectedOrder.isPaid ? 'ชำระแล้ว' : 'รอชำระ'}
                          color={selectedOrder.isPaid ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                </Card>

                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    ข้อมูลลูกค้า
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">ชื่อ</Typography>
                      <Typography variant="body1">{selectedOrder.customerName}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">เบอร์โทร</Typography>
                      <Typography variant="body1">{selectedOrder.customerPhone}</Typography>
                    </Box>
                    
                    {selectedOrder.customerEmail && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">อีเมล</Typography>
                        <Typography variant="body1">{selectedOrder.customerEmail}</Typography>
                      </Box>
                    )}
                    
                    {selectedOrder.deliveryAddress && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">ที่อยู่จัดส่ง</Typography>
                        <Typography variant="body1">{selectedOrder.deliveryAddress}</Typography>
                      </Box>
                    )}
                    
                    {selectedOrder.deliveryNotes && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">หมายเหตุ</Typography>
                        <Typography variant="body1">{selectedOrder.deliveryNotes}</Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Box>

              {/* Order Items */}
              <Box sx={{ flex: 1 }}>
                <Card sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    รายการอาหาร
                  </Typography>
                  <List>
                    {selectedOrder.items.map((item) => (
                      <ListItem key={item.id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar src={item.menuItem.imageUrl || undefined}>
                            <Receipt />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body1">
                                {item.menuItem.name} x{item.quantity}
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                ฿{(item.price * item.quantity).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              {item.addons.length > 0 && (
                                <Box sx={{ mt: 0.5 }}>
                                  {item.addons.map((addon) => (
                                    <Typography key={addon.id} variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                      + {addon.addon.name} x{addon.quantity} (฿{addon.price * addon.quantity})
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              {item.notes && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                  หมายเหตุ: {item.notes}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>

                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    สรุปการชำระเงิน
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>ยอดรวม</Typography>
                      <Typography>฿{selectedOrder.subtotal.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>ค่าจัดส่ง</Typography>
                      <Typography>฿{selectedOrder.deliveryFee.toLocaleString()}</Typography>
                    </Box>
                    {selectedOrder.discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                        <Typography>ส่วนลด</Typography>
                        <Typography>-฿{selectedOrder.discount.toLocaleString()}</Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <Typography variant="h6">ยอดรวมสุทธิ</Typography>
                      <Typography variant="h6" color="primary">
                        ฿{selectedOrder.total.toLocaleString()}
                      </Typography>
                    </Box>

                    {selectedOrder.paymentSlips.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                          หลักฐานการโอนเงิน
                        </Typography>
                        {selectedOrder.paymentSlips.map((slip) => (
                          <Box key={slip.id} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">
                                ฿{slip.transferAmount.toLocaleString()}
                              </Typography>
                              <Chip
                                label={slip.status}
                                color={getPaymentSlipStatusColor(slip.status) as any}
                                size="small"
                              />
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(slip.submittedAt).toLocaleDateString('th-TH')}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 