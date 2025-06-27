'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Card } from '@mui/material';
import { Refresh, Home, BugReport } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
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
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
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
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
              filter: 'blur(60px)',
              animation: 'liquidFloat 8s ease-in-out infinite reverse'
            }}
          />

          {/* Error Card */}
          <Card
            sx={{
              maxWidth: 500,
              width: '100%',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
              p: 5,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              animation: 'fadeInUp 0.6s ease-out both'
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

            {/* Error Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '2px solid rgba(239, 68, 68, 0.2)',
                animation: 'pulseGlow 2s ease-in-out infinite'
              }}
            >
              <BugReport 
                sx={{ 
                  fontSize: 40, 
                  color: '#ef4444',
                  filter: 'drop-shadow(0 2px 8px rgba(239, 68, 68, 0.3))'
                }} 
              />
            </Box>

            {/* Error Title */}
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: 'rgba(0, 0, 0, 0.9)',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '@media (max-width: 600px)': {
                  fontSize: '1.5rem'
                }
              }}
            >
              เกิดข้อผิดพลาดทางเทคนิค
            </Typography>

            {/* Error Message */}
            <Typography 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.7)',
                mb: 3,
                lineHeight: 1.6,
                fontSize: '1.1rem',
                '@media (max-width: 600px)': {
                  fontSize: '1rem'
                }
              }}
            >
              ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด<br />
              กรุณาลองรีเฟรชหน้าเว็บหรือกลับไปหน้าหลัก
            </Typography>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 2,
                  p: 2,
                  mb: 3,
                  textAlign: 'left'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    color: '#dc2626',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={this.handleReload}
                startIcon={<Refresh />}
                sx={{
                  background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 30px rgba(16, 185, 129, 0.5)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                รีเฟรชหน้า
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleGoHome}
                startIcon={<Home />}
                sx={{
                  color: 'rgba(0, 0, 0, 0.7)',
                  borderColor: 'rgba(0, 0, 0, 0.2)',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.4)',
                    borderColor: 'rgba(0, 0, 0, 0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                กลับหน้าหลัก
              </Button>
            </Box>

            {/* Help Text */}
            <Typography 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.5)',
                fontSize: '0.9rem',
                mt: 4,
                fontStyle: 'italic'
              }}
            >
              หากปัญหายังคงมีอยู่ กรุณาติดต่อฝ่ายสนับสนุน
            </Typography>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 