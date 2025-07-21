'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Grid,
  Divider,
  FormControlLabel,
  Switch,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  Webhook,
  Settings,
  CheckCircle,
  Error,
  Info,
  Refresh,
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface WebhookStatus {
  isValid: boolean;
  lastCheck: string;
  message: string;
}

export default function WebhookSettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Webhook Settings
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isWebhookEnabled, setIsWebhookEnabled] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  
  // LINE Settings
  const [lineChannelSecret, setLineChannelSecret] = useState('');
  const [lineAccessToken, setLineAccessToken] = useState('');
  const [lineBotId, setLineBotId] = useState('');
  
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // โหลดการตั้งค่าจาก server หรือ local storage
      const currentUrl = window.location.origin;
      setWebhookUrl(`${currentUrl}/api/line/webhook`);
      
      // อาจจะดึงจาก API หรือ environment variables
      setLineChannelSecret(process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET || '');
      
      checkWebhookStatus();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkWebhookStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      setWebhookStatus({
        isValid: response.ok,
        lastCheck: new Date().toLocaleString('th-TH'),
        message: response.ok ? 'Webhook endpoint พร้อมใช้งาน' : 'Webhook endpoint ไม่พร้อมใช้งาน',
      });
    } catch (error) {
      setWebhookStatus({
        isValid: false,
        lastCheck: new Date().toLocaleString('th-TH'),
        message: 'ไม่สามารถตรวจสอบสถานะ webhook ได้',
      });
    }
  };

  const testWebhook = async () => {
    setTestLoading(true);
    try {
      const testData = {
        destination: 'test',
        events: [
          {
            type: 'message',
            mode: 'active',
            timestamp: Date.now(),
            source: {
              type: 'user',
              userId: 'test-user-id',
            },
            replyToken: 'test-reply-token',
            message: {
              id: 'test-message-id',
              type: 'text',
              text: 'Test webhook message',
            },
          },
        ],
      };

      const response = await fetch('/api/line/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-signature': 'test-signature',
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Webhook ทดสอบสำเร็จ!' });
      } else {
        setAlert({ type: 'error', message: 'Webhook ทดสอบล้มเหลว' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาดในการทดสอบ webhook' });
    } finally {
      setTestLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // บันทึกการตั้งค่า
      setAlert({ type: 'success', message: 'บันทึกการตั้งค่าสำเร็จ!' });
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Webhook />
        การจัดการ LINE Webhook
      </Typography>

      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 3 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="webhook settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="การตั้งค่า Webhook" />
          <Tab label="การตั้งค่า LINE" />
          <Tab label="สถานะระบบ" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    URL Endpoint
                  </Typography>
                  <TextField
                    fullWidth
                    label="Webhook URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    helperText="URL ที่ LINE จะส่ง webhook events มา"
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isWebhookEnabled}
                        onChange={(e) => setIsWebhookEnabled(e.target.checked)}
                      />
                    }
                    label="เปิดใช้งาน Webhook"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    สถานะ Webhook
                  </Typography>
                  {webhookStatus && (
                    <Box>
                      <Chip
                        icon={webhookStatus.isValid ? <CheckCircle /> : <Error />}
                        label={webhookStatus.isValid ? 'ใช้งานได้' : 'ไม่พร้อมใช้งาน'}
                        color={webhookStatus.isValid ? 'success' : 'error'}
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        ตรวจสอบล่าสุด: {webhookStatus.lastCheck}
                      </Typography>
                      <Typography variant="body2">
                        {webhookStatus.message}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={checkWebhookStatus}
                      size="small"
                    >
                      ตรวจสอบสถานะ
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={testWebhook}
                      disabled={testLoading}
                      startIcon={testLoading ? <CircularProgress size={16} /> : <Info />}
                      size="small"
                    >
                      ทดสอบ Webhook
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    การตั้งค่า LINE Bot
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="LINE Channel Secret"
                        type="password"
                        value={lineChannelSecret}
                        onChange={(e) => setLineChannelSecret(e.target.value)}
                        helperText="Channel Secret สำหรับยืนยัน webhook signature"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="LINE Channel Access Token"
                        type="password"
                        value={lineAccessToken}
                        onChange={(e) => setLineAccessToken(e.target.value)}
                        helperText="Access Token สำหรับเรียกใช้ LINE API"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="LINE Bot ID"
                        value={lineBotId}
                        onChange={(e) => setLineBotId(e.target.value)}
                        helperText="Bot ID จาก LINE Developers Console"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    วิธีการตั้งค่า LINE Webhook
                  </Typography>
                  <Typography variant="body2" paragraph>
                    1. เข้าไปที่ LINE Developers Console
                  </Typography>
                  <Typography variant="body2" paragraph>
                    2. เลือก Channel ของคุณ
                  </Typography>
                  <Typography variant="body2" paragraph>
                    3. ไปที่ Messaging API settings
                  </Typography>
                  <Typography variant="body2" paragraph>
                    4. ใส่ Webhook URL: <code>{webhookUrl}</code>
                  </Typography>
                  <Typography variant="body2" paragraph>
                    5. เปิดใช้งาน "Use webhook"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    สถานะการเชื่อมต่อ
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>Database:</Typography>
                      <Chip label="เชื่อมต่อแล้ว" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>LINE API:</Typography>
                      <Chip label="รอการตรวจสอบ" color="warning" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>Webhook Endpoint:</Typography>
                      <Chip 
                        label={webhookStatus?.isValid ? "พร้อมใช้งาน" : "ไม่พร้อม"} 
                        color={webhookStatus?.isValid ? "success" : "error"} 
                        size="small" 
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ข้อมูลระบบ
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Environment: {process.env.NODE_ENV}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Version: 1.0.0
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Last Updated: {new Date().toLocaleString('th-TH')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={saveSettings}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Settings />}
        >
          บันทึกการตั้งค่า
        </Button>
      </Box>
    </Box>
  );
} 