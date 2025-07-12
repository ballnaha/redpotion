'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to subscriptions page
    router.replace('/restaurant/billing/subscriptions');
  }, [router]);

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh',
      flexDirection: 'column',
      gap: 2
    }}>
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary">
        กำลังเปลี่ยนหน้า...
      </Typography>
    </Box>
  );
} 