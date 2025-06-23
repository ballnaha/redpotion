'use client';

import { Box, Typography, Card, CardContent, Paper } from '@mui/material';
import { TrendingUp, Restaurant, DeliveryDining, AttachMoney } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function RestaurantPage() {
  const theme = useTheme();

  const stats = [
    { 
      title: 'Today Orders', 
      value: '48', 
      icon: <DeliveryDining />, 
      color: theme.palette.primary.main,
      change: '+12%'
    },
    { 
      title: 'Revenue', 
      value: '฿4,250', 
      icon: <AttachMoney />, 
      color: 'rgba(52, 199, 89, 0.85)',
      change: '+8%'
    },
    { 
      title: 'Menu Items', 
      value: '127', 
      icon: <Restaurant />, 
      color: 'rgba(255, 149, 0, 0.85)',
      change: '+3 new'
    },
    { 
      title: 'Growth', 
      value: '23%', 
      icon: <TrendingUp />, 
      color: 'rgba(175, 82, 222, 0.85)',
      change: 'this month'
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Restaurant Dashboard
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

      {/* Recent Activity */}
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
              Recent Orders
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((order) => (
                <Box 
                  key={order}
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
                      Order #{1000 + order}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Customer #{order} • 2 items
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    ฿{(150 + order * 50)}
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
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { title: 'Add New Menu Item', desc: 'Create new dish' },
                { title: 'View Analytics', desc: 'Sales reports' },
                { title: 'Manage Orders', desc: 'Active orders' },
                { title: 'Settings', desc: 'Restaurant config' },
              ].map((action, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    p: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {action.desc}
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