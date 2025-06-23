'use client';

import { Box, Typography, Card, CardContent, Paper } from '@mui/material';
import { People, Restaurant, DeliveryDining, Analytics } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function AdminPage() {
  const theme = useTheme();

  const stats = [
    { 
      title: 'Total Users', 
      value: '2,847', 
      icon: <People />, 
      color: theme.palette.primary.main,
      change: '+156 this month'
    },
    { 
      title: 'Restaurants', 
      value: '89', 
      icon: <Restaurant />, 
      color: 'rgba(52, 199, 89, 0.85)',
      change: '+12 active'
    },
    { 
      title: 'Deliveries', 
      value: '1,284', 
      icon: <DeliveryDining />, 
      color: 'rgba(255, 149, 0, 0.85)',
      change: '+28% today'
    },
    { 
      title: 'Revenue', 
      value: '฿485,230', 
      icon: <Analytics />, 
      color: 'rgba(175, 82, 222, 0.85)',
      change: '+18% this week'
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {stats.map((stat, index) => (
          <Box key={index} sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <Card
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      backgroundColor: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  {stat.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: stat.color,
                    fontWeight: 600,
                  }}
                >
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Management Sections */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '2 1 500px', minWidth: 500 }}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Recent Activities
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { action: 'New restaurant registered', name: 'Thai Garden', time: '2 mins ago' },
                { action: 'User verification completed', name: 'Customer #2847', time: '5 mins ago' },
                { action: 'Delivery completed', name: 'Order #1001', time: '12 mins ago' },
                { action: 'Payment processed', name: '฿1,250', time: '18 mins ago' },
                { action: 'Menu updated', name: 'Pizza Corner', time: '25 mins ago' },
              ].map((activity, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                  }}
                >
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {activity.action}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {activity.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {activity.time}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              System Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Server Status', status: 'Online', color: 'rgba(52, 199, 89, 0.85)' },
                { label: 'Database', status: 'Healthy', color: 'rgba(52, 199, 89, 0.85)' },
                { label: 'Payment Gateway', status: 'Active', color: 'rgba(52, 199, 89, 0.85)' },
                { label: 'Notifications', status: 'Working', color: 'rgba(52, 199, 89, 0.85)' },
              ].map((item, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: item.color,
                      fontWeight: 600,
                    }}
                  >
                    {item.status}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
} 