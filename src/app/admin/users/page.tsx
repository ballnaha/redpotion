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
  useMediaQuery
} from '@mui/material';
import {
  Search,
  Edit,
  Visibility,
  Store,
  Person,
  Email,
  Phone,
  CalendarToday,
  FilterList
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/contexts/NotificationContext';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: string;
  restaurant?: {
    id: string;
    name: string;
    status: string;
  } | null;
  profile?: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  _count: {
    accounts: number;
    sessions: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: Record<string, number>;
}

export default function AdminUsersPage() {
  const theme = useTheme();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError } = useNotification();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [session, page, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(roleFilter !== 'ALL' && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setStats(data.stats);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'UPDATE_ROLE',
          data: { role: newRole }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Refresh data
      await fetchUsers();
      setEditOpen(false);
      setSelectedUser(null);
      setNewRole('');
      
      showSuccess('อัปเดต role ของผู้ใช้เรียบร้อยแล้ว');
      
    } catch (error) {
      console.error('Error updating role:', error);
      showError('เกิดข้อผิดพลาดในการอัปเดต role');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'RESTAURANT_OWNER': return 'primary';
      case 'CUSTOMER': return 'success';
      default: return 'default';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'ผู้ดูแลระบบ';
      case 'RESTAURANT_OWNER': return 'เจ้าของร้าน';
      case 'CUSTOMER': return 'ลูกค้า';
      case 'USER': return 'ผู้ใช้'; // legacy
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'SUSPENDED': return 'error';
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
        จัดการผู้ใช้
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {Object.entries(stats).map(([role, count]) => (
          <Box key={role} sx={{ flex: '1 1 200px', minWidth: 200 }}>
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
                  {getRoleText(role)}
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
              placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
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
              <InputLabel>ประเภทผู้ใช้</InputLabel>
              <Select
                value={roleFilter}
                label="ประเภทผู้ใช้"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="ALL">ทั้งหมด</MenuItem>
                <MenuItem value="ADMIN">ผู้ดูแลระบบ</MenuItem>
                <MenuItem value="RESTAURANT_OWNER">เจ้าของร้าน</MenuItem>
                <MenuItem value="CUSTOMER">ลูกค้า</MenuItem>
                <MenuItem value="USER">ผู้ใช้ (legacy)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '0 0 auto' }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={fetchUsers}
              disabled={loading}
            >
              ค้นหา
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Users Table/Cards */}
      <Card>
        {isMobile ? (
          // Mobile Card Layout
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 1, ml: 2 }}>กำลังโหลด...</Typography>
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  ไม่พบข้อมูลผู้ใช้
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {users.map((user) => (
                  <Card key={user.id} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar src={user.image || undefined} sx={{ width: 50, height: 50 }}>
                        {user.name ? user.name[0]?.toUpperCase() : <Person />}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {user.name || 'ไม่ระบุชื่อ'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1, wordBreak: 'break-word' }}>
                          {user.email}
                        </Typography>
                        {user.profile?.firstName && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                            {user.profile.firstName} {user.profile.lastName}
                          </Typography>
                        )}
                        <Chip
                          label={getRoleText(user.role)}
                          color={getRoleColor(user.role) as any}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    </Box>

                    {user.restaurant && (
                      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Store sx={{ fontSize: 16 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.restaurant.name}
                          </Typography>
                        </Box>
                        <Chip
                          label={user.restaurant.status}
                          color={getStatusColor(user.restaurant.status) as any}
                          size="small"
                        />
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {user.profile?.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14 }} />
                          <Typography variant="caption" color="textSecondary">
                            {user.profile.phone}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14 }} />
                        <Typography variant="caption" color="textSecondary">
                          {new Date(user.createdAt).toLocaleDateString('th-TH')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailsOpen(true);
                        }}
                        sx={{ flex: 1 }}
                      >
                        ดูรายละเอียด
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                          setEditOpen(true);
                        }}
                        sx={{ flex: 1 }}
                      >
                        แก้ไข Role
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
                  <TableCell>ผู้ใช้</TableCell>
                  <TableCell>ประเภท</TableCell>
                  <TableCell>ร้านอาหาร</TableCell>
                  <TableCell>เบอร์โทร</TableCell>
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
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        ไม่พบข้อมูลผู้ใช้
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={user.image || undefined}>
                            {user.name ? user.name[0]?.toUpperCase() : <Person />}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {user.name || 'ไม่ระบุชื่อ'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {user.email}
                            </Typography>
                            {user.profile?.firstName && (
                              <Typography variant="caption" color="textSecondary">
                                {user.profile.firstName} {user.profile.lastName}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleText(user.role)}
                          color={getRoleColor(user.role) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.restaurant ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {user.restaurant.name}
                            </Typography>
                            <Chip
                              label={user.restaurant.status}
                              color={getStatusColor(user.restaurant.status) as any}
                              size="small"
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.profile?.phone || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="ดูรายละเอียด">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user);
                                setDetailsOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="แก้ไข Role">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setEditOpen(true);
                              }}
                            >
                              <Edit />
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

      {/* User Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>รายละเอียดผู้ใช้</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                <Typography variant="subtitle2" color="textSecondary">ชื่อ</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedUser.name || 'ไม่ระบุ'}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                <Typography variant="subtitle2" color="textSecondary">อีเมล</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedUser.email || 'ไม่ระบุ'}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                <Typography variant="subtitle2" color="textSecondary">ประเภทผู้ใช้</Typography>
                <Chip
                  label={getRoleText(selectedUser.role)}
                  color={getRoleColor(selectedUser.role) as any}
                  sx={{ mb: 2 }}
                />
              </Box>
              <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                <Typography variant="subtitle2" color="textSecondary">วันที่สมัคร</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(selectedUser.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
              {selectedUser.profile && (
                <>
                  <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Typography variant="subtitle2" color="textSecondary">ชื่อจริง</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedUser.profile.firstName} {selectedUser.profile.lastName}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Typography variant="subtitle2" color="textSecondary">เบอร์โทร</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedUser.profile.phone || 'ไม่ระบุ'}
                    </Typography>
                  </Box>
                </>
              )}
              {selectedUser.restaurant && (
                <>
                  <Box sx={{ flex: '1 1 100%', width: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      ข้อมูลร้านอาหาร
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Typography variant="subtitle2" color="textSecondary">ชื่อร้าน</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedUser.restaurant.name}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Typography variant="subtitle2" color="textSecondary">สถานะร้าน</Typography>
                    <Chip
                      label={selectedUser.restaurant.status}
                      color={getStatusColor(selectedUser.restaurant.status) as any}
                    />
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>ปิด</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullScreen={isMobile}>
        <DialogTitle>แก้ไข Role ผู้ใช้</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>เลือก Role ใหม่</InputLabel>
            <Select
              value={newRole}
              label="เลือก Role ใหม่"
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="CUSTOMER">ลูกค้า</MenuItem>
              <MenuItem value="RESTAURANT_OWNER">เจ้าของร้าน</MenuItem>
              <MenuItem value="ADMIN">ผู้ดูแลระบบ</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>ยกเลิก</Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={actionLoading || !newRole}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'อัปเดต'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 