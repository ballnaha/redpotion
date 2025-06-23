'use client';

import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, People, Restaurant, DeliveryDining, Analytics, Settings } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 280;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, active: true },
    { text: 'Users', icon: <People />, active: false },
    { text: 'Restaurants', icon: <Restaurant />, active: false },
    { text: 'Deliveries', icon: <DeliveryDining />, active: false },
    { text: 'Analytics', icon: <Analytics />, active: false },
    { text: 'Settings', icon: <Settings />, active: false },
  ];

  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        background: `
          linear-gradient(135deg, 
            rgba(74, 144, 226, 0.1) 0%, 
            rgba(102, 126, 234, 0.1) 100%
          )
        `,
      }}
    >
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: 'none',
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: 'none',
            borderRight: '1px solid rgba(255, 255, 255, 0.18)',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.18)' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 900,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            RedPotion
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Admin Panel
          </Typography>
        </Box>
        
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              sx={{
                mx: 2,
                mb: 1,
                borderRadius: 2,
                cursor: 'pointer',
                backgroundColor: item.active ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                backdropFilter: item.active ? 'blur(10px)' : 'none',
                WebkitBackdropFilter: item.active ? 'blur(10px)' : 'none',
                border: item.active ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: item.active ? theme.palette.primary.main : theme.palette.text.secondary,
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: item.active ? 600 : 400,
                    color: item.active ? theme.palette.primary.main : theme.palette.text.primary,
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Account for AppBar height
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
} 