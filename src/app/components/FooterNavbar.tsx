'use client';

import { useState } from 'react';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, Restaurant, Favorite, Receipt, Person } from '@mui/icons-material';

interface FooterNavbarProps {
  initialValue?: number;
}

export default function FooterNavbar({ initialValue = 0 }: FooterNavbarProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <BottomNavigation
      value={value}
      onChange={(event, newValue) => setValue(newValue)}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.1)',
        '& .MuiBottomNavigationAction-root': {
          color: 'rgba(0, 0, 0, 0.6)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            color: '#10B981',
            transform: 'translateY(-2px)'
          },
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        }
      }}
    >
      <BottomNavigationAction 
        label="Home" 
        icon={<Home />}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 600
          }
        }}
      />
      <BottomNavigationAction 
        label="สั่งอาหาร" 
        icon={<Restaurant />}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 600
          }
        }}
      />
      <BottomNavigationAction 
        label="ถูกใจ" 
        icon={<Favorite />}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 600
          }
        }}
      />
      <BottomNavigationAction 
        label="ประวัติ" 
        icon={<Receipt />}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 600
          }
        }}
      />
      <BottomNavigationAction 
        label="โปรไฟล์" 
        icon={<Person />}
        sx={{
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 600
          }
        }}
      />
    </BottomNavigation>
  );
} 