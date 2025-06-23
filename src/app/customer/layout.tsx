'use client';

import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, Search, ShoppingBag, Person, Favorite } from '@mui/icons-material';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bottomValue, setBottomValue] = useState(0);
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        position: 'relative',
        paddingBottom: '56px', // Space for bottom navigation
      }}
    >
      <Box sx={{ width: '100%', minHeight: 'calc(100vh - 56px)' }}>
        {children}
      </Box>

      {/* Bottom Navigation */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
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
            label="Home"
            icon={<Home />}
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
            label="Search"
            icon={<Search />}
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
            icon={<ShoppingBag />}
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
            label="Wishlist"
            icon={<Favorite />}
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