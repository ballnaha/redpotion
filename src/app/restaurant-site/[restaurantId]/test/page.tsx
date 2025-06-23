'use client';

import { use } from 'react';
import { Typography, Box } from '@mui/material';

export default function TestPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  // Unwrap the params Promise using React.use()
  const { restaurantId } = use(params);

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        🎯 Routing Test Success!
      </Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Restaurant ID: <strong>{restaurantId}</strong>
      </Typography>
      <Typography variant="body1">
        หากคุณเห็นข้อความนี้ แสดงว่า subdomain routing ทำงานถูกต้องแล้ว!
      </Typography>
    </Box>
  );
} 