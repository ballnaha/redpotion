'use client';

import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Badge,
  Avatar,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  ShoppingCart, 
  LocationOn,
  Notifications,
  Search,
  ShoppingBag
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export function CustomerNavigation() {
  const theme = useTheme();

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        width: '100%',
        px: 2,
        py: 1,
      }}>
        {/* Left: Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40,
              border: '2px solid rgba(255,255,255,0.3)',
              backgroundColor: theme.palette.primary.main,
            }}
            src="/api/placeholder/40/40"
          >
            U
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.75rem' }}>
              Deliver to
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Times Square
              </Typography>
              <LocationOn sx={{ 
                fontSize: 16, 
                color: theme.palette.primary.main,
                opacity: 0.8 
              }} />
            </Box>
          </Box>
        </Box>

        {/* Right: Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            sx={{ 
              color: theme.palette.text.primary,
              p: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <Badge badgeContent={2} color="error">
              <Notifications sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>
          
          <IconButton 
            sx={{ 
              color: theme.palette.text.primary,
              p: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <Badge badgeContent={3} color="error">
              <ShoppingBag sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>

      {/* Search Bar */}
      <Box sx={{ 
        px: 2, 
        pb: 2,
      }}>
        <TextField
          fullWidth
          placeholder="What are you craving?"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              '& fieldset': {
                border: '1px solid rgba(255, 255, 255, 0.18)',
              },
              '&:hover fieldset': {
                border: `1px solid ${theme.palette.primary.light}`,
              },
              '&.Mui-focused fieldset': {
                border: `2px solid ${theme.palette.primary.main}`,
              },
            },
          }}
        />
      </Box>
    </AppBar>
  );
} 