'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Cancel,
  Receipt,
  Download,
  Refresh
} from '@mui/icons-material';

// Mock data - ในอนาคตจะเชื่อมต่อกับ API จริง
const mockPaymentHistory = [
  {
    id: '1',
    date: '2024-01-15',
    planName: 'แผนรายเดือน 1 เดือน',
    amount: 299,
    status: 'completed',
    transactionId: 'TXN001',
    paymentMethod: 'PromptPay'
  },
  {
    id: '2',
    date: '2023-12-15',
    planName: 'แผนรายเดือน 1 เดือน',
    amount: 299,
    status: 'completed',
    transactionId: 'TXN002',
    paymentMethod: 'Bank Transfer'
  },
  {
    id: '3',
    date: '2023-11-15',
    planName: 'แผนรายเดือน 1 เดือน',
    amount: 299,
    status: 'pending',
    transactionId: 'TXN003',
    paymentMethod: 'PromptPay'
  }
];

export default function PaymentHistoryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not restaurant owner
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (sessionStatus === 'unauthenticated') {
      router.replace('/auth/signin');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'RESTAURANT_OWNER') {
      router.replace('/');
    }
  }, [sessionStatus, session?.user?.role, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'สำเร็จ';
      case 'pending': return 'รอดำเนินการ';
      case 'failed': return 'ไม่สำเร็จ';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'failed': return <Cancel />;
      default: return <Schedule />;
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleDownloadReceipt = (transactionId: string) => {
    // TODO: Implement receipt download
    console.log('Download receipt for:', transactionId);
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
          กำลังโหลดประวัติการชำระเงิน...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              ฿897
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ยอดรวมทั้งหมด
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
              2
            </Typography>
            <Typography variant="body2" color="text.secondary">
              การชำระเงินสำเร็จ
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
              1
            </Typography>
            <Typography variant="body2" color="text.secondary">
              รอดำเนินการ
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Payment History Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ประวัติการชำระเงิน
            </Typography>
            <Tooltip title="รีเฟรชข้อมูล">
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          
          {mockPaymentHistory.length === 0 ? (
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                ไม่มีประวัติการชำระเงิน
              </Typography>
              <Typography variant="body2">
                เมื่อคุณทำการสมัครสมาชิกหรือต่ออายุ ประวัติการชำระเงินจะแสดงที่นี่
              </Typography>
            </Alert>
          ) : (
            <>
              {/* Desktop Table */}
              {!isMobile && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>วันที่</TableCell>
                        <TableCell>แผนการสมัครสมาชิก</TableCell>
                        <TableCell>จำนวนเงิน</TableCell>
                        <TableCell>วิธีการชำระ</TableCell>
                        <TableCell>สถานะ</TableCell>
                        <TableCell>การกระทำ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockPaymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {formatDate(payment.date)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {payment.planName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {payment.transactionId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {formatPrice(payment.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {payment.paymentMethod}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              icon={getStatusIcon(payment.status)}
                              label={getStatusText(payment.status)}
                              color={getStatusColor(payment.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="ดาวน์โหลดใบเสร็จ">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadReceipt(payment.transactionId)}
                                  disabled={payment.status !== 'completed'}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="ดูรายละเอียด">
                                <IconButton
                                  size="small"
                                  onClick={() => console.log('View details:', payment.id)}
                                >
                                  <Receipt />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Mobile Cards */}
              {isMobile && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {mockPaymentHistory.map((payment) => (
                    <Card key={payment.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {payment.planName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {payment.transactionId}
                            </Typography>
                          </Box>
                          <Chip 
                            icon={getStatusIcon(payment.status)}
                            label={getStatusText(payment.status)}
                            color={getStatusColor(payment.status)}
                            size="small"
                          />
                        </Box>
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              วันที่
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(payment.date)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              จำนวนเงิน
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatPrice(payment.amount)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              วิธีการชำระ
                            </Typography>
                            <Typography variant="body2">
                              {payment.paymentMethod}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="ดาวน์โหลดใบเสร็จ">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadReceipt(payment.transactionId)}
                              disabled={payment.status !== 'completed'}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ดูรายละเอียด">
                            <IconButton
                              size="small"
                              onClick={() => console.log('View details:', payment.id)}
                            >
                              <Receipt />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
} 