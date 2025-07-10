'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  Chip,
  IconButton,
  Divider,
  Avatar
} from '@mui/material';
import {
  Restaurant,
  Receipt,
  Fastfood,
  Close,
  CheckCircle
} from '@mui/icons-material';

const mockOrder = {
  id: 'test-order-1',
  orderNumber: 'ORD1752123456789TEST',
  status: 'PREPARING' as const,
  customerName: 'ผู้ทดสอบ',
  customerPhone: '081-234-5678',
  customerEmail: 'test@example.com',
  deliveryAddress: '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10110',
  deliveryNotes: 'หมายเหตุการจัดส่งตัวอย่าง',
  subtotal: 350,
  deliveryFee: 30,
  tax: 0,
  discount: 50,
  promoCode: 'SAVE50',
  total: 330,
  paymentMethod: 'promptpay',
  isPaid: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      quantity: 2,
      price: 120,
      notes: 'หมายเหตุสินค้า',
      menuItem: {
        id: 'menu-1',
        name: 'ข้าวผัดกุ้ง',
        imageUrl: '/images/default_cover.jpg',
        price: 120
      },
      addons: [
        {
          id: 'addon-1',
          quantity: 2,
          price: 15,
          addon: {
            id: 'addon-1',
            name: 'ไข่ดาว',
            price: 15
          }
        }
      ]
    },
    {
      id: 'item-2',
      quantity: 1,
      price: 80,
      notes: '',
      menuItem: {
        id: 'menu-2',
        name: 'ต้มยำกุ้ง',
        imageUrl: '/images/default_cover.jpg',
        price: 80
      },
      addons: []
    }
  ],
  restaurant: {
    id: 'restaurant-1',
    name: 'ร้านทดสอบ Modal',
    imageUrl: '/images/default_restaurant.jpg',
    address: '456 ถนนร้านอาหาร แขวงอาหาร เขตอาหาร กรุงเทพฯ 10111',
    phone: '02-123-4567'
  }
};

const statusConfig = {
  PREPARING: { 
    label: 'กำลังทำ', 
    color: '#9C27B0', 
    bgColor: '#F3E5F5',
    icon: Fastfood
  }
};

const paymentMethodLabels: Record<string, string> = {
  'promptpay': 'PromptPay'
};

