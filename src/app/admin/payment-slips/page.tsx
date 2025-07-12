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
  Link as MuiLink,
  useMediaQuery
} from '@mui/material';
import {
  Search,
  Visibility,
  CheckCircle,
  Cancel,
  Receipt,
  Restaurant,
  AccountBalance,
  DateRange,
  FilterList,
  Warning,
  Image as ImageIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/contexts/NotificationContext';
import Image from 'next/image';

interface PaymentSlip {
  id: string;
  slipImageUrl: string;
  transferAmount: number;
  transferDate: string;
  transferReference?: string;
  accountName: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNotes?: string;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
    restaurant: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  };
}

interface PaymentSlipsResponse {
  paymentSlips: PaymentSlip[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    byStatus: Record<string, { count: number; amount: number }>;
    pendingCount: number;
  };
}

export default function AdminPaymentSlipsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: session } = useSession();
  const { showSuccess, showError } = useNotification();
  
  const [paymentSlips, setPaymentSlips] = useState<PaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentSlipsResponse['stats']>({
    byStatus: {},
    pendingCount: 0
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
  const [selectedSlip, setSelectedSlip] = useState<PaymentSlip | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchPaymentSlips();
    }
  }, [session, page, statusFilter, searchTerm]);

  const fetchPaymentSlips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/payment-slips?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment slips');
      }
      
      const data: PaymentSlipsResponse = await response.json();
      setPaymentSlips(data.paymentSlips);
      setPagination(data.pagination);
      setStats(data.stats);
      
    } catch (error) {
      console.error('Error fetching payment slips:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลหลักฐานการโอนเงิน');
    } finally {
      setLoading(false);
    }
  };

  const handleSlipAction = async (slipId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionLoading(slipId);
      
      const response = await fetch('/api/admin/payment-slips', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slipId,
          action,
          adminNotes: action === 'REJECT' ? adminNotes : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update payment slip');
      }

      // Refresh data
      await fetchPaymentSlips();
      setDetailsOpen(false);
      setAdminNotes('');
      
      // Show success message
      if (action === 'APPROVE') {
        showSuccess('อนุมัติหลักฐานการโอนเงินเรียบร้อยแล้ว');
      } else {
        showSuccess('ปฏิเสธหลักฐานการโอนเงินเรียบร้อยแล้ว');
      }
      
    } catch (error) {
      console.error('Error updating payment slip:', error);
      showError('เกิดข้อผิดพลาดในการอัปเดตหลักฐานการโอนเงิน');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'อนุมัติแล้ว';
      case 'PENDING': return 'รออนุมัติ';
      case 'REJECTED': return 'ปฏิเสธ';
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
        จัดการหลักฐานการโอนเงิน
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Pending Alert */}
      {stats.pendingCount > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<Warning />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setStatusFilter('PENDING')}
            >
              ดูรายการ
            </Button>
          }
        >
          มีหลักฐานการโอนเงิน {stats.pendingCount} รายการรอการอนุมัติ
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
        {Object.entries(stats.byStatus).map(([status, data]) => (
          <Card
            key={status}
            sx={{
              flex: isMobile ? '1 1 100%' : '1 1 300px',
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
                ฿{data.amount.toLocaleString()}
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
              placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า, ร้านอาหาร..."
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
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={statusFilter}
                label="สถานะ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">ทั้งหมด</MenuItem>
                <MenuItem value="PENDING">รออนุมัติ</MenuItem>
                <MenuItem value="APPROVED">อนุมัติแล้ว</MenuItem>
                <MenuItem value="REJECTED">ปฏิเสธ</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: isMobile ? 1 : 1, minWidth: isMobile ? '100%' : 120 }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={fetchPaymentSlips}
              fullWidth
              disabled={loading}
            >
              ค้นหา
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Payment Slips List */}
      <Card>
        {isMobile ? (
          // Mobile Card Layout
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 1, ml: 2 }}>กำลังโหลด...</Typography>
              </Box>
            ) : paymentSlips.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  ไม่พบข้อมูลหลักฐานการโอนเงิน
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {paymentSlips.map((slip) => (
                  <Card
                    key={slip.id}
                    sx={{
                      p: 2,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)'
                    }}
                  >
                    {/* Order & Customer Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        src={slip.order.restaurant.imageUrl || undefined}
                        sx={{ width: 40, height: 40 }}
                      >
                        <Restaurant />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {slip.order.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {slip.order.restaurant.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusText(slip.status)}
                        color={getStatusColor(slip.status) as any}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Payment Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          ลูกค้า:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {slip.order.customerName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          จำนวนเงิน:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ฿{slip.transferAmount.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          ชื่อบัญชี:
                        </Typography>
                        <Typography variant="body2">
                          {slip.accountName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          วันที่ส่ง:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(slip.submittedAt).toLocaleDateString('th-TH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => {
                          setSelectedSlip(slip);
                          setDetailsOpen(true);
                        }}
                      >
                        ดูรายละเอียด
                      </Button>
                      
                      {slip.status === 'PENDING' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleSlipAction(slip.id, 'APPROVE')}
                            disabled={actionLoading === slip.id}
                          >
                            {actionLoading === slip.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              'อนุมัติ'
                            )}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => {
                              setSelectedSlip(slip);
                              setDetailsOpen(true);
                            }}
                            disabled={actionLoading === slip.id}
                          >
                            ปฏิเสธ
                          </Button>
                        </>
                      )}
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
                  <TableCell>ออเดอร์</TableCell>
                  <TableCell>ลูกค้า</TableCell>
                  <TableCell>ร้านอาหาร</TableCell>
                  <TableCell>จำนวนเงิน</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>วันที่ส่ง</TableCell>
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
                ) : paymentSlips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        ไม่พบข้อมูลหลักฐานการโอนเงิน
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentSlips.map((slip) => (
                    <TableRow key={slip.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {slip.order.orderNumber}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            ฿{slip.order.total.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {slip.order.customerName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {slip.order.customerPhone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={slip.order.restaurant.imageUrl || undefined}
                            sx={{ width: 32, height: 32 }}
                          >
                            <Restaurant />
                          </Avatar>
                          <Typography variant="body2">
                            {slip.order.restaurant.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ฿{slip.transferAmount.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {slip.accountName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(slip.status)}
                          color={getStatusColor(slip.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(slip.submittedAt).toLocaleDateString('th-TH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="ดูรายละเอียด">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSlip(slip);
                                setDetailsOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          
                          {slip.status === 'PENDING' && (
                            <>
                              <Tooltip title="อนุมัติ">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleSlipAction(slip.id, 'APPROVE')}
                                  disabled={actionLoading === slip.id}
                                >
                                  {actionLoading === slip.id ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <CheckCircle />
                                  )}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="ปฏิเสธ">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedSlip(slip);
                                    setDetailsOpen(true);
                                  }}
                                  disabled={actionLoading === slip.id}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </>
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

      {/* Payment Slip Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>รายละเอียดหลักฐานการโอนเงิน</DialogTitle>
        <DialogContent>
          {selectedSlip && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 3
              }}
            >
              {/* Slip Image */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  หลักฐานการโอนเงิน
                </Typography>
                <Card sx={{ p: 2, textAlign: 'center' }}>
                  <Box
                    component="div"
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 300,
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                    onClick={() => window.open(selectedSlip.slipImageUrl, '_blank')}
                  >
                    <Image
                      src={selectedSlip.slipImageUrl}
                      alt="Payment Slip"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    คลิกเพื่อดูรูปขนาดเต็ม
                  </Typography>
                </Card>
              </Box>

              {/* Details */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  ข้อมูลการโอนเงิน
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">เลขออเดอร์</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {selectedSlip.order.orderNumber}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: 2
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="textSecondary">จำนวนเงินที่โอน</Typography>
                      <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                        ฿{selectedSlip.transferAmount.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="textSecondary">ยอดออเดอร์</Typography>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        ฿{selectedSlip.order.total.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">ชื่อบัญชีผู้โอน</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {selectedSlip.accountName}
                    </Typography>
                  </Box>

                  {selectedSlip.transferReference && (
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">เลขอ้างอิง</Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {selectedSlip.transferReference}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">วันที่โอน</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {new Date(selectedSlip.transferDate).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">สถานะ</Typography>
                    <Chip
                      label={getStatusText(selectedSlip.status)}
                      color={getStatusColor(selectedSlip.status) as any}
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  {selectedSlip.adminNotes && (
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">หมายเหตุจาก Admin</Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {selectedSlip.adminNotes}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {selectedSlip.status === 'PENDING' && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      หมายเหตุสำหรับการปฏิเสธ (ถ้ามี)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="เหตุผลในการปฏิเสธ..."
                      sx={{ mb: 2 }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>ปิด</Button>
          {selectedSlip?.status === 'PENDING' && (
            <>
              <Button
                onClick={() => handleSlipAction(selectedSlip.id, 'REJECT')}
                color="error"
                variant="outlined"
                disabled={actionLoading === selectedSlip.id}
              >
                {actionLoading === selectedSlip.id ? (
                  <CircularProgress size={20} />
                ) : (
                  'ปฏิเสธ'
                )}
              </Button>
              <Button
                onClick={() => handleSlipAction(selectedSlip.id, 'APPROVE')}
                color="success"
                variant="contained"
                disabled={actionLoading === selectedSlip.id}
              >
                {actionLoading === selectedSlip.id ? (
                  <CircularProgress size={20} />
                ) : (
                  'อนุมัติ'
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 