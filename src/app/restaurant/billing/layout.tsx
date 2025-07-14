'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  CreditCard,
  History,
  AttachMoney
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  isLoading?: boolean;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, isLoading, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`billing-tabpanel-${index}`}
      aria-labelledby={`billing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3, position: 'relative', minHeight: '200px' }}>
          {isLoading ? (
            <Fade in={isLoading}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '300px',
                flexDirection: 'column',
                gap: 2,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(4px)',
                zIndex: 10
              }}>
                <CircularProgress size={48} thickness={4} />
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  กำลังโหลดข้อมูล...
                </Typography>
              </Box>
            </Fade>
          ) : null}
          <Fade in={!isLoading}>
            <Box sx={{ opacity: isLoading ? 0.3 : 1, transition: 'opacity 0.3s ease' }}>
              {children}
            </Box>
          </Fade>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `billing-tab-${index}`,
    'aria-controls': `billing-tabpanel-${index}`,
  };
}

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname.includes('/subscriptions')) return 0;
    if (pathname.includes('/payment-history')) return 1;
    return 0; // default to subscriptions
  };

  const [value, setValue] = useState(getActiveTab());
  const [isLoading, setIsLoading] = useState(false);

  // Update tab when pathname changes
  useEffect(() => {
    const newTab = getActiveTab();
    if (newTab !== value) {
      setValue(newTab);
    }
  }, [pathname, value]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === value) return; // ป้องกันการคลิก tab เดียวกัน
    
    setValue(newValue);
    setIsLoading(true);
    
    // Navigate to appropriate page
    switch (newValue) {
      case 0:
        router.push('/restaurant/billing/subscriptions');
        break;
      case 1:
        router.push('/restaurant/billing/payment-history');
        break;
      default:
        router.push('/restaurant/billing/subscriptions');
    }

    // จำลอง loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AttachMoney sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Billing & Subscriptions
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          จัดการการสมัครสมาชิกและประวัติการชำระเงิน
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Card sx={{ 
        mb: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="billing navigation tabs"
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          >
            <Tab 
              icon={<CreditCard />} 
              label="Subscriptions" 
              {...a11yProps(0)}
              sx={{
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: value === 0 ? 600 : 400,
                color: value === 0 ? theme.palette.primary.main : theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            />
            <Tab 
              icon={<History />} 
              label="Payment History" 
              {...a11yProps(1)}
              sx={{
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: value === 1 ? 600 : 400,
                color: value === 1 ? theme.palette.primary.main : theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <TabPanel value={value} index={0} isLoading={isLoading}>
            {pathname.includes('/subscriptions') && children}
          </TabPanel>
          <TabPanel value={value} index={1} isLoading={isLoading}>
            {pathname.includes('/payment-history') && children}
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
} 