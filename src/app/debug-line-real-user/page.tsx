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

  const checkCurrentCookies = () => {
    try {
      addResult({
        name: 'Check Current Cookies',
        status: 'info',
        message: '🍪 ตรวจสอบ cookies ปัจจุบัน...'
      });

      // ดึง cookies ทั้งหมด
      const allCookies = document.cookie.split(';').reduce((cookies: any, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
        return cookies;
      }, {});

      const cookieNames = Object.keys(allCookies);
      const lineCookies = cookieNames.filter(name => 
        name.includes('line') || name.includes('liff')
      );
      const nextAuthCookies = cookieNames.filter(name => 
        name.includes('next-auth') || name.includes('__Host-next-auth') || name.includes('__Secure-next-auth')
      );

      addResult({
        name: 'Current Cookies',
        status: 'info',
        message: `📋 พบ cookies ทั้งหมด ${cookieNames.length} รายการ`,
        details: {
          totalCookies: cookieNames.length,
          allCookieNames: cookieNames,
          lineCookies: lineCookies,
          nextAuthCookies: nextAuthCookies,
          hasLineSessionToken: allCookies['line-session-token'] ? true : false,
          hasLineSessionBackup: allCookies['line-session-backup'] ? true : false
        }
      });

      // ตรวจสอบ localStorage และ sessionStorage
      const localStorageKeys = Object.keys(localStorage);
      const sessionStorageKeys = Object.keys(sessionStorage);
      const lineLocalStorage = localStorageKeys.filter(key => 
        key.includes('line') || key.includes('liff')
      );
      const lineSessionStorage = sessionStorageKeys.filter(key => 
        key.includes('line') || key.includes('liff')
      );

      addResult({
        name: 'Browser Storage',
        status: 'info',
        message: `💾 ตรวจสอบ browser storage`,
        details: {
          localStorage: {
            total: localStorageKeys.length,
            lineRelated: lineLocalStorage
          },
          sessionStorage: {
            total: sessionStorageKeys.length,
            lineRelated: lineSessionStorage
          }
        }
      });

    } catch (error) {
      addResult({
        name: 'Check Current Cookies',
        status: 'error',
        message: '❌ ไม่สามารถตรวจสอบ cookies ได้',
        details: error
      });
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
            reason: sessionData.reason,
            error: sessionData.error,
            debug: sessionData.debug
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

    // 1. ตรวจสอบ cookies และ storage ปัจจุบัน
    checkCurrentCookies();
    
    // รอ 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. ตรวจสอบ session ปัจจุบัน
    await testSessionCheck();
    
    // รอ 1 วินาที
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. ทดสอบ backend authentication
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

  // ฟังก์ชันสำหรับ clear cache, session, และ token
  const clearAllData = async () => {
    addResult({
      name: 'Clear All Data',
      status: 'info',
      message: '🧹 กำลังล้างข้อมูลทั้งหมด...'
    });

    try {
      // 1. Clear LIFF
      if ((window as any).liff && (window as any).liff.isLoggedIn()) {
        await (window as any).liff.logout();
        addResult({
          name: 'LIFF Logout',
          status: 'success',
          message: '✅ ล็อกเอาท์จาก LIFF สำเร็จ'
        });
      }

      // 2. Clear localStorage
      const localStorageKeys = Object.keys(localStorage);
      const liffKeys = localStorageKeys.filter(key => 
        key.includes('liff') || 
        key.includes('line') || 
        key.includes('access_token') ||
        key.includes('session')
      );
      
      liffKeys.forEach(key => localStorage.removeItem(key));
      
      if (liffKeys.length > 0) {
        addResult({
          name: 'Clear localStorage',
          status: 'success',
          message: `✅ ล้าง localStorage สำเร็จ (${liffKeys.length} keys)`,
          details: { clearedKeys: liffKeys }
        });
      }

      // 3. Clear sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      const sessionLiffKeys = sessionStorageKeys.filter(key => 
        key.includes('liff') || 
        key.includes('line') || 
        key.includes('access_token') ||
        key.includes('session')
      );
      
      sessionLiffKeys.forEach(key => sessionStorage.removeItem(key));
      
      if (sessionLiffKeys.length > 0) {
        addResult({
          name: 'Clear sessionStorage',
          status: 'success',
          message: `✅ ล้าง sessionStorage สำเร็จ (${sessionLiffKeys.length} keys)`,
          details: { clearedKeys: sessionLiffKeys }
        });
      }

      // 4. Clear cookies
      const cookies = document.cookie.split(';');
      let clearedCookies = 0;
      
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('liff') || name.includes('line') || name.includes('session') || name.includes('next-auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          clearedCookies++;
        }
      });

      if (clearedCookies > 0) {
        addResult({
          name: 'Clear Cookies',
          status: 'success',
          message: `✅ ล้าง cookies สำเร็จ (${clearedCookies} cookies)`
        });
      }

      // 5. Clear cache (if possible)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const liffCaches = cacheNames.filter(name => 
          name.includes('liff') || name.includes('line')
        );
        
        for (const cacheName of liffCaches) {
          await caches.delete(cacheName);
        }
        
        if (liffCaches.length > 0) {
          addResult({
            name: 'Clear Cache',
            status: 'success',
            message: `✅ ล้าง cache สำเร็จ (${liffCaches.length} caches)`,
            details: { clearedCaches: liffCaches }
          });
        }
      }

      // 6. Reset state
      setLiffReady(false);
      setUserProfile(null);
      setAccessToken('');
      setIsInLineApp(false);

      addResult({
        name: 'Reset State',
        status: 'success',
        message: '✅ รีเซ็ต state สำเร็จ'
      });

      addResult({
        name: 'Clear All Data Complete',
        status: 'success',
        message: '🎉 ล้างข้อมูลทั้งหมดเสร็จสิ้น! กรุณา refresh หน้า หรือเริ่มต้นใหม่'
      });

    } catch (error) {
      addResult({
        name: 'Clear All Data Error',
        status: 'error',
        message: '❌ เกิดข้อผิดพลาดในการล้างข้อมูล',
        details: error
      });
    }
  };

  const forceReloadLiff = async () => {
    addResult({
      name: 'Force Reload LIFF',
      status: 'info',
      message: '🔄 กำลังโหลด LIFF ใหม่แบบบังคับ...'
    });

    try {
      // ลบ LIFF SDK script เก่า
      const existingScript = document.querySelector('script[src*="liff"]');
      if (existingScript) {
        existingScript.remove();
        addResult({
          name: 'Remove Old LIFF Script',
          status: 'success',
          message: '✅ ลบ LIFF script เก่าแล้ว'
        });
      }

      // ลบ LIFF object
      if ((window as any).liff) {
        delete (window as any).liff;
        addResult({
          name: 'Remove LIFF Object',
          status: 'success',
          message: '✅ ลบ LIFF object แล้ว'
        });
      }

      // รอสักครู่
      await new Promise(resolve => setTimeout(resolve, 1000));

      // เริ่มต้น LIFF ใหม่
      await initializeLiffTest();

    } catch (error) {
      addResult({
        name: 'Force Reload LIFF Error',
        status: 'error',
        message: '❌ เกิดข้อผิดพลาดในการโหลด LIFF ใหม่',
        details: error
      });
    }
  };

  const clearServerSession = async () => {
    try {
      addResult({
        name: 'Clear Server Session',
        status: 'loading',
        message: '⏳ กำลังล้าง session ฝั่งเซิร์ฟเวอร์...'
      });

      // ลองล้าง LINE session ก่อน
      try {
        const lineSessionResponse = await fetch('/api/auth/line-session', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (lineSessionResponse.ok) {
          addResult({
            name: 'Clear LINE Session',
            status: 'success',
            message: '✅ ล้าง LINE session สำเร็จ'
          });
        } else {
          addResult({
            name: 'Clear LINE Session',
            status: 'warning',
            message: `⚠️ ไม่สามารถล้าง LINE session ได้ (${lineSessionResponse.status})`
          });
        }
      } catch (lineError) {
        addResult({
          name: 'Clear LINE Session',
          status: 'warning',
          message: '⚠️ ไม่สามารถเรียก LINE session API ได้',
          details: lineError
        });
      }

      // ลองล้าง NextAuth session
      try {
        const nextAuthResponse = await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (nextAuthResponse.ok) {
          addResult({
            name: 'Clear NextAuth Session',
            status: 'success',
            message: '✅ ล้าง NextAuth session สำเร็จ'
          });
        } else {
          addResult({
            name: 'Clear NextAuth Session',
            status: 'warning',
            message: `⚠️ ไม่สามารถล้าง NextAuth session ได้ (${nextAuthResponse.status})`
          });
        }
      } catch (nextAuthError) {
        addResult({
          name: 'Clear NextAuth Session',
          status: 'warning',
          message: '⚠️ ไม่สามารถเรียก NextAuth signout API ได้',
          details: nextAuthError
        });
      }

      addResult({
        name: 'Clear Server Session Complete',
        status: 'success',
        message: '✅ ล้าง server session เสร็จสิ้น'
      });

    } catch (error) {
      addResult({
        name: 'Clear Server Session',
        status: 'error',
        message: '❌ เกิดข้อผิดพลาดในการล้าง server session',
        details: error
      });
    }
  };

  const refreshPage = () => {
    addResult({
      name: 'Page Refresh',
      status: 'info',
      message: '🔄 กำลัง refresh หน้าเว็บ...'
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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

      {/* ปุ่มล้างข้อมูล - เพิ่มส่วนใหม่ */}
      <Card sx={{ mb: 3, border: '2px solid #f44336' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#f44336' }}>
            🧹 ล้างข้อมูล & แก้ปัญหา
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>ใช้เมื่อ:</strong> มีปัญหาการ login, เปลี่ยน LINE endpoint, หรือ session ไม่ถูกต้อง
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={clearAllData}
              sx={{ minWidth: 150 }}
            >
              🗑️ ล้างข้อมูลทั้งหมด
            </Button>
            
            <Button 
              variant="outlined" 
              color="error" 
              onClick={clearServerSession}
              sx={{ minWidth: 150 }}
            >
              🔄 ล้าง Server Session
            </Button>
            
            <Button 
              variant="outlined" 
              color="warning" 
              onClick={forceReloadLiff}
              sx={{ minWidth: 150 }}
            >
              🔄 โหลด LIFF ใหม่
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={refreshPage}
              sx={{ minWidth: 150 }}
            >
              🔄 Refresh หน้า
            </Button>
          </Box>
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
            
            <Button variant="outlined" onClick={checkCurrentCookies}>
              🍪 ตรวจสอบ Cookies
            </Button>
            
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
          <li><strong>หากมีปัญหา login:</strong> กด "ล้างข้อมูลทั้งหมด" ก่อน</li>
          <li>กดปุ่ม "ทดสอบเต็ม" เพื่อทดสอบการทำงานทั้งหมด</li>
          <li>ตรวจสอบผลลัพธ์ว่ามีข้อผิดพลาดหรือไม่</li>
          <li>หากยังมีปัญหา ให้ "Refresh หน้า" และลองใหม่</li>
          <li>หากมีปัญหาให้ส่งผลลัพธ์ให้ developer</li>
        </Typography>
      </Alert>
    </Box>
  );
} 