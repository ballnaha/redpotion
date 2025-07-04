'use client'

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField,
  Button,
  CircularProgress, 
  Alert, 
  Avatar, 
  Switch,
  FormControlLabel,
  IconButton,
  Link
} from '@mui/material';
import { 
  ArrowBack,
  Save,
  Restaurant,
  Upload,
  Business,
  Schedule,
  DeliveryDining,
  LocationOn
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ImageUploadDropzone, { uploadImageFile } from '../components/ImageUploadDropzone';
import LocationPicker, { LocationData } from '../components/LocationPicker';
import { useNotification } from '../../../contexts/NotificationContext';

interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  businessType?: string;
  taxId?: string;
  bankAccount?: string;
  bankName?: string;
  openTime?: string;
  closeTime?: string;
  isOpen: boolean;
  minOrderAmount?: number;
  deliveryFee?: number;
  deliveryRadius?: number;
}

// SWR fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('ไม่พบข้อมูลร้านอาหาร กรุณาติดต่อผู้ดูแลระบบ');
    }
    throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลร้าน');
  }
  return response.json();
};

export default function RestaurantSettingsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  
  // ใช้ SWR แทน useState + useEffect
  const { 
    data: restaurant, 
    error: fetchError, 
    isLoading: loading,
    mutate: refreshRestaurant
  } = useSWR<RestaurantData>(
    session?.user?.id ? '/api/restaurant/my-restaurant' : null,
    fetcher,
    {
      revalidateOnFocus: false, // ไม่ refresh เมื่อ focus ในหน้า settings
      dedupingInterval: 60 * 1000, // 1 นาที
    }
  );
  
  const [saving, setSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  // Use notification hook
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    imageUrl: '',
    businessType: '',
    taxId: '',
    bankAccount: '',
    bankName: '',
    openTime: '',
    closeTime: '',
    isOpen: true,
    minOrderAmount: 0,
    deliveryFee: 0,
    deliveryRadius: 5
  });

  // Location data separate state
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    address: '',
    locationName: ''
  });

  // Auto-populate form when restaurant data loads
  React.useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        imageUrl: restaurant.imageUrl || '',
        businessType: restaurant.businessType || '',
        taxId: restaurant.taxId || '',
        bankAccount: restaurant.bankAccount || '',
        bankName: restaurant.bankName || '',
        openTime: restaurant.openTime || '',
        closeTime: restaurant.closeTime || '',
        isOpen: restaurant.isOpen ?? true,
        minOrderAmount: restaurant.minOrderAmount || 0,
        deliveryFee: restaurant.deliveryFee || 0,
        deliveryRadius: restaurant.deliveryRadius || 5
      });

      // Set location data
      setLocationData({
        latitude: restaurant.latitude || null,
        longitude: restaurant.longitude || null,
        address: restaurant.address || '',
        locationName: restaurant.locationName || ''
      });
    }
  }, [restaurant]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (location: LocationData) => {
    setLocationData(location);
    // Update address field if location has address
    if (location.address) {
      setFormData(prev => ({
        ...prev,
        address: location.address
      }));
    }
  };

  const handleImageChange = async (imageUrl: string | null, file?: File) => {
    // ถ้าเป็นการลบรูป (imageUrl เป็น null) ให้ลบไฟล์และอัปเดต database
    if (imageUrl === null && restaurant?.id && formData.imageUrl) {
      try {
        // 1. ลบไฟล์จาก filesystem ก่อน (ไม่อัปเดต database ใน API นี้)
        const deleteResponse = await fetch('/api/restaurant/delete-image', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: formData.imageUrl,
            category: 'banner',
            updateDatabase: false // ไม่ให้ API นี้อัปเดต database
          }),
        });

        if (!deleteResponse.ok) {
          const deleteError = await deleteResponse.json();
          throw new Error(deleteError.message || 'ไม่สามารถลบไฟล์รูปภาพได้');
        }

        // 2. อัปเดต database
        const updateResponse = await fetch('/api/restaurant/my-restaurant', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            imageUrl: null // ลบรูปภาพออกจาก database
          }),
        });

        if (updateResponse.ok) {
          const updatedRestaurant = await updateResponse.json();
          refreshRestaurant(updatedRestaurant); // อัปเดต SWR cache
          setFormData(prev => ({
            ...prev,
            imageUrl: ''
          }));
          setSelectedImageFile(null);
          showSuccess('ลบรูปภาพสำเร็จ');
          console.log('✅ Image deleted from both filesystem and database');
        } else {
          const errorData = await updateResponse.json();
          showError(errorData.message || 'ไม่สามารถอัปเดตข้อมูลได้');
        }
              } catch (error) {
          console.error('Error deleting image:', error);
          showError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบรูปภาพ');
        }
    } else {
      // กรณีอื่นๆ (เลือกไฟล์ใหม่) ให้ update form state ตามปกติ
      setFormData(prev => ({
        ...prev,
        imageUrl: imageUrl || ''
      }));
      setSelectedImageFile(file || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim() || !formData.phone.trim()) {
      showError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    // แจ้งเตือนการเริ่มต้นบันทึก
    showInfo('กำลังบันทึกข้อมูล...');

    try {
      setSaving(true);

      let uploadedImageUrl = formData.imageUrl;

      // Upload image if new file is selected
      if (selectedImageFile && restaurant?.id) {
        try {
          showInfo('กำลังอัปโหลดรูปภาพ...');
          uploadedImageUrl = await uploadImageFile(
            selectedImageFile,
            restaurant.id,
            'banner',
            'banner'
          );
          console.log('✅ Image uploaded successfully:', uploadedImageUrl);
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          showError('ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่');
          setSaving(false);
          return;
        }
      }

      const response = await fetch('/api/restaurant/my-restaurant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          imageUrl: uploadedImageUrl,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          locationName: locationData.locationName,
          businessType: formData.businessType.trim(),
          taxId: formData.taxId.trim(),
          bankAccount: formData.bankAccount.trim(),
          bankName: formData.bankName.trim(),
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          isOpen: formData.isOpen,
          minOrderAmount: formData.minOrderAmount,
          deliveryFee: formData.deliveryFee,
          deliveryRadius: formData.deliveryRadius
        }),
      });

      if (response.ok) {
        const updatedRestaurant = await response.json();
        refreshRestaurant(updatedRestaurant); // ใช้ SWR mutate แทน setRestaurant
        setSelectedImageFile(null); // Clear selected file after successful upload
        showSuccess('บันทึกข้อมูลสำเร็จ');
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchError.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/restaurant')}
          variant="outlined"
        >
          กลับ
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton 
          onClick={() => router.push('/restaurant')}
          sx={{ color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            ตั้งค่าร้านอาหาร
          </Typography>
          <Typography variant="body1" color="text.secondary">
            จัดการข้อมูลและการตั้งค่าร้านอาหารของคุณ
          </Typography>
        </Box>
        <Avatar
          src={formData.imageUrl || undefined}
          alt={formData.name}
          sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
        >
          {formData.name.charAt(0)}
        </Avatar>
      </Box>

      {/* Error Alert จะถูกแสดงผ่าน NotificationComponent แล้ว */}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* รูปภาพหน้าปก */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Upload color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  รูปภาพหน้าปกร้าน
                </Typography>
                {formData.imageUrl && (
                  <Typography variant="body2" color="text.secondary">
                    (มีรูปภาพปัจจุบัน)
                  </Typography>
                )}
              </Box>
              
              {/* แสดงรูปภาพปัจจุบันแยกต่างหาก */}
              {formData.imageUrl && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    รูปภาพหน้าปกปัจจุบัน:
                  </Typography>
                  <Box
                    component="img"
                    src={formData.imageUrl}
                    alt="รูปภาพหน้าปกปัจจุบัน"
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: `2px solid ${theme.palette.divider}`,
                      boxShadow: 2
                    }}
                  />
                </Box>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {formData.imageUrl ? 'อัปโหลดรูปใหม่เพื่อเปลี่ยนแปลง:' : 'อัปโหลดรูปภาพหน้าปกร้าน:'}
              </Typography>
              
              <Box sx={{ width: '100%' }}>
                <ImageUploadDropzone
                  currentImageUrl={formData.imageUrl}
                  onImageChange={handleImageChange}
                  variant="banner"
                  size="large"
                  category="banner"
                  restaurantId={restaurant?.id}
                  allowParentDelete={true}
                />
              </Box>
            </CardContent>
          </Card>

          {/* ข้อมูลพื้นฐาน */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Restaurant color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ข้อมูลพื้นฐาน
                </Typography>
               
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  รหัสร้านอาหาร: <Link href={`/menu/${restaurant?.id}`} target="_blank" rel="noopener noreferrer"> {restaurant?.id} </Link>
              </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label="ชื่อร้าน *"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="โทรศัพท์ *"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="อีเมล"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                
                <TextField
                  fullWidth
                  label="ที่อยู่ *"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
                
                <TextField
                  fullWidth
                  label="คำอธิบายร้าน"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="เขียนคำอธิบายเกี่ยวกับร้านอาหารของคุณ..."
                />
              </Box>
            </CardContent>
          </Card>

          {/* ตำแหน่งร้าน */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LocationOn color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ตำแหน่งร้านอาหาร
                </Typography>
              </Box>
              
              <LocationPicker
                value={{
                  ...locationData,
                  address: formData.address // Always use form address as master
                }}
                onChange={handleLocationChange}
                disabled={saving}
                required={false}
              />
            </CardContent>
          </Card>

          {/* ข้อมูลธุรกิจ */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Business color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ข้อมูลธุรกิจ
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label="ประเภทธุรกิจ"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    placeholder="เช่น ร้านอาหารไทย, ร้านอาหารญี่ปุ่น"
                  />
                  <TextField
                    fullWidth
                    label="เลขประจำตัวผู้เสียภาษี"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="13 หลัก"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    label="เลขบัญชีธนาคาร"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="ชื่อธนาคาร"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="เช่น ธนาคารกสิกรไทย"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* เวลาเปิด-ปิด */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Schedule color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  เวลาเปิด-ปิด
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label="เวลาเปิด"
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => handleInputChange('openTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  label="เวลาปิด"
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => handleInputChange('closeTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 200 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isOpen}
                      onChange={(e) => handleInputChange('isOpen', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="เปิดให้บริการ"
                />
              </Box>
            </CardContent>
          </Card>

          {/* การจัดส่ง */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <DeliveryDining color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  การจัดส่ง
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label="ยอดสั่งขั้นต่ำ (บาท)"
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="ค่าจัดส่ง (บาท)"
                  type="number"
                  value={formData.deliveryFee}
                  onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="รัศมีจัดส่ง (กม.)"
                  type="number"
                  value={formData.deliveryRadius}
                  onChange={(e) => handleInputChange('deliveryRadius', parseFloat(e.target.value) || 5)}
                  inputProps={{ min: 1, max: 50, step: 0.5 }}
                  sx={{ flex: 1 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* ปุ่มบันทึก */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => router.push('/restaurant')}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              type="submit"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              disabled={saving}
              sx={{ minWidth: 120 }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </Box>
        </Box>
      </form>

      {/* Global Notification จะแสดงผ่าน NotificationProvider แล้ว */}
    </Box>
  );
} 