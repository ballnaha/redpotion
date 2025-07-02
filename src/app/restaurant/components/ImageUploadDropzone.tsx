'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { useNotification } from '../../../contexts/NotificationContext';
import { 
  PhotoCamera, 
  Delete, 
  CloudUpload, 
  CheckCircle,
  ErrorOutline,
  Image as ImageIcon,
  CameraAlt,
  AddPhotoAlternate
} from '@mui/icons-material';

interface ImageUploadDropzoneProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null, file?: File) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'avatar' | 'banner' | 'gallery';
  restaurantId?: string;
  category?: 'profile' | 'menu' | 'banner' | 'gallery' | 'temp';
  maxFileSize?: number;
  accept?: string[];
  allowParentDelete?: boolean; // ให้ parent component จัดการการลบ
  showPreview?: boolean; // ควบคุมการแสดง preview
}

export default function ImageUploadDropzone({
  currentImageUrl,
  onImageChange,
  disabled = false,
  size = 'medium',
  variant = 'avatar',
  restaurantId,
  category = 'profile',
  maxFileSize = 15 * 1024 * 1024, // 15MB
  accept = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowParentDelete = false,
  showPreview = true
}: ImageUploadDropzoneProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError } = useNotification();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Sync previewUrl with currentImageUrl prop changes
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  // Reset image load error when previewUrl changes
  useEffect(() => {
    setImageLoadError(false);
  }, [previewUrl]);

  // Enhanced size configurations
  const sizeConfig = {
    small: variant === 'banner' ? { width: 140, height: 79 } 
           : variant === 'gallery' ? { width: 180, height: 101 } // 16:9 ratio อิงจาก 1280x720
           : { width: 80, height: 80 },
    medium: variant === 'banner' ? { width: 200, height: 112 } 
            : variant === 'gallery' ? { width: 256, height: 144 } // 16:9 ratio อิงจาก 1280x720
            : { width: 120, height: 120 },
    large: variant === 'banner' ? { width: '100%', height: 200 } 
           : variant === 'gallery' ? { width: '100%', height: 'auto', aspectRatio: '16/9' } // เหมาะสำหรับ 16:9
           : { width: 160, height: 160 }
  };

  // Create preview URL from file
  const createPreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!accept.includes(file.type)) {
      return `รองรับเฉพาะไฟล์ ${accept.join(', ')}`;
    }
    
    if (file.size > maxFileSize) {
      return `ขนาดไฟล์ต้องไม่เกิน ${Math.round(maxFileSize / (1024 * 1024))} MB`;
    }
    
    return null;
  };

  // Handle file selection
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return;

    setIsDragOver(false);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.[0]?.code === 'file-too-large') {
        setError(`ขนาดไฟล์ต้องไม่เกิน ${Math.round(maxFileSize / (1024 * 1024))} MB`);
      } else if (rejection.errors?.[0]?.code === 'file-invalid-type') {
        setError(`รองรับเฉพาะไฟล์รูปภาพ (.jpg, .png, .webp)`);
      } else {
        setError('ไฟล์ที่เลือกไม่ถูกต้อง');
      }
      return;
    }

    // Handle accepted file (only one file)
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setSelectedFile(file);
      
      // Create preview
      const preview = createPreview(file);
      setPreviewUrl(preview);
      
      // Pass file to parent (will upload when form is submitted)
      onImageChange(preview, file);
    }
  }, [disabled, maxFileSize, accept, onImageChange]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled,
    multiple: false,
    maxFiles: 1,
    maxSize: maxFileSize,
    accept: {
      'image/*': accept.map(type => type.replace('image/', '.'))
    },
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
  });

  // Handle delete button click
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!previewUrl) return;

    // If it's a new file (blob URL), just remove locally
    if (previewUrl.startsWith('blob:')) {
      if (previewUrl && selectedFile) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      onImageChange(null);
      setDeleteDialogOpen(false);
      return;
    }

    // If it's an existing image (server URL)
    if (previewUrl.startsWith('/uploads/') && restaurantId) {
      if (allowParentDelete) {
        // Let parent component handle the deletion (for restaurant settings)
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
        onImageChange(null);
        setDeleteDialogOpen(false);
        console.log('✅ Image deletion handled by parent component');
      } else {
        // Handle deletion internally (for menu items, categories)
        try {
          setDeleting(true);
          
          const response = await fetch('/api/restaurant/delete-image', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: previewUrl,
              category: category
            }),
          });

          if (response.ok) {
            setSelectedFile(null);
            setPreviewUrl(null);
            setError(null);
            onImageChange(null);
            setDeleteDialogOpen(false);
            showSuccess('ลบรูปภาพสำเร็จ');
            console.log('✅ Image deleted successfully');
          } else {
            const errorData = await response.json();
            const errorMessage = errorData.message || 'ไม่สามารถลบรูปภาพได้';
            setError(errorMessage);
            showError(errorMessage);
            setDeleteDialogOpen(false); // ปิด dialog แม้จะเกิดข้อผิดพลาด
          }
        } catch (error) {
          console.error('❌ Delete error:', error);
          const errorMessage = 'เกิดข้อผิดพลาดในการลบรูปภาพ';
          setError(errorMessage);
          showError(errorMessage);
          setDeleteDialogOpen(false); // ปิด dialog แม้จะเกิดข้อผิดพลาด
        } finally {
          setDeleting(false);
        }
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const currentSize = sizeConfig[size];
  const borderRadius = variant === 'avatar' ? '50%' : (variant === 'banner' && size === 'large' ? 0 : 1);

  return (
    <Box sx={{ width: '100%', maxWidth: (variant === 'banner' || variant === 'gallery') && size === 'large' ? 'none' : 350 }}>
      {/* Minimal Professional Preview */}
      {showPreview && previewUrl && !imageLoadError && (
        <Fade in timeout={400}>
          <Box 
            sx={{ 
              mb: 2.5, 
              position: 'relative', 
              display: (variant === 'banner' || variant === 'gallery') && size === 'large' ? 'block' : 'inline-block',
              width: (variant === 'banner' || variant === 'gallery') && size === 'large' ? '100%' : 'auto',
            }}
          >
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                width: currentSize.width,
                height: currentSize.height,
                borderRadius: variant === 'gallery' ? 2 : borderRadius,
                objectFit: 'cover',
                border: '1px solid #e2e8f0',
                display: 'block',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                background: '#f8fafc',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #cbd5e1'
                }
              }}
              onError={() => {
                console.log('❌ Image load error, hiding preview');
                setImageLoadError(true);
              }}
            />
            
            {/* Minimal Delete Button */}
            <IconButton
              className="delete-button"
              onClick={handleDeleteClick}
              disabled={disabled || deleting}
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                bgcolor: '#dc2626',
                color: 'white',
                width: 28,
                height: 28,
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                border: '2px solid white',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: '#b91c1c',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                }
              }}
            >
              {deleting ? (
                <CircularProgress size={14} sx={{ color: 'white' }} />
              ) : (
                <Delete sx={{ fontSize: 14 }} />
              )}
            </IconButton>

            {/* Professional Status Indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                bgcolor: 'rgba(34, 197, 94, 0.9)',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <CheckCircle sx={{ fontSize: 12 }} />
              พร้อมใช้งาน
            </Box>
          </Box>
        </Fade>
      )}

      {/* Fallback Preview เมื่อ showPreview=true แต่รูปภาพโหลดไม่ได้ */}
      {showPreview && previewUrl && imageLoadError && (
        <Fade in timeout={400}>
          <Box 
            sx={{ 
              mb: 2.5, 
              position: 'relative', 
              display: (variant === 'banner' || variant === 'gallery') && size === 'large' ? 'block' : 'inline-block',
              width: (variant === 'banner' || variant === 'gallery') && size === 'large' ? '100%' : 'auto',
            }}
          >
            <Box
              sx={{
                width: currentSize.width,
                height: currentSize.height,
                borderRadius: variant === 'gallery' ? 2 : borderRadius,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }
              }}
            >
              {/* Professional Icon */}
              <Box
                sx={{
                  width: variant === 'gallery' ? 56 : 48,
                  height: variant === 'gallery' ? 56 : 48,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
                  position: 'relative',
                  zIndex: 1,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 2,
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }
                }}
              >
                <AddPhotoAlternate 
                  sx={{ 
                    fontSize: variant === 'gallery' ? 28 : 24,
                    color: 'white',
                    position: 'relative',
                    zIndex: 1
                  }} 
                />
              </Box>

              {/* Typography */}
              <Typography 
                variant="subtitle1"
                sx={{ 
                  color: '#1e293b',
                  fontWeight: 700,
                  textAlign: 'center',
                  px: 2,
                  mb: 0.5,
                  fontSize: variant === 'gallery' ? '1rem' : '0.875rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {variant === 'gallery' ? 'Gallery Preview' : 'Image Preview'}
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  textAlign: 'center',
                  px: 2,
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                  fontWeight: 400,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                รูปภาพไม่สามารถโหลดได้ หรือ ไม่มีรูปภาพนี้
              </Typography>
            </Box>
            
            {/* Minimal Delete Button */}
            <IconButton
              className="delete-button"
              onClick={handleDeleteClick}
              disabled={disabled || deleting}
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                bgcolor: '#dc2626',
                color: 'white',
                width: 28,
                height: 28,
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                border: '2px solid white',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: '#b91c1c',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                }
              }}
            >
              {deleting ? (
                <CircularProgress size={14} sx={{ color: 'white' }} />
              ) : (
                <Delete sx={{ fontSize: 14 }} />
              )}
            </IconButton>
          </Box>
        </Fade>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          ยืนยันการลบรูปภาพ
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            คุณแน่ใจหรือไม่ที่ต้องการลบรูปภาพนี้?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            {deleting ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Always Show Upload Area - เสมอแสดง upload area */}
      <Box
        {...getRootProps()}
        sx={{
          width: currentSize.width,
          height: (showPreview && previewUrl && !imageLoadError) ? 'auto' : currentSize.height, // พิจารณา imageLoadError
          minHeight: (showPreview && previewUrl && !imageLoadError) ? 80 : currentSize.height, // พิจารณา imageLoadError
          border: isDragActive || isDragOver
            ? '2px solid #6366f1'
            : isDragReject 
            ? '2px solid #dc2626'
            : '2px dashed #cbd5e1',
          borderRadius: variant === 'gallery' ? 3 : borderRadius,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragActive || isDragOver
            ? 'linear-gradient(145deg, #f0f4ff 0%, #e0e7ff 100%)'
            : isDragReject
            ? 'linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          py: (showPreview && previewUrl && !imageLoadError) ? 2 : 0, // พิจารณา imageLoadError
          '&:hover': disabled ? {} : {
            borderColor: '#6366f1',
            background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDragActive
              ? 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)'
              : 'none',
            opacity: isDragActive ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }
        }}
      >
        <input {...getInputProps()} />
        
        <Stack spacing={(showPreview && previewUrl && !imageLoadError) ? 1 : 1.5} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Professional Icon Container */}
          <Box
            sx={{
              width: (showPreview && previewUrl && !imageLoadError)
                ? (size === 'small' ? 40 : size === 'medium' ? 48 : 56)
                : (size === 'small' ? 56 : size === 'medium' ? 64 : 72),
              height: (showPreview && previewUrl && !imageLoadError)
                ? (size === 'small' ? 40 : size === 'medium' ? 48 : 56)
                : (size === 'small' ? 56 : size === 'medium' ? 64 : 72),
              borderRadius: 3,
              background: isDragActive 
                ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                : isDragReject
                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isDragActive 
                ? '0 8px 25px rgba(99, 102, 241, 0.3)'
                : isDragReject
                ? '0 8px 25px rgba(220, 38, 38, 0.3)'
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isDragActive ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {isDragActive ? (
              <CloudUpload 
                sx={{ 
                  fontSize: (showPreview && previewUrl && !imageLoadError)
                    ? (size === 'small' ? 20 : size === 'medium' ? 24 : 28)
                    : (size === 'small' ? 28 : size === 'medium' ? 32 : 36),
                  color: 'white',
                  animation: 'bounce 1s infinite',
                  '@keyframes bounce': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-3px)' }
                  }
                }} 
              />
            ) : (
              <AddPhotoAlternate 
                sx={{ 
                  fontSize: (showPreview && previewUrl && !imageLoadError)
                    ? (size === 'small' ? 18 : size === 'medium' ? 22 : 26)
                    : (size === 'small' ? 24 : size === 'medium' ? 28 : 32),
                  color: isDragReject ? 'white' : '#64748b',
                  transition: 'all 0.3s ease',
                }} 
              />
            )}
          </Box>
          
          {/* Clean Typography */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="subtitle2"
              sx={{ 
                color: isDragActive 
                  ? '#6366f1' 
                  : isDragReject
                  ? '#dc2626'
                  : '#1e293b',
                fontSize: (showPreview && previewUrl && !imageLoadError)
                  ? (size === 'small' ? '0.75rem' : '0.825rem')
                  : (size === 'small' ? '0.875rem' : '0.95rem'),
                fontWeight: 600,
                lineHeight: 1.3,
                mb: 0.5,
                transition: 'all 0.3s ease',
              }}
            >
              {isDragActive 
                ? 'วางรูปภาพที่นี่' 
                : isDragReject
                ? 'ไฟล์ไม่ถูกต้อง'
                : ((showPreview && previewUrl && !imageLoadError) ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ')}
            </Typography>

            {size !== 'small' && !isDragReject && (
              <Typography 
                variant="body2"
                sx={{ 
                  color: '#64748b',
                  fontSize: (showPreview && previewUrl && !imageLoadError) ? '0.7rem' : '0.8rem',
                  lineHeight: 1.2,
                  fontWeight: 400
                }}
              >
                {isDragActive 
                  ? 'ปล่อยเพื่ออัพโหลด' 
                  : (showPreview && previewUrl && !imageLoadError)
                  ? 'ลาก & วาง หรือ คลิกเพื่อเปลี่ยน'
                  : 'ลาก & วาง หรือ คลิกเพื่อเลือก'}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      {/* Enhanced File Info */}
      {selectedFile && (
        <Fade in timeout={300}>
          <Box 
            sx={{ 
              mt: 1, 
              p: 1.5, 
              background: `linear-gradient(135deg, 
                ${theme.palette.primary.main}08, 
                ${theme.palette.secondary.main}08)`,
              borderRadius: 2,
              border: `1px solid ${theme.palette.primary.main}20`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Stack>
          </Box>
        </Fade>
      )}

      {/* Enhanced Error Alert */}
      <Fade in={!!error}>
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          icon={<ErrorOutline />}
          sx={{ 
            mt: 1, 
            fontSize: '0.75rem',
            background: `linear-gradient(135deg, 
              ${theme.palette.error.main}08, 
              ${theme.palette.error.light}08)`,
            border: `1px solid ${theme.palette.error.main}30`,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1rem'
            }
          }}
        >
          {error}
        </Alert>
      </Fade>
    </Box>
  );
}

// Export upload function for external use
export const uploadImageFile = async (
  file: File, 
  restaurantId: string, 
  category: string = 'profile', 
  variant: string = 'avatar'
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('variant', variant);

  const response = await fetch('/api/restaurant/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || 'การอัปโหลดล้มเหลว');
    } catch {
      throw new Error(`HTTP ${response.status}: ${errorText || 'การอัปโหลดล้มเหลว'}`);
    }
  }

  const data = await response.json();
  return data.imageUrl;
}; 