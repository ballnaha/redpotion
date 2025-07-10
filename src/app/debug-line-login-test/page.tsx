'use client';

import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Alert, Divider } from '@mui/material';

export default function DebugLineLoginTest() {
  const [testAccessToken, setTestAccessToken] = useState('');
  const [testRestaurantId, setTestRestaurantId] = useState('');
  const [testPlatform, setTestPlatform] = useState('BROWSER');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLineLogin = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const requestData = {
        accessToken: testAccessToken,
        restaurantId: testRestaurantId || undefined,
        platform: testPlatform
      };

      console.log('🧪 Testing LINE login with:', requestData);

      const res = await fetch('/api/auth/line-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await res.json();
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data: responseData,
        headers: Object.fromEntries(res.headers.entries())
      });

      console.log('🧪 Test response:', {
        status: res.status,
        ok: res.ok,
        data: responseData
      });

    } catch (error) {
      console.error('🧪 Test error:', error);
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithEmptyToken = () => {
    setTestAccessToken('');
    testLineLogin();
  };

  const testWithInvalidToken = () => {
    setTestAccessToken('invalid_token_123');
    testLineLogin();
  };

  const testWithMalformedData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/line-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"accessToken":}' // Malformed JSON
      });

      const responseData = await res.text();
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: responseData,
        note: 'Malformed JSON test'
      });
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Malformed JSON test'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🧪 LINE Login Debug Test
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manual Test
          </Typography>
          
          <TextField
            fullWidth
            label="Access Token"
            value={testAccessToken}
            onChange={(e) => setTestAccessToken(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="ใส่ ACCESS TOKEN จาก LINE LIFF"
          />
          
          <TextField
            fullWidth
            label="Restaurant ID (optional)"
            value={testRestaurantId}
            onChange={(e) => setTestRestaurantId(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            select
            label="Platform"
            value={testPlatform}
            onChange={(e) => setTestPlatform(e.target.value)}
            sx={{ mb: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="BROWSER">BROWSER</option>
            <option value="IOS">IOS</option>
            <option value="ANDROID">ANDROID</option>
          </TextField>
          
          <Button 
            variant="contained" 
            onClick={testLineLogin}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            {loading ? 'Testing...' : 'Test Login'}
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Tests
          </Typography>
          
          <Button 
            variant="outlined" 
            onClick={testWithEmptyToken}
            disabled={loading}
            sx={{ mr: 1, mb: 1 }}
          >
            Test Empty Token (Should be 400)
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={testWithInvalidToken}
            disabled={loading}
            sx={{ mr: 1, mb: 1 }}
          >
            Test Invalid Token (Should be 401)
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={testWithMalformedData}
            disabled={loading}
            sx={{ mr: 1, mb: 1 }}
          >
            Test Malformed JSON (Should be 400)
          </Button>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Response
            </Typography>
            
            {response.error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error: {response.error}
              </Alert>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Status:</strong> {response.status} {response.statusText}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>OK:</strong> {response.ok ? 'Yes' : 'No'}
                </Typography>
                {response.note && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Note:</strong> {response.note}
                  </Typography>
                )}
              </>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Response Data:
            </Typography>
            <Box sx={{ 
              backgroundColor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
              maxHeight: 400
            }}>
              {JSON.stringify(response, null, 2)}
            </Box>
          </CardContent>
        </Card>
      )}
      
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>คำแนะนำ:</strong> หากคุณกำลังทดสอบจาก LINE App ให้ใช้ browser developer tools 
            เพื่อดู console logs และเช็ค network requests
          </Typography>
        </Alert>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Alert severity="warning">
          <Typography variant="body2">
            <strong>ปัญหาที่พบบ่อย:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
            <li><strong>400 Bad Request:</strong> ข้อมูล accessToken ไม่ถูกต้องหรือขาดหาย</li>
            <li><strong>401 Unauthorized:</strong> Access token หมดอายุหรือ user ถูกลบจากฐานข้อมูล</li>
            <li><strong>500 Server Error:</strong> ปัญหาการเชื่อมต่อฐานข้อมูลหรือ configuration</li>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>การแก้ไข:</strong> หาก user ถูกลบจากฐานข้อมูล ระบบจะลบ cookies และสร้างผู้ใช้ใหม่อัตโนมัติ
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
} 