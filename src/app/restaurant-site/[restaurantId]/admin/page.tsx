'use client';

import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel
} from '@mui/material';
import { 
  Edit,
  Delete,
  Add,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRestaurant } from '../context/RestaurantContext';
import { useState } from 'react';

export default function RestaurantAdminPage() {
  const theme = useTheme();
  const { restaurant, loading, updateMenuItem } = useRestaurant();
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    item?: any;
  }>({ open: false });

  const handleToggleAvailability = (itemId: string, available: boolean) => {
    updateMenuItem(itemId, { available });
  };

  const handleEditItem = (item: any) => {
    setEditDialog({ open: true, item });
  };

  const handleSaveItem = () => {
    // บันทึกการแก้ไข
    setEditDialog({ open: false });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography>กำลังโหลด...</Typography>
      </Container>
    );
  }

  if (!restaurant) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography color="error">ไม่พบข้อมูลร้านอาหาร</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          จัดการร้าน {restaurant.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          แก้ไขเมนู ราคา และสถานะความพร้อมของอาหาร
        </Typography>
      </Box>

      {/* Restaurant Info */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ข้อมูลร้าน
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                ชื่อร้าน
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {restaurant.name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                โทรศัพท์
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {restaurant.contact.phone}
              </Typography>
            </Box>
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <Typography variant="body2" color="text.secondary">
                คำอธิบาย
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {restaurant.description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Menu Management */}
      {restaurant.menu.map(category => (
        <Card key={category.id} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {category.name}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{ backgroundColor: restaurant.theme.primaryColor }}
              >
                เพิ่มเมนูใหม่
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>เมนู</TableCell>
                    <TableCell>ราคา</TableCell>
                    <TableCell>เวลาทำ</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>แนะนำ</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {category.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            component="img"
                            src={item.image}
                            alt={item.name}
                            sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }}
                          />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                            {item.tags && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                {item.tags.map(tag => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: restaurant.theme.primaryColor }}>
                          ฿{item.price}
                        </Typography>
                        {item.originalPrice && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              textDecoration: 'line-through',
                              color: 'text.secondary',
                              display: 'block'
                            }}
                          >
                            ฿{item.originalPrice}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.cookingTime} นาที
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={item.available}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleToggleAvailability(item.id, e.target.checked)}
                              color="primary"
                            />
                          }
                          label={item.available ? 'พร้อมขาย' : 'ไม่พร้อม'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.isRecommended ? 'แนะนำ' : 'ทั่วไป'}
                          size="small"
                          color={item.isRecommended ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditItem(item)}
                            sx={{ color: restaurant.theme.primaryColor }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ color: 'error.main' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ color: 'text.secondary' }}
                          >
                            {item.available ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>แก้ไขเมนู</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <TextField
                fullWidth
                label="ชื่อเมนู"
                defaultValue={editDialog.item?.name}
              />
            </Box>
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <TextField
                fullWidth
                label="คำอธิบาย"
                multiline
                rows={3}
                defaultValue={editDialog.item?.description}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="ราคา"
                type="number"
                defaultValue={editDialog.item?.price}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="เวลาทำ (นาที)"
                type="number"
                defaultValue={editDialog.item?.cookingTime}
              />
            </Box>
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <TextField
                fullWidth
                label="URL รูปภาพ"
                defaultValue={editDialog.item?.image}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false })}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSaveItem}
            variant="contained"
            sx={{ backgroundColor: restaurant?.theme.primaryColor }}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 