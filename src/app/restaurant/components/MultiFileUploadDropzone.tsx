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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  useTheme,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  AttachFile,
  CheckCircle,
  ErrorOutline,
  InsertDriveFile,
} from '@mui/icons-material';

interface FileWithPreview extends File {
  preview?: string;
  uploadUrl?: string;
  uploading?: boolean;
  error?: string;
}

interface MultiFileUploadDropzoneProps {
  files: FileWithPreview[];
  onFilesChange: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  accept?: string[];
  label?: string;
  description?: string;
  disabled?: boolean;
}

export default function MultiFileUploadDropzone({
  files,
  onFilesChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  accept = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  label = 'อัพโหลดเอกสาร',
  description = 'ลากไฟล์มาวางหรือคลิกเพื่อเลือกไฟล์',
  disabled = false
}: MultiFileUploadDropzoneProps) {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!accept.includes(file.type)) {
      return `รองรับเฉพาะไฟล์ ${accept.map(type => {
        if (type.startsWith('image/')) return 'รูปภาพ';
        if (type === 'application/pdf') return 'PDF';
        if (type.includes('word')) return 'Word';
        return type;
      }).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`;
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
      } else if (rejection.errors?.[0]?.code === 'too-many-files') {
        setError(`สามารถอัพโหลดได้สูงสุด ${maxFiles} ไฟล์`);
      } else {
        setError('ไฟล์ที่เลือกไม่ถูกต้อง');
      }
      return;
    }

    // Check if total files exceed maxFiles
    if (files.length + acceptedFiles.length > maxFiles) {
      setError(`สามารถอัพโหลดได้สูงสุด ${maxFiles} ไฟล์`);
      return;
    }

    // Validate and process accepted files
    const validFiles: FileWithPreview[] = [];
    for (const file of acceptedFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      
      // Create file with preview
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploading: false,
        error: undefined
      });
      
      validFiles.push(fileWithPreview);
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  }, [disabled, files, maxFiles, maxFileSize, accept, onFilesChange]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
    maxFiles: maxFiles - files.length,
    maxSize: maxFileSize,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  // Remove file
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    const removedFile = newFiles[index];
    
    // Revoke preview URL if it exists
    if (removedFile.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
    
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <InsertDriveFile color="primary" />;
    if (file.type === 'application/pdf') return <InsertDriveFile color="error" />;
    if (file.type.includes('word')) return <InsertDriveFile color="info" />;
    return <AttachFile />;
  };

  // Get file type label
  const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) return 'รูปภาพ';
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type.includes('word')) return 'Word';
    return 'เอกสาร';
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: `2px dashed ${
            isDragActive 
              ? theme.palette.primary.main
              : isDragReject 
                ? theme.palette.error.main
                : theme.palette.grey[300]
          }`,
          borderRadius: 2,
          backgroundColor: isDragActive 
            ? `${theme.palette.primary.main}08`
            : isDragReject
              ? `${theme.palette.error.main}08`
              : theme.palette.grey[50],
          transition: 'all 0.3s ease',
          opacity: disabled ? 0.6 : 1,
          '&:hover': disabled ? {} : {
            borderColor: theme.palette.primary.main,
            backgroundColor: `${theme.palette.primary.main}08`,
          }
        }}
      >
        <input {...getInputProps()} />
        
        <CloudUpload 
          sx={{ 
            fontSize: 48, 
            color: isDragActive 
              ? theme.palette.primary.main 
              : theme.palette.grey[400],
            mb: 2 
          }} 
        />
        
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          ขนาดไฟล์สูงสุด {Math.round(maxFileSize / (1024 * 1024))} MB • 
          สามารถอัพโหลดได้สูงสุด {maxFiles} ไฟล์
        </Typography>
        
        {files.length < maxFiles && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AttachFile />}
              disabled={disabled}
            >
              เลือกไฟล์
            </Button>
          </Box>
        )}
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <Fade in timeout={500}>
          <Paper sx={{ mt: 3 }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1">
                ไฟล์ที่เลือก ({files.length}/{maxFiles})
              </Typography>
            </Box>
            
            <List>
              {files.map((file, index) => (
                <ListItem key={index} divider={index < files.length - 1}>
                  <Box sx={{ mr: 2 }}>
                    {getFileIcon(file)}
                  </Box>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap>
                          {file.name}
                        </Typography>
                        <Chip 
                          label={getFileTypeLabel(file)} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                        {file.uploading && (
                          <LinearProgress sx={{ mt: 1 }} />
                        )}
                        {file.error && (
                          <Typography variant="caption" color="error.main">
                            {file.error}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    {file.uploadUrl ? (
                      <CheckCircle color="success" />
                    ) : file.error ? (
                      <ErrorOutline color="error" />
                    ) : (
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveFile(index)}
                        disabled={disabled || file.uploading}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Fade>
      )}
    </Box>
  );
} 