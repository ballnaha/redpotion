'use client';

import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Dashboard, DeliveryDining, Map, Person, History } from '@mui/icons-material';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bottomValue, setBottomValue] = useState(0);
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          linear-gradient(135deg, 
            rgba(74, 144, 226, 0.1) 0%, 
            rgba(102, 126, 234, 0.1) 100%
          )
        `,
        position: 'relative',
        width: '100%',
        paddingBottom: '56px', // Space for bottom navigation
      }}
    >
      {/* Background overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          zIndex: 0,
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Box sx={{ width: '100%', minHeight: 'calc(100vh - 56px)' }}>
          {children}
        </Box>
      </Box>

      {/* Bottom Navigation */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.18)',
        }} 
        elevation={0}
      >
        <BottomNavigation
          value={bottomValue}
          onChange={(event, newValue) => {
            setBottomValue(newValue);
          }}
          sx={{
            background: 'transparent',
            height: 56,
          }}
        >
          <BottomNavigationAction
            label="Dashboard"
            icon={<Dashboard />}
            sx={{
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              minWidth: 'auto',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 500,
              },
            }}
          />
          <BottomNavigationAction
            label="Orders"
            icon={<DeliveryDining />}
            sx={{
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              minWidth: 'auto',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 500,
              },
            }}
          />
          <BottomNavigationAction
            label="Map"
            icon={<Map />}
            sx={{
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              minWidth: 'auto',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 500,
              },
            }}
          />
          <BottomNavigationAction
            label="History"
            icon={<History />}
            sx={{
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              minWidth: 'auto',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 500,
              },
            }}
          />
          <BottomNavigationAction
            label="Profile"
            icon={<Person />}
            sx={{
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              minWidth: 'auto',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 500,
              },
            }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
} 