export default function DebugOrdersModalPage() {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemTotal = (item: typeof mockOrder.items[0]) => {
    const itemTotal = item.quantity * item.price;
    const addonsTotal = item.addons.reduce((sum, addon) => sum + (addon.quantity * addon.price), 0);
    return itemTotal + addonsTotal;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
        🧪 ทดสอบ Modal Orders
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
        ทดสอบการแสดงผล modal รายละเอียดออเดอร์ในขนาดหน้าจอต่างๆ
      </Typography>

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => setDetailDialogOpen(true)}
          sx={{ px: 4, py: 1.5, borderRadius: 3 }}
        >
          เปิด Modal ทดสอบ
        </Button>
      </Box>

      <Card sx={{ p: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>🎯 ฟีเจอร์ที่ทดสอบ:</Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>📱 Responsive design ในหน้าจอเล็ก-ใหญ่</li>
          <li>📜 Scroll ได้เมื่อเนื้อหายาว</li>
          <li>🎨 Custom scrollbar ที่สวยงาม</li>
          <li>📌 Sticky header และ footer</li>
          <li>❌ Close button ใน header</li>
          <li>🔳 Full-width ปุ่มปิดใน footer</li>
        </Box>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={false}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '95vh',
            minHeight: '60vh',
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)' }
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }
        }}
      >
        <>
          <DialogTitle sx={{ 
            pb: 1, 
            px: { xs: 2, sm: 3 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            backgroundColor: 'background.paper',
            zIndex: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                  รายละเอียดออเดอร์
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  #{mockOrder.orderNumber}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<Fastfood sx={{ fontSize: 16 }} />}
                  label={statusConfig[mockOrder.status].label}
                  sx={{
                    backgroundColor: statusConfig[mockOrder.status].bgColor,
                    color: statusConfig[mockOrder.status].color,
                    fontWeight: 500
                  }}
                />
                <IconButton 
                  onClick={() => setDetailDialogOpen(false)}
                  size="small"
                  sx={{ 
                    ml: 1,
                    backgroundColor: 'grey.100',
                    '&:hover': { backgroundColor: 'grey.200' }
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent 
            sx={{ 
              px: { xs: 2, sm: 3 },
              py: 2,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '3px',
                '&:hover': {
                  background: '#a8a8a8',
                },
              },
            }}
          >
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
              gap: 3, 
              mb: 3 
            }}>
              {/* Restaurant Information */}
              <Box>
                <Card variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Restaurant /> ข้อมูลร้าน
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>ชื่อร้าน:</strong> {mockOrder.restaurant.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>ที่อยู่:</strong> {mockOrder.restaurant.address}
                  </Typography>
                  <Typography variant="body2">
                    <strong>โทร:</strong> {mockOrder.restaurant.phone}
                  </Typography>
                </Card>
              </Box>

              {/* Order Information */}
              <Box>
                <Card variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt /> ข้อมูลออเดอร์
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>เวลาสั่ง:</strong> {formatDateTime(mockOrder.createdAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" component="span">
                      <strong>การชำระเงิน:</strong> {paymentMethodLabels[mockOrder.paymentMethod!]}
                    </Typography>
                    {mockOrder.isPaid && (
                      <Chip label="ชำระแล้ว" size="small" color="success" />
                    )}
                  </Box>
                  <Typography variant="body2">
                    <strong>หมายเหตุ:</strong> {mockOrder.deliveryNotes}
                  </Typography>
                </Card>
              </Box>
            </Box>

            {/* Order Items - ใส่เนื้อหาเยอะๆ เพื่อทดสอบ scroll */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                รายการสินค้า
              </Typography>
              {mockOrder.items.map((item, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar
                      variant="rounded"
                      src={item.menuItem.imageUrl}
                      sx={{ width: 60, height: 60 }}
                    >
                      <Fastfood />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.menuItem.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        จำนวน: {item.quantity} | ราคา: ฿{item.price.toLocaleString()} ต่อชิ้น
                      </Typography>
                      
                      {item.addons.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            รายการเสริม:
                          </Typography>
                          {item.addons.map((addon, addonIndex) => (
                            <Typography key={addonIndex} variant="caption" sx={{ display: 'block', ml: 1 }}>
                              • {addon.addon.name} x{addon.quantity} (+฿{addon.price.toLocaleString()})
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      {item.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          หมายเหตุ: {item.notes}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ฿{getItemTotal(item).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>

            {/* Order Summary */}
            <Box>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  สรุปการสั่งซื้อ
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">ค่าอาหาร</Typography>
                  <Typography variant="body2">฿{mockOrder.subtotal.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">ค่าจัดส่ง</Typography>
                  <Typography variant="body2">฿{mockOrder.deliveryFee.toLocaleString()}</Typography>
                </Box>
                {mockOrder.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">ส่วนลด</Typography>
                      {mockOrder.promoCode && (
                        <Chip 
                          label={mockOrder.promoCode} 
                          size="small" 
                          color="success" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            backgroundColor: '#E8F5E8',
                            color: '#2E7D32'
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#2E7D32', fontWeight: 500 }}>
                      -฿{mockOrder.discount.toLocaleString()}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>ยอดรวม</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    ฿{mockOrder.total.toLocaleString()}
                  </Typography>
                </Box>
              </Card>
            </Box>
          </DialogContent>

          <DialogActions 
            sx={{ 
              p: 3, 
              pt: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'grey.50',
              position: 'sticky',
              bottom: 0,
              zIndex: 1
            }}
          >
            <Button 
              onClick={() => setDetailDialogOpen(false)}
              variant="contained"
              size="large"
              fullWidth
              sx={{
                borderRadius: '12px',
                py: 1.5,
                fontWeight: 600
              }}
            >
              ปิด
            </Button>
          </DialogActions>
        </>
      </Dialog>
    </Box>
  );
} 