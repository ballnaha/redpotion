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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  useMediaQuery,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { Add, Restaurant, Star, Whatshot, FiberNew, LocalFireDepartment } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ImageUploadDropzone, { uploadImageFile } from './ImageUploadDropzone';

interface Category {
  id: string;
  name: string;
  _count: {
    menuItems: number;
  };
}

interface AddMenuModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurantId?: string;
}

export default function AddMenuModal({
  open,
  onClose,
  onSuccess,
  restaurantId
}: AddMenuModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    calories: '',
    tags: [] as string[]
  });

  useEffect(() => {
    if (open) {
      loadCategories();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      imageUrl: '',
      calories: '',
      tags: []
    });
    setNewCategoryName('');
    setShowNewCategory(false);
    setSelectedImageFile(null);
    setError(null);
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch('/api/restaurant/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setError('ไม่สามารถโหลดหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('เกิดข้อผิดพลาดในการโหลดหมวดหมู่');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'new') {
      setShowNewCategory(true);
      setFormData(prev => ({ ...prev, categoryId: '' }));
    } else {
      setShowNewCategory(false);
      setFormData(prev => ({ ...prev, categoryId: value }));
    }
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Available tags with icons and labels
  const availableTags = [
    { value: 'recommended', label: 'เมนูแนะนำ', icon: <Star />, color: '#fbbf24' },
    { value: 'bestseller', label: 'ขายดี', icon: <LocalFireDepartment />, color: '#f97316' },
    { value: 'new', label: 'เมนูใหม่', icon: <FiberNew />, color: '#06b6d4' },
    { value: 'spicy', label: 'เผ็ด', icon: <Whatshot />, color: '#dc2626' }
  ];

  const createCategory = async (): Promise<string | null> => {
    if (!newCategoryName.trim()) return null;

    try {
      const response = await fetch('/api/restaurant/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        return newCategory.id;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      throw new Error(error.message || 'ไม่สามารถสร้างหมวดหมู่ได้');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('กรุณาระบุชื่อเมนู');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('กรุณาระบุราคาที่ถูกต้อง');
      }

      let categoryId = formData.categoryId;

      // สร้างหมวดหมู่ใหม่ถ้าจำเป็น
      if (showNewCategory) {
        const newCategoryId = await createCategory();
        if (!newCategoryId) {
          throw new Error('กรุณาระบุชื่อหมวดหมู่ใหม่');
        }
        categoryId = newCategoryId;
      } else if (!categoryId) {
        throw new Error('กรุณาเลือกหมวดหมู่');
      }

      let uploadedImageUrl = formData.imageUrl;

      // Upload image if new file is selected
      if (selectedImageFile && restaurantId) {
        try {
          uploadedImageUrl = await uploadImageFile(
            selectedImageFile,
            restaurantId,
            'menu',
            'menu'
          );
          console.log('✅ Menu image uploaded successfully:', uploadedImageUrl);
        } catch (uploadError) {
          console.error('❌ Menu image upload failed:', uploadError);
          setError('ไม่สามารถอัปโหลดรูปภาพเมนูได้ กรุณาลองใหม่');
          setLoading(false);
          return;
        }
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        categoryId,
        imageUrl: uploadedImageUrl?.trim() || null,
        calories: formData.calories ? parseInt(formData.calories) : null,
        tags: formData.tags
      };

      const response = await fetch('/api/restaurant/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setSelectedImageFile(null);
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'เกิดข้อผิดพลาดในการสร้างเมนู');
      }
    } catch (error: any) {
      console.error('Error creating menu item:', error);
      setError(error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Restaurant color="primary" />
          เพิ่มเมนูใหม่
        </Box>
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
              ข้อมูลเมนู
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="ชื่อเมนู"
                value={formData.name}
                onChange={handleChange('name')}
                required
                placeholder="เช่น ผัดไทยกุ้งสด"
              />

              <TextField
                fullWidth
                label="คำอธิบาย"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={3}
                placeholder="อธิบายเกี่ยวกับเมนูนี้..."
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="ราคา (บาท)"
                  type="number"
                  value={formData.price}
                  onChange={handleChange('price')}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ flex: '1 1 150px' }}
                />
                <TextField
                  label="แคลอรี่"
                  type="number"
                  value={formData.calories}
                  onChange={handleChange('calories')}
                  inputProps={{ min: 0 }}
                  sx={{ flex: '1 1 150px' }}
                />
              </Box>

              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  📸 รูปภาพเมนู
                </Typography>
                <Box sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, 
                    ${theme.palette.primary.main}05, 
                    ${theme.palette.secondary.main}05)`,
                  border: `1px solid ${theme.palette.primary.main}15`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    align="center"
                  >
                    เพิ่มรูปภาพเมนูที่น่าสนใจ
                  </Typography>
                  <ImageUploadDropzone
                    currentImageUrl={formData.imageUrl || undefined}
                    onImageChange={(url: string | null, file?: File) => {
                      setFormData(prev => ({ ...prev, imageUrl: url || '' }));
                      setSelectedImageFile(file || null);
                    }}
                    disabled={loading}
                    size="medium"
                    variant="avatar"
                    restaurantId={restaurantId}
                    category="menu"
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* หมวดหมู่ */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              หมวดหมู่
            </Typography>
            
            {categoriesLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography>กำลังโหลดหมวดหมู่...</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>เลือกหมวดหมู่</InputLabel>
                  <Select
                    value={showNewCategory ? 'new' : formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    label="เลือกหมวดหมู่"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{category.name}</span>
                          <Chip 
                            size="small" 
                            label={`${category._count.menuItems} เมนู`}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem value="new">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Add fontSize="small" />
                        <span>สร้างหมวดหมู่ใหม่</span>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {showNewCategory && (
                  <TextField
                    fullWidth
                    label="ชื่อหมวดหมู่ใหม่"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="เช่น อาหารจานหลัก"
                    required
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Tags */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              ป้ายกำกับ
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 2 }}
            >
              เลือกป้ายกำกับที่เหมาะสมกับเมนูนี้
            </Typography>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {availableTags.map((tag) => (
                <Chip
                  key={tag.value}
                  icon={tag.icon}
                  label={tag.label}
                  onClick={() => handleTagToggle(tag.value)}
                  variant={formData.tags.includes(tag.value) ? "filled" : "outlined"}
                  sx={{
                    mb: 1,
                    backgroundColor: formData.tags.includes(tag.value) 
                      ? `${tag.color}20` 
                      : 'transparent',
                    borderColor: tag.color,
                    color: formData.tags.includes(tag.value) 
                      ? tag.color 
                      : 'text.secondary',
                    '& .MuiChip-icon': {
                      color: formData.tags.includes(tag.value) 
                        ? tag.color 
                        : 'text.secondary'
                    },
                    '&:hover': {
                      backgroundColor: `${tag.color}15`,
                      borderColor: tag.color,
                      color: tag.color,
                      '& .MuiChip-icon': {
                        color: tag.color
                      }
                    },
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </Stack>

            {formData.tags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  ป้ายกำกับที่เลือก: {formData.tags.length} รายการ
                </Typography>
              </Box>
            )}
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
          disabled={loading || categoriesLoading}
          startIcon={loading ? <CircularProgress size={20} /> : <Add />}
        >
          {loading ? 'กำลังเพิ่ม...' : 'เพิ่มเมนู'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 