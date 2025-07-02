'use client';

import { useState, useEffect } from 'react';
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
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import { 
  Dashboard, 
  MenuBook, 
  DeliveryDining, 
  Analytics, 
  Settings, 
  Notifications,
  PhotoLibrary,
  Menu as MenuIcon,
  Close as CloseIcon,
  AccountCircle,
  Logout,
  Person,
  PhoneAndroid
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

const drawerWidth = 280;

// Hook to check restaurant status
function useRestaurantStatus() {
  const { data: session, status: sessionStatus } = useSession();
  const [restaurantStatus, setRestaurantStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState(true);

  useEffect(() => {
    const fetchRestaurantStatus = async () => {
      // รอให้ session โหลดเสร็จก่อน
      if (sessionStatus === 'loading') {
        return;
      }

      // ถ้าไม่มี session หรือไม่ใช่ restaurant owner
      if (!session?.user?.id || session.user.role !== 'RESTAURANT_OWNER') {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/restaurant/my-restaurant');
        if (response.ok) {
          const restaurant = await response.json();
          setRestaurantStatus(restaurant.status);
          setHasRestaurant(true);
        } else if (response.status === 404) {
          // ไม่มีร้านอาหาร - แสดง simplified layout
          console.log('📝 No restaurant found for this owner');
          setRestaurantStatus('NO_RESTAURANT');
          setHasRestaurant(false);
        } else {
          // Error อื่นๆ - ให้แสดง simplified layout เพื่อความปลอดภัย
          console.error('Error fetching restaurant status:', response.status);
          setRestaurantStatus('ERROR');
          setHasRestaurant(false);
        }
      } catch (error) {
        console.error('Error fetching restaurant status:', error);
        setRestaurantStatus('ERROR');
        setHasRestaurant(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantStatus();
  }, [session, sessionStatus]);

  return { restaurantStatus, loading, hasRestaurant };
}

// Simplified Layout for non-active restaurants
function SimplifiedLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Simple Header */}
      <AppBar
        position="static"
        sx={{
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           <Image src="/images/logo_trim.png" alt="TheRedPotion" width={100} height={60} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Restaurant Portal
            </Typography>
          </Box>
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            {session?.user && (
              <>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: 'primary.main'
                  }}
                >
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {session.user.name || session.user.email}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Logout />}
                  onClick={handleLogout}
                  size="small"
                  sx={{
                    color: 'error.main',
                    borderColor: 'error.main',
                    '&:hover': {
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      borderColor: 'error.dark',
                    }
                  }}
                >
                  ออกจากระบบ
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          maxWidth: '800px',
          mx: 'auto',
          width: '100%'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// Mobile User Section Component
function MobileUserSection() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <Box>

      
      <Button
        variant="outlined"
        fullWidth
        startIcon={<Logout />}
        onClick={handleLogout}
        sx={{
          color: 'error.main',
          borderColor: 'error.main',
          '&:hover': {
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            borderColor: 'error.dark',
          }
        }}
      >
        ออกจากระบบ
      </Button>
    </Box>
  );
}

// Desktop User Section Component
function DesktopUserSection() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return null;
}

// User Menu Component
function UserMenu() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };


  const handleClose = () => {
    setAnchorEl(null);
  };

  const gotoSettings = () => {
    router.push('/restaurant/settings');
    handleClose();
  }

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleClose();
  };

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ 
          ml: 2,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
          }
        }}
      >
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32,
            bgcolor: 'primary.main',
            fontSize: '0.875rem'
          }}
        >
          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
        </Avatar>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 1,
            mt: 1.5,
            minWidth: 200,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderBottom: 'none',
              borderRight: 'none',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {session.user.name || 'ผู้ใช้'}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            {session.user.email}
          </Typography>
        </Box>
        
        <MenuItem onClick={gotoSettings} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="ตั้งค่า" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleLogout} 
          sx={{ 
            py: 1.5,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.1)'
            }
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText primary="ออกจากระบบ" />
        </MenuItem>
      </Menu>
    </>
  );
}

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { restaurantStatus, loading, hasRestaurant } = useRestaurantStatus();
  
  // Move hooks to the top before any conditional returns
  const pathname = usePathname();
  const router = useRouter();

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  // Show loading while checking restaurant status
  if (loading) {
    return (
      <SessionProvider>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: `
            linear-gradient(135deg, 
              rgba(74, 144, 226, 0.1) 0%, 
              rgba(102, 126, 234, 0.1) 100%
            )
          `,
          gap: 2
        }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
          </Typography>
        </Box>
      </SessionProvider>
    );
  }

  // Use simplified layout if restaurant status is not ACTIVE or if no restaurant exists
  if (!hasRestaurant || (restaurantStatus && restaurantStatus !== 'ACTIVE')) {
    return (
      <SessionProvider>
        <SimplifiedLayout>
          {children}
        </SimplifiedLayout>
      </SessionProvider>
    );
  }

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <Dashboard />, 
      href: '/restaurant',
      active: pathname === '/restaurant' 
    },
    { 
      text: 'Menu Management', 
      icon: <MenuBook />, 
      href: '/restaurant/menu',
      active: pathname.startsWith('/restaurant/menu')
    },
    { 
      text: 'Gallery', 
      icon: <PhotoLibrary />, 
      href: '/restaurant/gallery',
      active: pathname.startsWith('/restaurant/gallery')
    },
    { 
      text: 'LINE LIFF Setup', 
      icon: <PhoneAndroid />, 
      href: '/restaurant/liff-setup',
      active: pathname.startsWith('/restaurant/liff-setup')
    },
    { 
      text: 'Orders', 
      icon: <DeliveryDining />, 
      href: '/restaurant/orders',
      active: pathname.startsWith('/restaurant/orders')
    },
    { 
      text: 'Analytics', 
      icon: <Analytics />, 
      href: '/restaurant/analytics',
      active: pathname.startsWith('/restaurant/analytics')
    },
    { 
      text: 'Notifications', 
      icon: <Notifications />, 
      href: '/restaurant/notifications',
      active: pathname.startsWith('/restaurant/notifications')
    },
    { 
      text: 'Settings', 
      icon: <Settings />, 
      href: '/restaurant/settings',
      active: pathname.startsWith('/restaurant/settings')
    },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        p: isMobile ? 2 : 3, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Image src="/images/logo_trim.png" alt="TheRedPotion" width={100} height={60} />
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
      
      <List sx={{ pt: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            onClick={() => {
              router.push(item.href);
              if (isMobile) setMobileOpen(false);
            }}
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
      
      {/* User Section */}
      <Box sx={{ 
        mt: 'auto', 
        p: 2, 
        borderTop: '1px solid rgba(255, 255, 255, 0.18)' 
      }}>
        {isMobile ? <MobileUserSection /> : <DesktopUserSection />}
      </Box>
    </Box>
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
              md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
            },
            ml: { 
              xs: 0, 
              md: desktopOpen ? `${drawerWidth}px` : 0
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
            {/* Enhanced Hamburger Menu for Mobile and Desktop */}
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: (isMobile ? mobileOpen : !desktopOpen) ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                border: (isMobile ? mobileOpen : !desktopOpen) ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                }
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* Animated Hamburger Lines */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: 20,
                    height: 2,
                    backgroundColor: 'currentColor',
                    borderRadius: 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: (isMobile ? mobileOpen : !desktopOpen)
                      ? 'rotate(45deg) translateY(0px)' 
                      : 'rotate(0deg) translateY(-6px)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: 20,
                    height: 2,
                    backgroundColor: 'currentColor',
                    borderRadius: 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: (isMobile ? mobileOpen : !desktopOpen) ? 0 : 1,
                    transform: (isMobile ? mobileOpen : !desktopOpen) ? 'scale(0)' : 'scale(1)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: 20,
                    height: 2,
                    backgroundColor: 'currentColor',
                    borderRadius: 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: (isMobile ? mobileOpen : !desktopOpen)
                      ? 'rotate(-45deg) translateY(0px)' 
                      : 'rotate(0deg) translateY(6px)',
                  }}
                />
              </Box>
            </IconButton>
            
            {/* Legacy Mobile Menu (for backward compatibility) */}
            {false && isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  mr: 2,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: mobileOpen ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                  border: mobileOpen ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    transform: 'scale(1.05)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {/* Animated Hamburger Lines */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 20,
                      height: 2,
                      backgroundColor: 'currentColor',
                      borderRadius: 1,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: mobileOpen 
                        ? 'rotate(45deg) translateY(0px)' 
                        : 'rotate(0deg) translateY(-6px)',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 20,
                      height: 2,
                      backgroundColor: 'currentColor',
                      borderRadius: 1,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: mobileOpen ? 0 : 1,
                      transform: mobileOpen ? 'scale(0)' : 'scale(1)',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 20,
                      height: 2,
                      backgroundColor: 'currentColor',
                      borderRadius: 1,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: mobileOpen 
                        ? 'rotate(-45deg) translateY(0px)' 
                        : 'rotate(0deg) translateY(6px)',
                    }}
                  />
                </Box>
              </IconButton>
            )}
            
            {/* Title with Logo for Mobile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              {isMobile && (
                <Image 
                  src="/images/logo_trim.png" 
                  alt="TheRedPotion" 
                  width={60} 
                  height={36}
                  style={{ objectFit: 'contain' }}
                />
              )}
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                fontSize: isMobile ? '1rem' : '1.25rem',
                color: theme.palette.primary.main
              }}>
                {isMobile ? 'Restaurant' : 'Restaurant Dashboard'}
              </Typography>
            </Box>
            
            {/* User Menu */}
            <UserMenu />
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
              transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="persistent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: desktopOpen ? drawerWidth : 0,
            flexShrink: 0,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: 'none',
              borderRight: '1px solid rgba(255, 255, 255, 0.18)',
              transform: desktopOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          }}
          open={desktopOpen}
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
              md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
            },
            ml: {
              xs: 0,
              md: desktopOpen ? 0 : 0
            },
            minHeight: 'calc(100vh - 64px)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {children}
        </Box>
      </Box>
    </SessionProvider>
  );
} 