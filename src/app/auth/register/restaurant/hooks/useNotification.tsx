'use client';

import { useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export interface NotificationMethods {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  hideNotification: () => void;
  NotificationComponent: React.FC;
}

export function useNotification(): NotificationMethods {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotification = useCallback((message: string, severity: AlertColor) => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification(message, 'error');
  }, [showNotification]);

  const showWarning = useCallback((message: string) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  const showInfo = useCallback((message: string) => {
    showNotification(message, 'info');
  }, [showNotification]);

  const NotificationComponent = useCallback(() => (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={hideNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={hideNotification}
        severity={notification.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  ), [notification, hideNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    NotificationComponent
  };
} 