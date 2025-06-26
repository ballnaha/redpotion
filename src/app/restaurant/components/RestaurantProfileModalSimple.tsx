'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ImageUploadDropzone, { uploadImageFile } from './ImageUploadDropzone';

interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  openTime?: string;
  closeTime?: string;
  isOpen: boolean;
  minOrderAmount?: number;
  deliveryFee?: number;
  deliveryRadius?: number;
}

interface RestaurantProfileModalProps {
  open: boolean;
  onClose: () => void;
  restaurant: RestaurantData | null;
  onUpdate: (updatedRestaurant: RestaurantData) => void;
}

export default function RestaurantProfileModal({
  open,
  onClose,
  restaurant,
  onUpdate
}: RestaurantProfileModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    imageUrl: '',
    openTime: '',
    closeTime: '',
    isOpen: true,
    minOrderAmount: '',
    deliveryFee: '',
    deliveryRadius: ''
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        imageUrl: restaurant.imageUrl || '',
        openTime: restaurant.openTime || '',
        closeTime: restaurant.closeTime || '',
        isOpen: restaurant.isOpen,
        minOrderAmount: restaurant.minOrderAmount?.toString() || '',
        deliveryFee: restaurant.deliveryFee?.toString() || '',
        deliveryRadius: restaurant.deliveryRadius?.toString() || ''
      });
      setError(null);
    }
  }, [restaurant]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!restaurant) return;

    setLoading(true);
    setError(null);

    try {
      let uploadedImageUrl = formData.imageUrl;

      // Upload image if new file is selected
      if (selectedImageFile && restaurant.id) {
        try {
          uploadedImageUrl = await uploadImageFile(
            selectedImageFile,
            restaurant.id,
            'banner',
            'banner'
          );
          console.log('✅ Image uploaded successfully:', uploadedImageUrl);
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          setError('ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่');
          setLoading(false);
          return;
        }
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        imageUrl: uploadedImageUrl?.trim() || null,
        openTime: formData.openTime || null,
        closeTime: formData.closeTime || null,
        isOpen: formData.isOpen,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : null,
        deliveryRadius: formData.deliveryRadius ? parseFloat(formData.deliveryRadius) : null
      };

      const response = await fetch('/api/restaurant/my-restaurant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const updatedRestaurant = await response.json();
        onUpdate(updatedRestaurant);
        setSelectedImageFile(null);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'เกิดข้อผิดพลาดในการอัปเดต');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: isMobile ? 0 : 3,
          margin: isMobile ? 0 : undefined,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: '1.5rem' }}>
        แก้ไขข้อมูลร้าน
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* ข้อมูลพื้นฐาน */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              ข้อมูลพื้นฐาน
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: isMobile ? 'column' : 'row',
                flexWrap: 'wrap' 
              }}>
                <TextField
                  label="ชื่อร้าน"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                  sx={{ flex: isMobile ? '1 1 100%' : '1 1 250px' }}
                />
                <TextField
                  label="โทรศัพท์"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  required
                  sx={{ flex: isMobile ? '1 1 100%' : '1 1 250px' }}
                />
              </Box>

              <TextField
                fullWidth
                label="ที่อยู่"
                value={formData.address}
                onChange={handleChange('address')}
                multiline
                rows={2}
                required
              />

              <TextField
                fullWidth
                label="คำอธิบายร้าน"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={3}
                placeholder="บอกลูกค้าเกี่ยวกับร้านของคุณ..."
              />

              <TextField
                fullWidth
                label="อีเมล"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
              />

              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  🖼️ รูปภาพหน้าปกร้าน
                </Typography>
                <Box sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, 
                    ${theme.palette.grey[50]}, 
                    ${theme.palette.grey[100]})`,
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    align="center"
                    sx={{ mb: 1 }}
                  >
                    อัปโหลดรูปภาพหน้าปกสำหรับร้านของคุณ (แนะนำขนาด 16:9)
                  </Typography>
                  <ImageUploadDropzone
                    currentImageUrl={formData.imageUrl || undefined}
                    onImageChange={(url: string | null, file?: File) => {
                      setFormData(prev => ({ ...prev, imageUrl: url || '' }));
                      setSelectedImageFile(file || null);
                    }}
                    disabled={loading}
                    size="large"
                    variant="banner"
                    restaurantId={restaurant?.id}
                    category="banner"
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* เวลาเปิด-ปิด */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              เวลาเปิด-ปิด
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                label="เวลาเปิด"
                type="time"
                value={formData.openTime}
                onChange={handleChange('openTime')}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <TextField
                label="เวลาปิด"
                type="time"
                value={formData.closeTime}
                onChange={handleChange('closeTime')}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isOpen}
                    onChange={handleChange('isOpen')}
                    color="primary"
                  />
                }
                label="เปิดให้บริการ"
              />
            </Box>
          </Box>

          {/* การจัดส่ง */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              การจัดส่ง
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="ยอดสั่งขั้นต่ำ (บาท)"
                type="number"
                value={formData.minOrderAmount}
                onChange={handleChange('minOrderAmount')}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ flex: '1 1 150px' }}
              />
              <TextField
                label="ค่าจัดส่ง (บาท)"
                type="number"
                value={formData.deliveryFee}
                onChange={handleChange('deliveryFee')}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ flex: '1 1 150px' }}
              />
              <TextField
                label="รัศมีจัดส่ง (กม.)"
                type="number"
                value={formData.deliveryRadius}
                onChange={handleChange('deliveryRadius')}
                inputProps={{ min: 0, step: 0.1 }}
                sx={{ flex: '1 1 150px' }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 