'use client';

import { Box, Typography, CircularProgress } from '@mui/material';

interface GlobalLoadingProps {
  message?: string;
  subMessage?: string;
}

export default function GlobalLoading({ 
  message = 'กำลังโหลด...', 
  subMessage = 'โปรดรอสักครู่' 
}: GlobalLoadingProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#ffffff',
      gap: 3
    }}>

      {/* Loading Spinner */}
      <CircularProgress 
        size={32}
        thickness={3}
        sx={{ 
          color: '#10B981',
          mb: 2
        }}
      />

      {/* Text */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ 
          color: 'rgba(0, 0, 0, 0.8)', 
          fontWeight: 500, 
          fontSize: '1rem',
          mb: 0.5
        }}>
          {message}
        </Typography>
        
        <Typography sx={{ 
          color: 'rgba(0, 0, 0, 0.5)', 
          fontWeight: 400, 
          fontSize: '0.9rem'
        }}>
          {subMessage}
        </Typography>
      </Box>
    </Box>
  );
} 