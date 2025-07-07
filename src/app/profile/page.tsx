'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar
} from '@mui/material';
import {
  Person,
  Phone,
  LocationOn,
  Edit,
  Home,
  Work,
  Settings,
  Notifications,
  Payment,
  Help,
  ExitToApp,
  Close,
  Save,
  Check,
  RadioButtonUnchecked,
  RadioButtonChecked,
  MyLocation,
  GpsFixed,
  DeliveryDining
} from '@mui/icons-material';
import { getDefaultMenuUrl } from '@/lib/defaultRestaurant';

interface DeliveryAddress {
  id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  isDefault: boolean;
  type: 'HOME' | 'WORK';
}

interface CustomerProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  riderNote?: string;
  selectedAddressType?: 'HOME' | 'WORK';
  currentLatitude?: number;
  currentLongitude?: number;
  currentAddress?: string;
  addresses: DeliveryAddress[];
}

interface LineUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  lineUserId: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [lineUser, setLineUser] = useState<LineUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Dialog states
  const [editPersonalOpen, setEditPersonalOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editAddressType, setEditAddressType] = useState<'HOME' | 'WORK'>('HOME');
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [riderNote, setRiderNote] = useState('');
  const [selectedAddressType, setSelectedAddressType] = useState<'HOME' | 'WORK'>('HOME');
  const [editingAddress, setEditingAddress] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [tempSelectedAddressType, setTempSelectedAddressType] = useState<'HOME' | 'WORK'>('HOME');
  const [editingLocation, setEditingLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Confirmation dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAddressType, setPendingAddressType] = useState<'HOME' | 'WORK' | null>(null);

  // Check LINE session
  useEffect(() => {
    const checkLineSession = async () => {
      try {
        const response = await fetch('/api/auth/line-session');
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          setLineUser(data.user);
          loadProfile();
        } else {
          router.push('/auth/line-signin');
          return;
        }
      } catch (error) {
        console.error('Error checking LINE session:', error);
        router.push('/auth/line-signin');
        return;
      } finally {
        setSessionLoading(false);
      }
    };

    checkLineSession();
  }, [router]);

  const loadProfile = async (useDebugApi = false) => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      const apiUrl = useDebugApi ? '/api/debug/customer-profile' : '/api/customer/profile';
      console.log('🔄 Loading customer profile from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ส่ง cookies ด้วย
      });
      
      console.log('📡 Profile API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Profile API error:', errorData);
        
        if (response.status === 401) {
          throw new Error('ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่');
        } else if (response.status === 500) {
          throw new Error('เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
        } else {
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to load profile`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Profile API response:', data);
      
      // Handle debug API response
      const profileData = useDebugApi ? data.profile : data;
      
      console.log('✅ Profile loaded successfully:', profileData.id);
      setProfile(profileData);
      
      // Set form values
      setFirstName(profileData.firstName || '');
      setLastName(profileData.lastName || '');
      setPhone(profileData.phone || '');
      setRiderNote(profileData.riderNote || '');
      setSelectedAddressType(profileData.selectedAddressType || 'HOME');
      
      // Load current location from profile
      if (profileData.currentLatitude && profileData.currentLongitude) {
        setCurrentLocation({
          lat: profileData.currentLatitude,
          lng: profileData.currentLongitude,
          address: profileData.currentAddress || `${profileData.currentLatitude.toFixed(6)}, ${profileData.currentLongitude.toFixed(6)}`
        });
      }
    } catch (err) {
      console.error('❌ Load profile error:', err);
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          riderNote,
          selectedAddressType,
          currentLatitude: currentLocation?.lat,
          currentLongitude: currentLocation?.lng,
          currentAddress: currentLocation?.address,
          addresses: profile?.addresses
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditPersonalOpen(false);
      
      // แสดง snackbar
      setSnackbarMessage('บันทึกข้อมูลเรียบร้อยแล้ว');
      setSnackbarOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const saveAddress = async () => {
    if (!profile) return;
    
    try {
      const updatedAddresses = profile.addresses.map(addr => 
        addr.type === editAddressType 
          ? { 
              ...addr, 
              address: editingAddress,
              latitude: editingLocation?.lat,
              longitude: editingLocation?.lng,
              locationAddress: editingLocation?.address
            }
          : addr
      );

      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          riderNote,
          selectedAddressType: tempSelectedAddressType,
          currentLatitude: currentLocation?.lat,
          currentLongitude: currentLocation?.lng,
          currentAddress: currentLocation?.address,
          addresses: updatedAddresses
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save address');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSelectedAddressType(tempSelectedAddressType);
      setEditAddressOpen(false);
      setEditingAddress('');
      setEditingLocation(null);
      
      // แสดง snackbar
      setSnackbarMessage('บันทึกที่อยู่เรียบร้อยแล้ว');
      setSnackbarOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  const handleEditAddress = (type: 'HOME' | 'WORK') => {
    const address = profile?.addresses.find(addr => addr.type === type);
    setEditAddressType(type);
    setEditingAddress(address?.address || '');
    setTempSelectedAddressType(selectedAddressType);
    
    // Set editing location from address data
    if (address?.latitude && address?.longitude) {
      setEditingLocation({
        lat: address.latitude,
        lng: address.longitude,
        address: address.locationAddress || `${address.latitude.toFixed(6)}, ${address.longitude.toFixed(6)}`
      });
    } else {
      setEditingLocation(null);
    }
    
    setEditAddressOpen(true);
  };

  const handleCardClick = (type: 'HOME' | 'WORK') => {
    if (selectedAddressType !== type) {
      setPendingAddressType(type);
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmAddressChange = () => {
    if (pendingAddressType) {
      setSelectedAddressType(pendingAddressType);
      saveSelectedAddressType(pendingAddressType);
      setConfirmDialogOpen(false);
      setPendingAddressType(null);
    }
  };

  const handleCancelAddressChange = () => {
    setConfirmDialogOpen(false);
    setPendingAddressType(null);
  };

  const handleSelectedAddressChange = (event: SelectChangeEvent<string>) => {
    const newType = event.target.value as 'HOME' | 'WORK';
    setSelectedAddressType(newType);
    
    // บันทึกการเปลี่ยนแปลงลง database
    saveSelectedAddressType(newType);
  };

  const saveSelectedAddressType = async (newType: 'HOME' | 'WORK') => {
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          riderNote,
          selectedAddressType: newType,
          currentLatitude: currentLocation?.lat,
          currentLongitude: currentLocation?.lng,
          currentAddress: currentLocation?.address,
          addresses: profile?.addresses
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        
        // แสดง snackbar
        setSnackbarMessage('เปลี่ยนที่อยู่จัดส่งเรียบร้อยแล้ว');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error saving selected address type:', err);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // ใช้ reverse geocoding เพื่อแปลงพิกัดเป็นที่อยู่
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&language=th&pretty=1`
      );
      
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results[0]) {
          address = data.results[0].formatted || address;
        }
      }

      const newLocation = {
        lat: latitude,
        lng: longitude,
        address: address
      };
      
      setCurrentLocation(newLocation);
      
      // บันทึกลง database ทันที
      await saveCurrentLocation(newLocation);

    } catch (error) {
      console.error('Error getting location:', error);
      setError('ไม่สามารถดึงตำแหน่งปัจจุบันได้');
    } finally {
      setLocationLoading(false);
    }
  };

  const saveCurrentLocation = async (location: {lat: number, lng: number, address: string}) => {
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          riderNote,
          selectedAddressType,
          currentLatitude: location.lat,
          currentLongitude: location.lng,
          currentAddress: location.address,
          addresses: profile?.addresses
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        
        // แสดง snackbar
        setSnackbarMessage('บันทึกตำแหน่งปัจจุบันเรียบร้อยแล้ว');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error saving current location:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/line-session', { method: 'DELETE' });
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (sessionLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>กำลังโหลด...</Typography>
      </Box>
    );
  }

  if (!lineUser) {
    return null;
  }

  const currentSelectedAddress = profile?.addresses.find(addr => addr.type === selectedAddressType);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#ffffff',
        py: 1,
        '@keyframes float': {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' }
        }
      }}
    >
      <Container maxWidth="md">
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => loadProfile(false)}
                  disabled={loading}
                >
                  ลองใหม่
                </Button>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => loadProfile(true)}
                  disabled={loading}
                >
                  Debug
                </Button>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setDebugMode(!debugMode)}
                >
                  {debugMode ? 'ซ่อน Debug' : 'แสดง Debug'}
                </Button>
              </Box>
            }
          >
            {error}
          </Alert>
        )}

        {debugMode && (
          <Alert 
            severity="info" 
            sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>🔧 Debug Information</Typography>
            <Typography variant="body2" component="pre" sx={{ 
              fontFamily: 'monospace', 
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {JSON.stringify({
                sessionLoading,
                loading,
                hasLineUser: !!lineUser,
                hasProfile: !!profile,
                profileId: profile?.id,
                addressCount: profile?.addresses?.length || 0,
                selectedAddressType,
                currentLocation: !!currentLocation,
                environment: process.env.NODE_ENV
              }, null, 2)}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => loadProfile(false)}
                disabled={loading}
              >
                ลองใช้ API ปกติ
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => loadProfile(true)}
                disabled={loading}
              >
                ลองใช้ Debug API
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => window.location.reload()}
              >
                รีเฟรชหน้า
              </Button>
            </Box>
          </Alert>
        )}

        {/* Profile Header */}
        <Card
          className="liquid-glass"
          sx={{
            mb: 2,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(16,185,129,0.12)'
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Avatar
              src={lineUser.image || ''}
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                border: '3px solid #10B981'
              }}
            >
              <Person sx={{ fontSize: 40, color: '#10B981' }} />
            </Avatar>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#065f46' }}>
              {lineUser.name || 'ผู้ใช้'}
            </Typography>
            
            {(profile?.firstName || profile?.lastName) && (
              <Typography variant="body1" sx={{ mt: 1, color: '#10B981' }}>
                ชื่อจริง: {[profile.firstName, profile.lastName].filter(Boolean).join(' ')}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card
          className="liquid-glass"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(16,185,129,0.08)'
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#065f46' }}>
                ข้อมูลส่วนตัว
              </Typography>
              <IconButton 
                onClick={() => setEditPersonalOpen(true)}
                sx={{ 
                  color: '#10B981',
                  '&:hover': { 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Edit />
              </IconButton>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Person sx={{ color: '#10B981' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ color: '#065f46', fontWeight: 600 }}>ชื่อ-นามสกุล</Typography>}
                  secondary={
                    <Typography sx={{ color: '#047857' }}>
                      {profile?.firstName || profile?.lastName
                        ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
                        : 'ยังไม่ได้ตั้งค่า'}
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Phone sx={{ color: '#10B981' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ color: '#065f46', fontWeight: 600 }}>เบอร์โทรศัพท์</Typography>}
                  secondary={
                    <Typography sx={{ color: '#047857' }}>
                      {profile?.phone || 'ยังไม่ได้ตั้งค่า'}
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DeliveryDining sx={{ color: '#10B981' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ color: '#065f46', fontWeight: 600 }}>ข้อความถึง Rider</Typography>}
                  secondary={
                    <Typography sx={{ color: '#047857' }}>
                      {profile?.riderNote || 'ไม่มีข้อความเพิ่มเติม'}
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>


        {/* Delivery Addresses */}
        <Card
          className="liquid-glass"
          sx={{
            mb: 2,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(16,185,129,0.08)'
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#065f46' }}>
              🏠 ที่อยู่จัดส่ง
            </Typography>

            {/* Address Cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {profile?.addresses.map((address) => (
                <Card 
                  key={address.id}
                  sx={{
                    border: address.type === selectedAddressType ? '2px solid #10B981' : '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                      borderColor: '#10B981'
                    }
                  }}
                  onClick={() => handleCardClick(address.type)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {address.type === 'HOME' ? 
                          <Home sx={{ color: '#10B981' }} /> : 
                          <Work sx={{ color: '#10B981' }} />
                        }
                        <Typography variant="subtitle1" sx={{ color: '#065f46', fontWeight: 600 }}>
                          {address.label}
                        </Typography>
                        {address.type === selectedAddressType && (
                          <Chip
                            label="ค่าเริ่มต้น"
                            size="small"
                            sx={{ 
                              ml: 1,
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </Box>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAddress(address.type);
                        }}
                        sx={{ 
                          color: '#10B981',
                          '&:hover': { 
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#047857', pl: 4 }}>
                      {address.address}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280', pl: 4, display: 'block', mt: 1 }}>
                      {address.type === selectedAddressType ? '✓ คลิกเพื่อใช้เป็นที่อยู่หลัก' : 'คลิกเพื่อใช้เป็นที่อยู่หลัก'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Other Settings */}
        <Card
          className="liquid-glass"
          sx={{
            mb: 2,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(16,185,129,0.08)'
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#065f46' }}>
              อื่น ๆ
            </Typography>

            <List>
              <ListItemButton sx={{ '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.05)' } }}>
                <ListItemIcon>
                  <Notifications sx={{ color: '#10B981' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography sx={{ color: '#065f46', fontWeight: 600 }}>การแจ้งเตือน</Typography>}
                />
                <ListItemSecondaryAction>
                  <Switch 
                    defaultChecked 
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#10B981',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#10B981',
                      },
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItemButton>
              <ListItemButton sx={{ '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.05)' } }}>
                <ListItemIcon>
                  <Payment sx={{ color: '#10B981' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography sx={{ color: '#065f46', fontWeight: 600 }}>วิธีการชำระเงิน</Typography>}
                />
              </ListItemButton>
              <ListItemButton sx={{ '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.05)' } }}>
                <ListItemIcon>
                  <Help sx={{ color: '#10B981' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography sx={{ color: '#065f46', fontWeight: 600 }}>ช่วยเหลือ</Typography>}
                />
              </ListItemButton>
              <Divider />
              <ListItemButton 
                onClick={handleSignOut}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(220, 38, 38, 0.05)',
                    '& .MuiListItemIcon-root': { color: '#dc2626' },
                    '& .MuiListItemText-primary': { color: '#dc2626' }
                  }
                }}
              >
                <ListItemIcon>
                  <ExitToApp sx={{ color: '#ef4444' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography sx={{ color: '#ef4444', fontWeight: 600 }}>ออกจากระบบ</Typography>}
                />
              </ListItemButton>
            </List>
          </CardContent>
        </Card>
      </Container>

      {/* Floating Home Button */}
      <Box
        onClick={async () => {
          const menuUrl = await getDefaultMenuUrl();
          router.push(menuUrl);
        }}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          animation: 'float 3s ease-in-out infinite',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1) translateY(-2px)',
            background: 'rgba(255, 255, 255, 0.25)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          }
        }}
      >
        <Home sx={{ 
          color: '#10B981', 
          fontSize: 24,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }} />
      </Box>

      {/* Edit Personal Info Dialog */}
      <Dialog
        open={editPersonalOpen}
        onClose={() => setEditPersonalOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: isMobile ? 'none' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        {isMobile ? (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setEditPersonalOpen(false)}
              >
                <Close />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
                แก้ไขข้อมูลส่วนตัว
              </Typography>
              <Button color="inherit" onClick={saveProfile}>
                บันทึก
              </Button>
            </Toolbar>
          </AppBar>
        ) : (
          <DialogTitle sx={{ 
            textAlign: 'center', 
            pb: 1, 
            color: '#065f46', 
            fontWeight: 600,
            fontSize: '1.25rem'
          }}>
            แก้ไขข้อมูลส่วนตัว
          </DialogTitle>
        )}
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ 
            height: isMobile ? 'calc(100vh - 64px)' : 'auto',
            overflow: 'auto',
            p: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#065f46', fontWeight: 600, mb: 2 }}>
              ข้อมูลติดต่อ
            </Typography>
            <TextField
              fullWidth
              label="ชื่อจริง"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#10B981'
                  },
                  '&:hover fieldset': {
                    borderColor: '#059669'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#10B981'
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="นามสกุลจริง"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#10B981'
                  },
                  '&:hover fieldset': {
                    borderColor: '#059669'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#10B981'
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="เบอร์โทรศัพท์"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#10B981'
                  },
                  '&:hover fieldset': {
                    borderColor: '#059669'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#10B981'
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="ข้อความถึง Rider"
              value={riderNote}
              onChange={(e) => setRiderNote(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              placeholder="เช่น ห้อง 123, ชั้น 4, โทรก่อนส่ง"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#10B981'
                  },
                  '&:hover fieldset': {
                    borderColor: '#059669'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#10B981'
                  }
                }
              }}
            />
          </Box>
        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button 
              onClick={() => setEditPersonalOpen(false)}
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#d1d5db',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: 'rgba(107, 114, 128, 0.05)'
                }
              }}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={saveProfile} 
              variant="contained"
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                }
              }}
            >
              บันทึก
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog
        open={editAddressOpen}
        onClose={() => setEditAddressOpen(false)}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: isMobile ? 'none' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        {isMobile ? (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setEditAddressOpen(false)}
              >
                <Close />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
                แก้ไขที่อยู่{editAddressType === 'HOME' ? 'บ้าน' : 'ที่ทำงาน'}
              </Typography>
              <Button color="inherit" onClick={saveAddress}>
                บันทึก
              </Button>
            </Toolbar>
          </AppBar>
        ) : (
          <DialogTitle sx={{ 
            textAlign: 'center', 
            pb: 1, 
            color: '#065f46', 
            fontWeight: 600,
            fontSize: '1.25rem'
          }}>
            แก้ไขที่อยู่{editAddressType === 'HOME' ? 'บ้าน' : 'ที่ทำงาน'}
          </DialogTitle>
        )}
        
                <DialogContent sx={{ p: isMobile ? 0 : 2 }}>
          <Box sx={{ 
            height: isMobile ? 'calc(100vh - 64px)' : 'auto',
            maxHeight: isMobile ? 'none' : '70vh',
            overflow: 'auto',
            p: isMobile ? 2 : 0
          }}>
            {/* Manual Address Input */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#065f46', fontWeight: 600, mb: 1.5 }}>
                ✏️ ที่อยู่{editAddressType === 'HOME' ? 'บ้าน' : 'ที่ทำงาน'}
              </Typography>
              <TextField
                fullWidth
                label="ที่อยู่"
                value={editingAddress}
                onChange={(e) => setEditingAddress(e.target.value)}
                multiline
                rows={isMobile ? 4 : 5}
                placeholder="กรอกที่อยู่ที่ต้องการจัดส่ง"
                sx={{
                  mb: isMobile ? 0 : 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#10B981'
                    },
                    '&:hover fieldset': {
                      borderColor: '#059669'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#10B981'
                    }
                  }
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Location for this Address */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#065f46', fontWeight: 600, mb: 1.5 }}>
                📍 ตำแหน่ง{editAddressType === 'HOME' ? 'บ้าน' : 'ที่ทำงาน'}
              </Typography>
              
              {editingLocation ? (
                <Box 
                  p={2} 
                  sx={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)',
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    mb: 2
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#047857', mb: 1 }}>
                    📍 {editingLocation.address}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#059669', mb: 2, display: 'block' }}>
                    พิกัด: {editingLocation.lat.toFixed(6)}, {editingLocation.lng.toFixed(6)}
                  </Typography>
                  
                  {/* Mini Google Maps Embed */}
                  <Box
                    sx={{
                      width: '100%',
                      height: isMobile ? 200 : 250,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      mt: 1,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${editingLocation.lat},${editingLocation.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                  ยังไม่ได้ตั้งค่าตำแหน่งสำหรับที่อยู่นี้
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={locationLoading ? <GpsFixed className="animate-spin" /> : <MyLocation />}
                  onClick={async () => {
                    setLocationLoading(true);
                    try {
                      if (!navigator.geolocation) {
                        throw new Error('Geolocation is not supported by this browser');
                      }

                      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                          enableHighAccuracy: true,
                          timeout: 10000,
                          maximumAge: 60000
                        });
                      });

                      const { latitude, longitude } = position.coords;
                      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

                      const newLocation = {
                        lat: latitude,
                        lng: longitude,
                        address: address
                      };
                      
                      setEditingLocation(newLocation);
                    } catch (error) {
                      console.error('Error getting location:', error);
                      setError('ไม่สามารถดึงตำแหน่งปัจจุบันได้');
                    } finally {
                      setLocationLoading(false);
                    }
                  }}
                  disabled={locationLoading}
                  sx={{
                    borderColor: '#10B981',
                    color: '#10B981',
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      borderColor: '#059669'
                    },
                    '&:disabled': {
                      borderColor: '#d1d5db',
                      color: '#6b7280'
                    }
                  }}
                >
                  {locationLoading ? 'กำลังดึงตำแหน่ง...' : '📍 ใช้ตำแหน่งปัจจุบัน'}
                </Button>

                {editingLocation && (
                  <Box sx={{ 
                    mt: 1,
                    display: 'flex',
                    gap: 1,
                    flexDirection: isMobile ? 'column' : 'row'
                  }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        if (editingLocation) {
                          setEditingAddress(editingLocation.address);
                        }
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white',
                        mb: isMobile ? 1 : 0,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                        }
                      }}
                    >
                      📋 ใส่ตำแหน่งลงในที่อยู่
                    </Button>
                    <Button
                      fullWidth
                      variant="text"
                      color="error"
                      onClick={() => setEditingLocation(null)}
                    >
                      ❌ ลบตำแหน่ง
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button 
              onClick={() => setEditAddressOpen(false)}
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#d1d5db',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: 'rgba(107, 114, 128, 0.05)'
                }
              }}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={saveAddress} 
              variant="contained"
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                }
              }}
            >
              บันทึก
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelAddressChange}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1, color: '#065f46', fontWeight: 600 }}>
          ยืนยันการเปลี่ยนที่อยู่จัดส่ง
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ mb: 2 }}>
            {pendingAddressType === 'HOME' ? '🏠' : '🏢'}
          </Box>
          <Typography variant="body1" sx={{ color: '#047857', mb: 2 }}>
            ต้องการเปลี่ยนที่อยู่จัดส่งเป็น
          </Typography>
          <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 600 }}>
            {pendingAddressType === 'HOME' ? 'ที่อยู่บ้าน' : 'ที่อยู่ที่ทำงาน'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
            หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleCancelAddressChange}
            variant="outlined"
            fullWidth
            sx={{
              borderColor: '#d1d5db',
              color: '#6b7280',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: 'rgba(107, 114, 128, 0.05)'
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmAddressChange}
            variant="contained"
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              }
            }}
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ 
            width: '100%',
            backgroundColor: '#10B981',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 