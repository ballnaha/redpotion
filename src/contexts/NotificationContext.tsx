'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
  autoHideDuration?: number;
}

interface NotificationContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

// Custom colors to match website theme
const notificationColors = {
  success: {
    backgroundColor: '#10b981', // Primary green from theme
    color: '#ffffff',
    iconColor: '#ffffff',
  },
  error: {
    backgroundColor: '#ef4444', // Red that complements the green theme
    color: '#ffffff',
    iconColor: '#ffffff',
  },
  warning: {
    backgroundColor: '#f59e0b', // Orange accent from theme
    color: '#ffffff',
    iconColor: '#ffffff',
  },
  info: {
    backgroundColor: '#6366f1', // Secondary purple from theme
    color: '#ffffff',
    iconColor: '#ffffff',
  },
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 6000
  });

  const showNotification = useCallback((
    message: string, 
    severity: AlertColor, 
    duration: number = 6000
  ) => {
    setNotification({
      open: true,
      message,
      severity,
      autoHideDuration: duration
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  const contextValue: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  };

  // Get custom colors based on severity
  const getCustomColors = (severity: AlertColor) => {
    return notificationColors[severity];
  };

  const customColors = getCustomColors(notification.severity);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Global Notification Component */}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          mt: 8, // เพื่อไม่ให้ทับกับ AppBar
          zIndex: 9999, // ให้แสดงบนสุด
        }}
      >
        <Alert
          onClose={hideNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            minWidth: 300,
            maxWidth: 500,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            fontWeight: 500,
            fontSize: '0.95rem',
            borderRadius: '12px',
            // Custom colors to match website theme
            backgroundColor: `${customColors.backgroundColor} !important`,
            color: `${customColors.color} !important`,
            '& .MuiAlert-icon': {
              fontSize: '1.2rem',
              color: `${customColors.iconColor} !important`,
            },
            '& .MuiAlert-action': {
              paddingTop: 0,
              '& .MuiIconButton-root': {
                color: `${customColors.iconColor} !important`,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              },
            },
            // Glass morphism effect
            border: '1px solid rgba(255, 255, 255, 0.25)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              borderRadius: '12px',
              pointerEvents: 'none',
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

// Hook สำหรับใช้งาน
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
} 