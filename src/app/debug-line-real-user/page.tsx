'use client';

import { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Alert, 
  Divider, 
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper
} from '@mui/material';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  details?: any;
  timestamp?: string;
}

export default function DebugLineRealUser() {
  const [mounted, setMounted] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isInLineApp, setIsInLineApp] = useState(false);
  const [liffReady, setLiffReady] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeLiffTest();
  }, []);

  const addResult = (result: Omit<TestResult, 'timestamp'>) => {
    const newResult = {
      ...result,
      timestamp: new Date().toLocaleTimeString('th-TH')
    };
    setResults(prev => [newResult, ...prev]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const initializeLiffTest = async () => {
    addResult({
      name: 'เริ่มต้นการทดสอบ',
      status: 'info',
      message: 'กำลังตรวจสอบสภาพแวดล้อม LINE...'
    });

    // ตรวจสอบว่าอยู่ใน LINE App หรือไม่
    const userAgent = navigator.userAgent;
    const isLine = userAgent.includes('Line/') || userAgent.includes('LINE/');
    setIsInLineApp(isLine);

    if (isLine) {
      addResult({
        name: 'สภาพแวดล้อม',
        status: 'success',
        message: '✅ กำลังรันใน LINE Application',
        details: { userAgent }
      });
    } else {
      addResult({
        name: 'สภาพแวดล้อม',
        status: 'warning',
        message: '⚠️ ไม่ได้รันใน LINE Application',
        details: { userAgent }
      });
    }

    // โหลด LIFF SDK
    try {
      await loadLiffSdk();
      await initializeLiff();
    } catch (error) {
      addResult({
        name: 'LIFF Initialization',
        status: 'error',
        message: 'ไม่สามารถเริ่มต้น LIFF ได้',
        details: error
      });
    }
  };

  const loadLiffSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).liff) {
        addResult({
          name: 'LIFF SDK',
          status: 'success',
          message: '✅ LIFF SDK พร้อมใช้งานแล้ว'
        });
        resolve();
        return;
      }

      addResult({
        name: 'LIFF SDK',
        status: 'loading',
        message: '⏳ กำลังโหลด LIFF SDK...'
      });

      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        addResult({
          name: 'LIFF SDK',
          status: 'success',
          message: '✅ LIFF SDK โหลดสำเร็จ'
        });
        resolve();
      };
      
      script.onerror = () => {
        addResult({
          name: 'LIFF SDK',
          status: 'error',
          message: '❌ ไม่สามารถโหลด LIFF SDK ได้'
        });
        reject(new Error('Failed to load LIFF SDK'));
      };
      
      document.head.appendChild(script);
    });
  };

  const initializeLiff = async () => {
    try {
      addResult({
        name: 'LIFF Initialize',
        status: 'loading',
        message: '⏳ กำลังเริ่มต้น LIFF...'
      });

      // ใช้ LIFF ID จาก environment
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2006578138-dkX7vNzZ';
      
      await (window as any).liff.init({ liffId });
      setLiffReady(true);

      addResult({
        name: 'LIFF Initialize',
        status: 'success',
        message: '✅ LIFF เริ่มต้นสำเร็จ',
        details: {
          liffId,
          isLoggedIn: (window as any).liff.isLoggedIn(),
          isInClient: (window as any).liff.isInClient(),
          context: (window as any).liff.getContext()
        }
      });

      // ตรวจสอบสถานะการล็อกอิน
      await checkLoginStatus();

    } catch (error) {
      addResult({
        name: 'LIFF Initialize',
        status: 'error',
        message: '❌ การเริ่มต้น LIFF ล้มเหลว',
        details: error
      });
    }
  };

  const checkLoginStatus = async () => {
    try {
      if (!(window as any).liff.isLoggedIn()) {
        addResult({
          name: 'Login Status',
          status: 'warning',
          message: '⚠️ ยังไม่ได้ล็อกอิน LINE',
          details: 'ต้องล็อกอินก่อนเพื่อทดสอบ'
        });
        return;
      }

      addResult({
        name: 'Login Status',
        status: 'success',
        message: '✅ ล็อกอิน LINE แล้ว'
      });

      // ดึง access token
      const token = (window as any).liff.getAccessToken();
      setAccessToken(token);

      addResult({
        name: 'Access Token',
        status: 'success',
        message: `✅ ได้ Access Token แล้ว (${token.substring(0, 20)}...)`,
        details: {
          tokenLength: token.length,
          tokenPreview: token.substring(0, 50) + '...'
        }
      });

      // ดึงข้อมูลโปรไฟล์
      const profile = await (window as any).liff.getProfile();
      setUserProfile(profile);

      addResult({
        name: 'User Profile',
        status: 'success',
        message: `✅ ได้ข้อมูลผู้ใช้: ${profile.displayName}`,
        details: {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage
        }
      });

    } catch (error) {
      addResult({
        name: 'Login Check',
        status: 'error',
        message: '❌ ไม่สามารถตรวจสอบสถานะล็อกอินได้',
        details: error
      });
    }
  };

  const performLineLogin = async () => {
    if (!(window as any).liff.isLoggedIn()) {
      addResult({
        name: 'LINE Login',
        status: 'info',
        message: '🔐 กำลังเข้าสู่ระบบ LINE...'
      });
      (window as any).liff.login();
      return;
    }

    await checkLoginStatus();
  };

  const testBackendAuthentication = async () => {
    if (!accessToken) {
      addResult({
        name: 'Backend Test',
        status: 'error',
        message: '❌ ไม่มี Access Token สำหรับทดสอบ'
      });
      return;
    }

    setLoading(true);
    
    try {
      addResult({
        name: 'Backend Authentication',
        status: 'loading',
        message: '⏳ กำลังทดสอบ Backend Authentication...'
      });

      // ตรวจจับ platform
      let platform = 'BROWSER';
      try {
        if ((window as any).liff.getOS) {
          const os = (window as any).liff.getOS();
          if (os === 'ios') platform = 'IOS';
          else if (os === 'android') platform = 'ANDROID';
        }
      } catch (e) {
        console.warn('Cannot detect platform:', e);
      }

      const requestData = {
        accessToken,
        platform,
        restaurantId: 'cmcll48ip00029hbwya22iyhr' // ใช้ restaurant ID จริงจากฐานข้อมูล
      };

      addResult({
        name: 'Request Data',
        status: 'info',
        message: '📦 ข้อมูลที่ส่งไป Backend',
        details: {
          platform,
          hasAccessToken: !!accessToken,
          accessTokenLength: accessToken.length,
          restaurantId: requestData.restaurantId
        }
      });

      const response = await fetch('/api/auth/line-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        addResult({
          name: 'Backend Authentication',
          status: 'success',
          message: `✅ Backend Authentication สำเร็จ! User: ${responseData.user?.name}`,
          details: {
            status: response.status,
            user: responseData.user,
            isNewUser: responseData.isNewUser,
            profileUpdated: responseData.profileUpdated,
            redirectUrl: responseData.redirectUrl
          }
        });
      } else {
        addResult({
          name: 'Backend Authentication',
          status: 'error',
          message: `❌ Backend Authentication ล้มเหลว (${response.status})`,
          details: {
            status: response.status,
            statusText: response.statusText,
            error: responseData.error,
            fullResponse: responseData
          }
        });
      }

    } catch (error) {
      addResult({
        name: 'Backend Authentication',
        status: 'error',
        message: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Backend',
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const testSessionCheck = async () => {
    try {
      addResult({
        name: 'Session Check',
        status: 'loading',
        message: '⏳ กำลังตรวจสอบ Session...'
      });

      const response = await fetch('/api/auth/line-session');
      const sessionData = await response.json();

      if (response.ok && sessionData.authenticated) {
        addResult({
          name: 'Session Check',
          status: 'success',
          message: '✅ Session ใช้งานได้',
          details: {
            user: sessionData.user,
            authenticated: sessionData.authenticated,
            role: sessionData.role
          }
        });
      } else {
        addResult({
          name: 'Session Check',
          status: 'warning',
          message: `⚠️ Session ไม่ถูกต้อง (${response.status})`,
          details: {
            status: response.status,
            needsReAuth: sessionData.needsReAuth,
            reason: sessionData.reason
          }
        });
      }
    } catch (error) {
      addResult({
        name: 'Session Check',
        status: 'error',
        message: '❌ ไม่สามารถตรวจสอบ Session ได้',
        details: error
      });
    }
  };

  const runFullTest = async () => {
    clearResults();
    addResult({
      name: 'Full Test Started',
      status: 'info',
      message: '🚀 เริ่มการทดสอบแบบเต็ม...'
    });

    // 1. ตรวจสอบ session ปัจจุบัน
    await testSessionCheck();
    
    // รอ 1 วินาที
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. ทดสอบ backend authentication
    if (accessToken) {
      await testBackendAuthentication();
    } else {
      addResult({
        name: 'Backend Test Skipped',
        status: 'warning',
        message: '⚠️ ข้าม Backend test เนื่องจากไม่มี Access Token'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'loading': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'loading': return '⏳';
      default: return 'ℹ️';
    }
  };

  if (!mounted) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🧪 LINE Login Real User Test
        {isInLineApp && <Chip label="ใน LINE App" color="success" size="small" />}
      </Typography>

      {/* สถานะปัจจุบัน */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 สถานะปัจจุบัน
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              label={`LINE App: ${isInLineApp ? 'Yes' : 'No'}`} 
              color={isInLineApp ? 'success' : 'warning'} 
            />
            <Chip 
              label={`LIFF Ready: ${liffReady ? 'Yes' : 'No'}`} 
              color={liffReady ? 'success' : 'error'} 
            />
            <Chip 
              label={`Access Token: ${accessToken ? 'Yes' : 'No'}`} 
              color={accessToken ? 'success' : 'error'} 
            />
            <Chip 
              label={`User Profile: ${userProfile ? 'Yes' : 'No'}`} 
              color={userProfile ? 'success' : 'error'} 
            />
          </Box>

          {userProfile && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                👤 ผู้ใช้ปัจจุบัน: {userProfile.displayName} (ID: {userProfile.userId})
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ปุ่มควบคุม */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎮 การควบคุม
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {!liffReady && (
              <Button variant="outlined" onClick={initializeLiffTest}>
                🔄 เริ่มต้น LIFF ใหม่
              </Button>
            )}
            
            {liffReady && (
              <Button variant="outlined" onClick={performLineLogin}>
                🔐 เข้าสู่ระบบ LINE
              </Button>
            )}
            
            <Button variant="outlined" onClick={testSessionCheck}>
              🔍 ตรวจสอบ Session
            </Button>
            
            {accessToken && (
              <Button 
                variant="contained" 
                onClick={testBackendAuthentication}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : '🧪 ทดสอบ Backend'}
              </Button>
            )}
            
            <Button variant="contained" color="primary" onClick={runFullTest}>
              🚀 ทดสอบเต็ม
            </Button>
            
            <Button variant="outlined" color="secondary" onClick={clearResults}>
              🗑️ ล้างผลลัพธ์
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ผลลัพธ์การทดสอบ */}
      {results.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 ผลลัพธ์การทดสอบ ({results.length} รายการ)
            </Typography>
            
            <List>
              {results.map((result, index) => (
                <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getStatusIcon(result.status)}</span>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {result.name}
                        </Typography>
                        {result.timestamp && (
                          <Chip label={result.timestamp} size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <span style={{ color: getStatusColor(result.status), fontSize: '0.875rem' }}>
                          {result.message}
                        </span>
                        {result.details && (
                          <span style={{ 
                            display: 'block', 
                            marginTop: '8px', 
                            padding: '8px', 
                            backgroundColor: '#f5f5f5', 
                            fontSize: '0.75rem', 
                            borderRadius: '4px',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            overflow: 'auto'
                          }}>
                            {JSON.stringify(result.details, null, 2)}
                          </span>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* คำแนะนำ */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>วิธีใช้:</strong>
        </Typography>
        <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>เปิดหน้านี้จาก LINE Application</li>
          <li>กดปุ่ม "ทดสอบเต็ม" เพื่อทดสอบการทำงานทั้งหมด</li>
          <li>ตรวจสอบผลลัพธ์ว่ามีข้อผิดพลาดหรือไม่</li>
          <li>หากมีปัญหาให้ส่งผลลัพธ์ให้ developer</li>
        </Typography>
      </Alert>
    </Box>
  );
} 