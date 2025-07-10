'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import AuthWrapper from '@/components/AuthWrapper';
import { 
  authenticateUser, 
  checkSessionAuth, 
  tryLiffAuth, 
  quickAuthCheck,
  forceReauth,
  logout,
  isInLineEnvironment,
  isLiffAvailable 
} from '@/lib/hybridAuth';
import { getAppConfig } from '@/lib/appConfig';

export default function TestHybridAuthPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const config = getAppConfig();

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(testName);
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      setTestResults((prev: any) => ({
        ...prev,
        [testName]: {
          ...result,
          duration: `${duration}ms`,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setTestResults((prev: any) => ({
        ...prev,
        [testName]: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const tests = [
    {
      name: 'quickAuthCheck',
      label: '🚀 Quick Auth Check',
      description: 'ตรวจสอบ authentication แบบเร็ว (session only)',
      action: () => quickAuthCheck()
    },
    {
      name: 'checkSessionAuth',
      label: '🔍 Session Auth Check',
      description: 'ตรวจสอบ session API',
      action: () => checkSessionAuth()
    },
    {
      name: 'authenticateUser',
      label: '🔐 Full Authentication',
      description: 'ระบบ Hybrid Authentication เต็มรูปแบบ',
      action: () => authenticateUser({ restaurantId: 'test123' })
    },
    {
      name: 'tryLiffAuth',
      label: '📱 LIFF Authentication',
      description: 'ทดสอบ LIFF authentication',
      action: () => tryLiffAuth({ restaurantId: 'test123' })
    },
    {
      name: 'forceReauth',
      label: '🔄 Force Re-auth',
      description: 'บังคับ re-authentication',
      action: () => forceReauth({ restaurantId: 'test123' })
    }
  ];

  const environmentInfo = {
    'NODE_ENV': process.env.NODE_ENV,
    'In LINE Environment': isInLineEnvironment(),
    'LIFF Available': isLiffAvailable(),
    'Debug Mode': config.enableDebugLogs,
    'Require LINE Login': config.requireLineLogin,
    'User Agent': typeof window !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'SSR'
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Hybrid Authentication Test
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        หน้านี้ใช้สำหรับทดสอบระบบ Hybrid Authentication ที่ใช้ Session API เป็นหลัก + LIFF เป็นรอง
      </Alert>

      {/* Environment Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🌍 Environment Information
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(environmentInfo).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${String(value)}`}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* AuthWrapper Test */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🛡️ AuthWrapper Component Test
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            ทดสอบ AuthWrapper component ที่ใช้ระบบ Hybrid Authentication
          </Typography>
          
          <AuthWrapper
            restaurantId="test123"
            requireAuth={false}
            onAuthSuccess={(user) => {
              console.log('✅ AuthWrapper success:', user);
              setUser(user);
            }}
            onAuthFailure={(error) => {
              console.error('❌ AuthWrapper failure:', error);
            }}
          >
            <Alert severity="success">
              <Typography variant="h6">🎉 AuthWrapper Success!</Typography>
              {user && (
                <Typography variant="body2">
                  ผู้ใช้: {user.name} ({user.role})
                </Typography>
              )}
            </Alert>
          </AuthWrapper>
        </CardContent>
      </Card>

      {/* Manual Tests */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🧪 Manual Tests
          </Typography>
          
          <Stack spacing={2}>
            {tests.map((test) => (
              <Box key={test.name} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {test.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {test.description}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => runTest(test.name, test.action)}
                    disabled={loading === test.name}
                    size="small"
                  >
                    {loading === test.name ? 'กำลังทดสอบ...' : 'ทดสอบ'}
                  </Button>
                </Box>
                
                {testResults[test.name] && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      ผลลัพธ์ ({testResults[test.name].timestamp}):
                    </Typography>
                    <Box component="pre" sx={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(testResults[test.name], null, 2)}
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Utility Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🛠️ Utility Actions
          </Typography>
          
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="error"
              onClick={() => runTest('logout', logout)}
              disabled={!!loading}
            >
              🚪 Logout
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => {
                setTestResults({});
                setUser(null);
              }}
            >
              🗑️ Clear Results
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              🔄 Reload Page
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Test Results Summary
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Test</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell><strong>Duration</strong></TableCell>
                    <TableCell><strong>Time</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                    <TableRow key={testName}>
                      <TableCell>{testName}</TableCell>
                      <TableCell>
                        <Chip
                          label={result.success || result.isAuthenticated ? 'Success' : 'Failed'}
                          color={result.success || result.isAuthenticated ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{result.method || 'N/A'}</TableCell>
                      <TableCell>{result.duration || 'N/A'}</TableCell>
                      <TableCell>{result.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {config.enableDebugLogs && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Debug Mode Active:</strong> ดู console logs สำหรับรายละเอียดเพิ่มเติม
          </Typography>
        </Alert>
      )}
    </Container>
  );
} 