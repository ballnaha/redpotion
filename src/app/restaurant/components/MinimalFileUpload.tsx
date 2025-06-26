'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  Alert,
  IconButton,
  Paper,
  useTheme,
  Fade,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  AttachFile,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';

interface FileWithPreview extends File {
  preview?: string;
  uploadUrl?: string;
  uploading?: boolean;
  error?: string;
}

interface MinimalFileUploadProps {
  file: FileWithPreview | null;
  onFileChange: (file: FileWithPreview | null) => void;
  label: string;
  accept?: string[];
  maxFileSize?: number;
  disabled?: boolean;
  required?: boolean;
}

export default function MinimalFileUpload({
  file,
  onFileChange,
  label,
  accept = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  required = false
}: MinimalFileUploadProps) {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!accept.includes(file.type)) {
      return 'รองรับเฉพาะไฟล์รูปภาพและ PDF';
    }
    
    if (file.size > maxFileSize) {
      return `ขนาดไฟล์ต้องไม่เกิน ${Math.round(maxFileSize / (1024 * 1024))} MB`;
    }
    
    return null;
  };

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return;

    setError(null);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.[0]?.code === 'file-too-large') {
        setError(`ขนาดไฟล์ต้องไม่เกิน ${Math.round(maxFileSize / (1024 * 1024))} MB`);
      } else if (rejection.errors?.[0]?.code === 'file-invalid-type') {
        setError('ประเภทไฟล์ไม่ถูกต้อง');
      } else {
        setError('ไฟล์ที่เลือกไม่ถูกต้อง');
      }
      return;
    }

    // Handle accepted file (only one file)
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      const validationError = validateFile(selectedFile);
      
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create file with preview
      const fileWithPreview: FileWithPreview = Object.assign(selectedFile, {
        preview: selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : undefined,
        uploading: false,
        error: undefined
      });
      
      onFileChange(fileWithPreview);
    }
  }, [disabled, maxFileSize, accept, onFileChange]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: false,
    maxFiles: 1,
    maxSize: maxFileSize,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    }
  });

  // Remove file
  const handleRemoveFile = () => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFileChange(null);
    setError(null);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get file icon color
  const getFileIconColor = () => {
    if (file) return 'success.main';
    if (error) return 'error.main';
    return 'text.secondary';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" gutterBottom>
        {label} {required && <span style={{ color: theme.palette.error.main }}>*</span>}
      </Typography>

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: { xs: 3, sm: 2 },
          border: `2px dashed ${
            isDragActive 
              ? theme.palette.primary.main
              : file
                ? theme.palette.success.main
                : error
                  ? theme.palette.error.main
                  : theme.palette.grey[300]
          }`,
          borderRadius: 2,
          backgroundColor: isDragActive 
            ? `${theme.palette.primary.main}08`
            : file
              ? `${theme.palette.success.main}08`
              : error
                ? `${theme.palette.error.main}08`
                : theme.palette.grey[50],
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: disabled ? 0.6 : 1,
          minHeight: { xs: 100, sm: 80 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          '&:hover': disabled ? {} : {
            borderColor: file ? theme.palette.success.main : theme.palette.primary.main,
            backgroundColor: file 
              ? `${theme.palette.success.main}12`
              : `${theme.palette.primary.main}12`,
          },
          // Touch optimization for mobile
          '@media (hover: none)': {
            '&:active': {
              transform: 'scale(0.98)',
            }
          }
        }}
      >
        <input {...getInputProps()} />
        
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          {file ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {file.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  disabled={disabled}
                  sx={{ ml: 1 }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(file.size)}
              </Typography>
            </>
          ) : (
            <>
              <CloudUpload 
                sx={{ 
                  fontSize: { xs: 40, sm: 32 },
                  color: getFileIconColor(),
                  mb: { xs: 1.5, sm: 1 }
                }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '1rem', sm: '0.875rem' },
                  textAlign: 'center',
                  mb: 0.5
                }}
              >
                {isDragActive ? 'วางไฟล์ที่นี่' : 'แตะเพื่อเลือกไฟล์'}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.75rem' },
                  textAlign: 'center'
                }}
              >
                รองรับ JPG, PNG, PDF (สูงสุด {Math.round(maxFileSize / (1024 * 1024))}MB)
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Fade in>
          <Alert severity="error" sx={{ mt: 1 }} variant="outlined">
            {error}
          </Alert>
        </Fade>
      )}
    </Box>
  );
} 