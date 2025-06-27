'use client';

import { Box, Typography, Card } from '@mui/material';

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
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)',
          filter: 'blur(40px)',
          animation: 'liquidFloat 6s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(129, 140, 248, 0.05) 100%)',
          filter: 'blur(60px)',
          animation: 'liquidFloat 8s ease-in-out infinite reverse'
        }}
      />

      {/* Loading Card */}
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
          p: 5,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInUp 0.6s ease-out both',
          minWidth: 300
        }}
      >
        {/* Shimmer effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            animation: 'shimmer 2s infinite'
          }}
        />

        {/* Logo Animation */}
        <Box sx={{ 
          position: 'relative',
          mb: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              animation: 'liquidFloat 3s ease-in-out infinite',
              position: 'relative'
            }}
          >
            <img 
              src="/images/logo_trim.png" 
              alt="เดอะ เรด โพชั่น" 
              style={{ 
                width: '50px', 
                height: 'auto',
                filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3))',
                
              }} 
            />
            
            {/* Loading Ring */}
            <Box sx={{
              position: 'absolute',
              top: -10,
              left: -10,
              width: 120,
              height: 120,
              border: '3px solid transparent',
              borderTop: '3px solid #10B981',
              borderRight: '3px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '50%',
              animation: 'spin 2s linear infinite'
            }} />
          </Box>
        </Box>

        {/* Text */}
        <Typography sx={{ 
          color: 'rgba(0, 0, 0, 0.9)', 
          fontWeight: 600, 
          fontSize: '1.2rem',
          mb: 1,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          {message}
        </Typography>
        
        <Typography sx={{ 
          color: 'rgba(0, 0, 0, 0.6)', 
          fontWeight: 400, 
          fontSize: '1rem',
          mb: 3
        }}>
          {subMessage}
        </Typography>

        {/* Elegant Loading Dots */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5, 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                animation: `elegantPulse 1.8s ease-in-out infinite`,
                animationDelay: `${index * 0.3}s`
              }}
            />
          ))}
        </Box>
      </Card>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes liquidFloat {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          25% { 
            transform: translateY(-10px) rotate(1deg); 
          }
          50% { 
            transform: translateY(-5px) rotate(-1deg); 
          }
          75% { 
            transform: translateY(-15px) rotate(0.5deg); 
          }
        }
        
        @keyframes logoSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes elegantPulse {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes fadeInUp {
          0% { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Box>
  );
} 