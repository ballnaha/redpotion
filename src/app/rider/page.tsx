'use client';

import { Box, Typography, Card, CardContent, Paper, Button } from '@mui/material';
import { DeliveryDining, TrendingUp, AccessTime, AttachMoney, LocationOn } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function RiderPage() {
  const theme = useTheme();

  const stats = [
    { 
      title: 'Today Deliveries', 
      value: '8', 
      icon: <DeliveryDining />, 
      color: theme.palette.primary.main,
      change: '+3 from yesterday'
    },
    { 
      title: 'Earnings', 
      value: '฿1,280', 
      icon: <AttachMoney />, 
      color: 'rgba(52, 199, 89, 0.85)',
      change: '+฿320 today'
    },
    { 
      title: 'Average Time', 
      value: '23 min', 
      icon: <AccessTime />, 
      color: 'rgba(255, 149, 0, 0.85)',
      change: '-2 min improved'
    },
    { 
      title: 'Rating', 
      value: '4.9', 
      icon: <TrendingUp />, 
      color: 'rgba(175, 82, 222, 0.85)',
      change: '98% satisfaction'
    },
  ];

  const activeOrders = [
    { 
      id: '#1001', 
      restaurant: 'Thai Garden', 
      customer: 'John Smith',
      address: '123 Main St',
      status: 'Picked up',
      time: '5 mins ago',
      amount: '฿350'
    },
    { 
      id: '#1002', 
      restaurant: 'Pizza Corner', 
      customer: 'Sarah Wilson',
      address: '456 Oak Ave',
      status: 'Ready for pickup',
      time: '2 mins ago',
      amount: '฿520'
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Rider Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary }}>
        Welcome back! You have 2 active deliveries
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {stats.map((stat, index) => (
          <Box key={index} sx={{ flex: '1 1 160px', minWidth: 160 }}>
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
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: stat.color,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                >
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Active Orders */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Active Deliveries
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeOrders.map((order) => (
            <Box 
              key={order.id}
              sx={{ 
                p: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {order.id}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    {order.restaurant} → {order.customer}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {order.address}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                    {order.amount}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: order.status === 'Picked up' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                      color: order.status === 'Picked up' ? 'rgba(52, 199, 89, 1)' : 'rgba(255, 149, 0, 1)',
                      fontWeight: 600,
                    }}
                  >
                    {order.status}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {order.status === 'Ready for pickup' && (
                  <Button 
                    variant="contained" 
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    }}
                  >
                    Accept Order
                  </Button>
                )}
                {order.status === 'Picked up' && (
                  <Button 
                    variant="contained" 
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(52, 199, 89, 0.85)',
                      '&:hover': {
                        backgroundColor: 'rgba(52, 199, 89, 1)',
                      },
                    }}
                  >
                    Mark as Delivered
                  </Button>
                )}
                <Button 
                  variant="outlined" 
                  size="small"
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  }}
                >
                  View Map
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Quick Actions */}
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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[
            { title: 'Go Online', desc: 'Start receiving orders' },
            { title: 'View Earnings', desc: 'Check daily income' },
            { title: 'Update Location', desc: 'Current position' },
            { title: 'Support', desc: 'Get help' },
          ].map((action, index) => (
            <Box 
              key={index}
              sx={{ 
                flex: '1 1 200px',
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.18)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
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
  );
} 