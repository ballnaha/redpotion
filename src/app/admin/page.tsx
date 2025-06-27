'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Paper, 
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Grid
} from '@mui/material';
import { 
  People, 
  Restaurant, 
  DeliveryDining, 
  Analytics,
  CheckCircle,
  Cancel,
  Visibility,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';

interface PendingRestaurant {
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
  owner: {
    name: string;
    email: string;
  };
  documents: {
    id: string;
    fileName: string;
    fileUrl: string;
    documentType: string;
    description?: string;
  }[];
  createdAt: string;
}

export default function AdminPage() {
  const theme = useTheme();
  const { data: session } = useSession();
  const [pendingRestaurants, setPendingRestaurants] = useState<PendingRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<PendingRestaurant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchPendingRestaurants();
    }
  }, [session]);

  const fetchPendingRestaurants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/restaurants/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingRestaurants(data);
      } else {
        setError('ไม่สามารถดึงข้อมูลร้านที่รออนุมัติได้');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (restaurantId: string) => {
    setActionLoading(restaurantId);
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        setPendingRestaurants(prev => prev.filter(r => r.id !== restaurantId));
        setDetailsOpen(false);
      } else {
        setError('ไม่สามารถอนุมัติร้านได้');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการอนุมัติ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (restaurantId: string) => {
    setActionLoading(restaurantId);
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        setPendingRestaurants(prev => prev.filter(r => r.id !== restaurantId));
        setDetailsOpen(false);
      } else {
        setError('ไม่สามารถปฏิเสธร้านได้');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการปฏิเสธ');
    } finally {
      setActionLoading(null);
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

  const stats = [
    { 
      title: 'Total Users', 
      value: '2,847', 
      icon: <People />, 
      color: theme.palette.primary.main,
      change: '+156 this month'
    },
    { 
      title: 'Restaurants', 
      value: '89', 
      icon: <Restaurant />, 
      color: 'rgba(16, 185, 129, 0.85)',
      change: '+12 active'
    },
    { 
      title: 'Deliveries', 
      value: '1,284', 
      icon: <DeliveryDining />, 
      color: 'rgba(255, 149, 0, 0.85)',
      change: '+28% today'
    },
    { 
      title: 'Revenue', 
      value: '฿485,230', 
      icon: <Analytics />, 
      color: 'rgba(175, 82, 222, 0.85)',
      change: '+18% this week'
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {stats.map((stat, index) => (
          <Box key={index} sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <Card
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      backgroundColor: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  {stat.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: stat.color,
                    fontWeight: 600,
                  }}
                >
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Pending Restaurants Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            ร้านอาหารที่รออนุมัติ ({pendingRestaurants.length})
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchPendingRestaurants}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            รีเฟรช
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : pendingRestaurants.length === 0 ? (
          <Alert severity="info">
            ไม่มีร้านอาหารที่รออนุมัติ
          </Alert>
        ) : (
                     <Box sx={{ 
             display: 'grid', 
             gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
             gap: 3 
           }}>
             {pendingRestaurants.map((restaurant) => (
               <Box key={restaurant.id}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={restaurant.imageUrl || undefined}
                        sx={{ width: 50, height: 50 }}
                      >
                        {restaurant.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {restaurant.name}
                        </Typography>
                        <Chip
                          label="รออนุมัติ"
                          size="small"
                          color="warning"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {restaurant.phone}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.5 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                          {restaurant.address}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {restaurant.owner.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      สมัครเมื่อ: {new Date(restaurant.createdAt).toLocaleDateString('th-TH')}
                    </Typography>

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
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleApprove(restaurant.id)}
                        disabled={actionLoading === restaurant.id}
                        sx={{ flex: 1 }}
                      >
                        {actionLoading === restaurant.id ? <CircularProgress size={16} /> : 'อนุมัติ'}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleReject(restaurant.id)}
                        disabled={actionLoading === restaurant.id}
                      >
                        ปฏิเสธ
                      </Button>
                    </Box>
                                     </CardContent>
                 </Card>
               </Box>
             ))}
           </Box>
        )}
      </Box>

      {/* Management Sections */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '2 1 500px', minWidth: 500 }}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Recent Activities
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { action: 'New restaurant registered', name: 'Thai Garden', time: '2 mins ago' },
                { action: 'User verification completed', name: 'Customer #2847', time: '5 mins ago' },
                { action: 'Delivery completed', name: 'Order #1001', time: '12 mins ago' },
                { action: 'Payment processed', name: '฿1,250', time: '18 mins ago' },
                { action: 'Menu updated', name: 'Pizza Corner', time: '25 mins ago' },
              ].map((activity, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                  }}
                >
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {activity.action}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {activity.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {activity.time}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              System Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Server Status', status: 'Online', color: 'rgba(16, 185, 129, 0.85)' },
                { label: 'Database', status: 'Healthy', color: 'rgba(16, 185, 129, 0.85)' },
                { label: 'Payment Gateway', status: 'Active', color: 'rgba(16, 185, 129, 0.85)' },
                { label: 'Notifications', status: 'Working', color: 'rgba(16, 185, 129, 0.85)' },
              ].map((item, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: item.color,
                      fontWeight: 600,
                    }}
                  >
                    {item.status}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Restaurant Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          รายละเอียดร้านอาหาร
        </DialogTitle>
        <DialogContent>
          {selectedRestaurant && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Restaurant Info */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  ข้อมูลร้าน
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Avatar
                    src={selectedRestaurant.imageUrl || undefined}
                    sx={{ width: 80, height: 80 }}
                  >
                    {selectedRestaurant.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedRestaurant.name}</Typography>
                    <Typography color="text.secondary">{selectedRestaurant.description}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ประเภทธุรกิจ: {selectedRestaurant.businessType}
                    </Typography>
                    {selectedRestaurant.taxId && (
                      <Typography variant="body2" color="text.secondary">
                        เลขภาษี: {selectedRestaurant.taxId}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Owner Info */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  ข้อมูลเจ้าของร้าน
                </Typography>
                <Typography>ชื่อ: {selectedRestaurant.owner.name}</Typography>
                <Typography>อีเมล: {selectedRestaurant.owner.email}</Typography>
                <Typography>โทรศัพท์: {selectedRestaurant.phone}</Typography>
                <Typography>ที่อยู่: {selectedRestaurant.address}</Typography>
              </Box>

              {/* Documents */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  เอกสารที่อัพโหลด ({selectedRestaurant.documents.length} ไฟล์)
                </Typography>
                {selectedRestaurant.documents.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    {selectedRestaurant.documents.map((doc) => (
                      <Card key={doc.id} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {doc.documentType.replace('_', ' ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {doc.fileName}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          href={doc.fileUrl}
                          target="_blank"
                          sx={{ width: '100%' }}
                        >
                          ดูไฟล์
                        </Button>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">ไม่มีเอกสารที่อัพโหลด</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setDetailsOpen(false)}
            variant="outlined"
          >
            ปิด
          </Button>
          {selectedRestaurant && (
            <>
              <Button
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                onClick={() => handleReject(selectedRestaurant.id)}
                disabled={actionLoading === selectedRestaurant.id}
              >
                ปฏิเสธ
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleApprove(selectedRestaurant.id)}
                disabled={actionLoading === selectedRestaurant.id}
              >
                อนุมัติ
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 