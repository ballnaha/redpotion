'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import { getAppConfig, getEnvironmentMode, isProduction, isDevelopment } from '@/lib/appConfig';

export default function TestNodeEnvPage() {
  const appConfig = getAppConfig();
  const environmentMode = getEnvironmentMode();
  const isProd = isProduction();
  const isDev = isDevelopment();

  const configEntries = [
    { key: 'enforceLineApp', value: appConfig.enforceLineApp },
    { key: 'allowDesktopAccess', value: appConfig.allowDesktopAccess },
    { key: 'enableBypassMode', value: appConfig.enableBypassMode },
    { key: 'requireLineLogin', value: appConfig.requireLineLogin },
    { key: 'enableDebugLogs', value: appConfig.enableDebugLogs },
    { key: 'enableMockUser', value: appConfig.enableMockUser },
    { key: 'skipAuthenticationCheck', value: appConfig.skipAuthenticationCheck },
    { key: 'enableLiffStrictMode', value: appConfig.enableLiffStrictMode },
    { key: 'liffSessionTimeout', value: appConfig.liffSessionTimeout },
    { key: 'showDebugInfo', value: appConfig.showDebugInfo },
    { key: 'enableDevTools', value: appConfig.enableDevTools },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🔧 NODE_ENV Configuration Test
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        หน้านี้แสดงการทำงานของระบบการตั้งค่าตาม NODE_ENV
      </Alert>

      <Box sx={{ display: 'grid', gap: 3 }}>
        {/* Environment Info */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🌍 Environment Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                label={`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`}
                color={isProd ? 'error' : 'success'}
                variant="outlined"
              />
              <Chip 
                label={`Mode: ${environmentMode}`}
                color={isProd ? 'error' : 'success'}
              />
              <Chip 
                label={`Is Production: ${isProd ? 'Yes' : 'No'}`}
                color={isProd ? 'error' : 'success'}
                variant="outlined"
              />
              <Chip 
                label={`Is Development: ${isDev ? 'Yes' : 'No'}`}
                color={isDev ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>

        {/* App Configuration */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚙️ Application Configuration
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Setting</strong></TableCell>
                    <TableCell><strong>Value</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configEntries.map((entry) => (
                    <TableRow key={entry.key}>
                      <TableCell>{entry.key}</TableCell>
                      <TableCell>
                        <Chip
                          label={String(entry.value)}
                          color={
                            typeof entry.value === 'boolean'
                              ? entry.value
                                ? 'success'
                                : 'error'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {typeof entry.value}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Environment Variables Override */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔄 Environment Variables Override
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              ตัวแปรเหล่านี้สามารถ override การตั้งค่าเริ่มต้นได้:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                'NEXT_PUBLIC_ENFORCE_LINE_APP',
                'NEXT_PUBLIC_ALLOW_DESKTOP',
                'NEXT_PUBLIC_ENABLE_BYPASS',
                'NEXT_PUBLIC_DEBUG_MODE',
                'NEXT_PUBLIC_REQUIRE_LINE_LOGIN'
              ].map((envVar) => (
                <Chip
                  key={envVar}
                  label={`${envVar}: ${process.env[envVar] || 'not set'}`}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 วิธีการทดสอบ
            </Typography>
            <Typography variant="body2" component="div">
              <strong>1. ทดสอบ Development Mode:</strong>
              <br />
              <code>npm run dev</code> หรือ <code>cross-env NODE_ENV=development npm run dev</code>
              <br /><br />
              
              <strong>2. ทดสอบ Production Mode:</strong>
              <br />
              <code>npm run dev:prod</code> หรือ <code>cross-env NODE_ENV=production npm run dev</code>
              <br /><br />
              
              <strong>3. สังเกตการเปลี่ยนแปลง:</strong>
              <br />
              • Debug logs จะแสดงในโหมด development เท่านั้น
              <br />
              • Bypass mode เปิดใช้งานในโหมด development เท่านั้น
              <br />
              • Dev tools เปิดใช้งานในโหมด development เท่านั้น
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
} 