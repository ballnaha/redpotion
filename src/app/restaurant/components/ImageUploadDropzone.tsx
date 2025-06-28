'use client';

import { useState, useCallback } from 'react';
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
  allowParentDelete = false
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

  // Enhanced size configurations
  const sizeConfig = {
    small: variant === 'banner' ? { width: 140, height: 79 } 
           : variant === 'gallery' ? { width: 107, height: 80 }
           : { width: 80, height: 80 },
    medium: variant === 'banner' ? { width: 200, height: 112 } 
            : variant === 'gallery' ? { width: 160, height: 120 }
            : { width: 120, height: 120 },
    large: variant === 'banner' ? { width: '100%', height: 200 } 
           : variant === 'gallery' ? { width: '100%', height: 240 }
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
    <Box sx={{ width: '100%', maxWidth: variant === 'banner' && size === 'large' ? 'none' : 350 }}>
      {/* Current Image Preview */}
      {previewUrl && (
        <Fade in timeout={500}>
          <Box 
            sx={{ 
              mb: 2, 
              position: 'relative', 
              display: variant === 'banner' && size === 'large' ? 'block' : 'inline-block',
              width: variant === 'banner' && size === 'large' ? '100%' : 'auto',
              // ลบ hover effect เพราะปุ่มแสดงตลอดแล้ว
            }}
          >
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                width: currentSize.width,
                height: currentSize.height,
                borderRadius,
                objectFit: 'cover',
                border: `3px solid transparent`,
                background: `linear-gradient(white, white) padding-box, 
                           linear-gradient(135deg, 
                             ${theme.palette.primary.main}, 
                             ${theme.palette.secondary.main}
                           ) border-box`,
                display: 'block',
                boxShadow: `0 8px 32px ${theme.palette.primary.main}25`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: `0 12px 40px ${theme.palette.primary.main}35`,
                }
              }}
            />
            <IconButton
              className="delete-button"
              onClick={handleDeleteClick}
              disabled={disabled || deleting}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                color: 'white',
                width: 32,
                height: 32,
                opacity: 1, // แสดงตลอดเวลา
                transform: 'scale(1)', // ขนาดปกติ
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'error.dark',
                  transform: 'scale(1.1)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                }
              }}
            >
              {deleting ? (
                <CircularProgress size={16} sx={{ color: 'white' }} />
              ) : (
                <Delete sx={{ fontSize: 16 }} />
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

      {/* Enhanced Upload Area */}
      {!previewUrl && (
        <Box
          {...getRootProps()}
          sx={{
            width: currentSize.width,
            height: currentSize.height,
            border: isDragActive || isDragOver
              ? `3px solid ${theme.palette.primary.main}`
              : isDragReject 
              ? `3px solid ${theme.palette.error.main}`
              : `3px dashed ${theme.palette.divider}`,
            borderRadius,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: isDragActive || isDragOver
              ? `linear-gradient(135deg, 
                  ${theme.palette.primary.main}15, 
                  ${theme.palette.secondary.main}15)`
              : isDragReject
              ? `linear-gradient(135deg, 
                  ${theme.palette.error.main}15, 
                  ${theme.palette.error.light}15)`
              : `linear-gradient(135deg, 
                  ${theme.palette.grey[50]}, 
                  ${theme.palette.grey[100]})`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': disabled ? {} : {
              borderColor: theme.palette.primary.main,
              background: `linear-gradient(135deg, 
                ${theme.palette.primary.main}08, 
                ${theme.palette.secondary.main}08)`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 25px ${theme.palette.primary.main}20`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isDragActive
                ? `linear-gradient(45deg, 
                    ${theme.palette.primary.main}20 25%, 
                    transparent 25%, 
                    transparent 75%, 
                    ${theme.palette.primary.main}20 75%),
                   linear-gradient(45deg, 
                    ${theme.palette.primary.main}20 25%, 
                    transparent 25%, 
                    transparent 75%, 
                    ${theme.palette.primary.main}20 75%)`
                : 'none',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
              opacity: isDragActive ? 0.5 : 0,
              transition: 'opacity 0.3s ease',
            }
          }}
        >
          <input {...getInputProps()} />
          
          <Stack spacing={1} alignItems="center">
            {isDragActive ? (
              <CloudUpload 
                sx={{ 
                  fontSize: size === 'small' ? 28 : size === 'medium' ? 32 : 36,
                  color: theme.palette.primary.main,
                  animation: 'bounce 1s infinite',
                  '@keyframes bounce': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' }
                  }
                }} 
              />
            ) : (
              <AddPhotoAlternate 
                sx={{ 
                  fontSize: size === 'small' ? 24 : size === 'medium' ? 28 : 32,
                  color: theme.palette.text.secondary,
                  transition: 'all 0.3s ease',
                }} 
              />
            )}
            
            <Typography 
              variant="caption" 
              align="center"
              sx={{ 
                color: isDragActive 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                fontSize: size === 'small' ? '0.7rem' : '0.75rem',
                fontWeight: isDragActive ? 600 : 400,
                lineHeight: 1.2,
                transition: 'all 0.3s ease',
              }}
            >
              {isDragActive ? 'วางที่นี่' : 'เลือกรูป'}
            </Typography>

            {size !== 'small' && !isDragActive && (
              <Typography 
                variant="caption" 
                align="center"
                sx={{ 
                  color: theme.palette.text.disabled,
                  fontSize: '0.65rem',
                  lineHeight: 1,
                  opacity: 0.7
                }}
              >
                ลาก หรือ คลิก
              </Typography>
            )}
          </Stack>
        </Box>
      )}

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