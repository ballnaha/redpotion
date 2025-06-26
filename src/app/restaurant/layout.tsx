'use client';

import { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  useMediaQuery
} from '@mui/material';
import { 
  Dashboard, 
  MenuBook, 
  DeliveryDining, 
  Analytics, 
  Settings, 
  Notifications,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { SessionProvider } from 'next-auth/react';

const drawerWidth = 280;

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, active: true },
    { text: 'Menu Management', icon: <MenuBook />, active: false },
    { text: 'Orders', icon: <DeliveryDining />, active: false },
    { text: 'Analytics', icon: <Analytics />, active: false },
    { text: 'Notifications', icon: <Notifications />, active: false },
    { text: 'Settings', icon: <Settings />, active: false },
  ];

  const drawerContent = (
    <>
      <Box sx={{ 
        p: isMobile ? 2 : 3, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography 
            variant={isMobile ? "h6" : "h5"}
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
            Restaurant Portal
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: theme.palette.text.primary }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            onClick={isMobile ? handleDrawerToggle : undefined}
            sx={{
              mx: 2,
              mb: 1,
              borderRadius: 1,
              cursor: 'pointer',
              backgroundColor: item.active ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
              backdropFilter: item.active ? 'blur(10px)' : 'none',
              WebkitBackdropFilter: item.active ? 'blur(10px)' : 'none',
              border: item.active ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                transform: isMobile ? 'none' : 'translateX(4px)',
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
                  fontSize: isMobile ? '0.9rem' : '1rem',
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <SessionProvider>
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
            width: { 
              xs: '100%', 
              md: `calc(100% - ${drawerWidth}px)` 
            },
            ml: { 
              xs: 0, 
              md: `${drawerWidth}px` 
            },
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: 'none',
            color: theme.palette.text.primary,
            zIndex: theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: isMobile ? '1rem' : '1.25rem' }}>
              Restaurant Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

                 {/* Mobile Drawer */}
         <Drawer
           variant="temporary"
           open={mobileOpen}
           onClose={handleDrawerToggle}
           ModalProps={{
             keepMounted: true, // Better open performance on mobile.
           }}
           sx={{
             display: { xs: 'block', md: 'none' },
             '& .MuiDrawer-paper': {
               boxSizing: 'border-box',
               width: drawerWidth,
               backgroundColor: 'rgba(255, 255, 255, 0.98)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)',
               border: 'none',
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
               zIndex: theme.zIndex.drawer + 1,
             },
           }}
         >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
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
          open
        >
          {drawerContent}
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: { xs: 7, sm: 8 }, // Account for AppBar height
            width: { 
              xs: '100%', 
              md: `calc(100% - ${drawerWidth}px)` 
            },
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Box>
      </Box>
    </SessionProvider>
  );
} 