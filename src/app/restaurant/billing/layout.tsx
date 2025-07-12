'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  useTheme,
  useMediaQuery
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
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`billing-tabpanel-${index}`}
      aria-labelledby={`billing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
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

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    
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
          <TabPanel value={value} index={0}>
            {pathname.includes('/subscriptions') && children}
          </TabPanel>
          <TabPanel value={value} index={1}>
            {pathname.includes('/payment-history') && children}
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
} 