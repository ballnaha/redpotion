'use client';

import { Box, Typography } from '@mui/material';

interface GlobalLoadingProps {
  message?: string;
  subMessage?: string;
}

export default function GlobalLoading({ 
  message = 'กำลังเตรียมระบบ...', 
  subMessage = 'โปรดรอสักครู่' 
}: GlobalLoadingProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, rgba(251, 113, 133, 0.05) 0%, rgba(253, 164, 175, 0.05) 100%)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Logo Animation */}
      <Box sx={{ 
        position: 'relative',
        mb: 4,
        animation: 'float 3s ease-in-out infinite'
      }}>
        <img 
          src="/images/logo_trim.png" 
          alt="เดอะ เรด โพชั่น" 
          style={{ 
            width: '80px', 
            height: 'auto',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
          }} 
        />
        
        {/* Loading Ring */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 100,
          height: 100,
          border: '2px solid rgba(248, 113, 113, 0.1)',
          borderTop: '2px solid #F87171',
          borderRadius: '50%',
          animation: 'spin 1.5s linear infinite'
        }} />
      </Box>

      {/* Text */}
      <Typography sx={{ 
        color: '#0F172A', 
        fontWeight: 500, 
        fontSize: '1rem',
        mb: 1,
        animation: 'fadeInOut 2s ease-in-out infinite'
      }}>
        {message}
      </Typography>
      
      <Typography sx={{ 
        color: '#6B7280', 
        fontWeight: 400, 
        fontSize: '0.875rem'
      }}>
        {subMessage}
      </Typography>

      {/* Minimal Loading Dots */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        mt: 3 
      }}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#F87171',
              animation: `pulse 1.5s ease-in-out infinite`,
              animationDelay: `${index * 0.3}s`
            }}
          />
        ))}
      </Box>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.4;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </Box>
  );
} 