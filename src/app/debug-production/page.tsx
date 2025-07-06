'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  Refresh,
  BugReport,
  CheckCircle,
  Warning,
  Error,
  Info,
  Settings,
  Storage,
  Security,
  NetworkCheck,
  Cookie
} from '@mui/icons-material';

interface ProductionStatus {
  timestamp: string;
  environment: string;
  server: {
    nodejs: string;
    platform: string;
    uptime: number;
  };
  configuration: any;
  database: any;
  authentication: any;
  cookies: any;
  networking: any;
  validation: {
    issues: string[];
    warnings: string[];
    overallStatus: 'healthy' | 'warning' | 'error';
  };
}

export default function ProductionDebugPage() {
  const [status, setStatus] = useState<ProductionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string>('validation');

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/production-status');
      if (!response.ok) {
        throw `HTTP ${response.status}: ${response.statusText}`;
      }
      const data = await response.json();
      setStatus(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? (err as Error).message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleExpandChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Error color="error" />;
      default: return <Info color="info" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BugReport sx={{ color: '#10B981', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ color: '#065f46', fontWeight: 700 }}>
              Production Diagnostics
            </Typography>
            <Typography variant="body2" sx={{ color: '#047857' }}>
              ตรวจสอบปัญหาที่เกิดขึ้นใน production environment
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
          onClick={fetchStatus}
          disabled={loading}
          sx={{ borderColor: '#10B981', color: '#10B981' }}
        >
          รีเฟรช
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>เกิดข้อผิดพลาด:</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* Loading */}
      {loading && !status && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#10B981' }} />
        </Box>
      )}

      {/* Status Display */}
      {status && (
        <Box>
          {/* Overall Status */}
          <Card sx={{ mb: 3, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {getStatusIcon(status.validation.overallStatus)}
                <Typography variant="h6" sx={{ color: '#065f46' }}>
                  สถานะโดยรวม: 
                  <Chip 
                    label={status.validation.overallStatus.toUpperCase()} 
                    color={getStatusColor(status.validation.overallStatus) as any}
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#047857', mb: 2 }}>
                Environment: {status.environment} | 
                Server: {status.server.nodejs} | 
                Uptime: {formatUptime(status.server.uptime)} |
                Last Check: {new Date(status.timestamp).toLocaleString('th-TH')}
              </Typography>

              {/* Issues & Warnings Summary */}
              <Stack direction="row" spacing={2}>
                {status.validation.issues.length > 0 && (
                  <Chip 
                    icon={<Error />}
                    label={`${status.validation.issues.length} Critical Issues`}
                    color="error"
                    variant="outlined"
                  />
                )}
                {status.validation.warnings.length > 0 && (
                  <Chip 
                    icon={<Warning />}
                    label={`${status.validation.warnings.length} Warnings`}
                    color="warning"
                    variant="outlined"
                  />
                )}
                {status.validation.issues.length === 0 && status.validation.warnings.length === 0 && (
                  <Chip 
                    icon={<CheckCircle />}
                    label="ไม่พบปัญหา"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Issues & Warnings */}
          <Accordion 
            expanded={expanded === 'validation'} 
            onChange={handleExpandChange('validation')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Error color="error" />
                <Typography>ปัญหาและคำเตือน</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {status.validation.issues.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#dc2626', mb: 1 }}>
                    ❌ Critical Issues:
                  </Typography>
                  {status.validation.issues.map((issue, index) => (
                    <Alert key={index} severity="error" sx={{ mb: 1 }}>
                      {issue}
                    </Alert>
                  ))}
                </Box>
              )}

              {status.validation.warnings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#f59e0b', mb: 1 }}>
                    ⚠️ Warnings:
                  </Typography>
                  {status.validation.warnings.map((warning, index) => (
                    <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                      {warning}
                    </Alert>
                  ))}
                </Box>
              )}

              {status.validation.issues.length === 0 && status.validation.warnings.length === 0 && (
                <Alert severity="success">
                  ✅ ไม่พบปัญหาใดๆ ระบบทำงานปกติ
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Configuration */}
          <Accordion 
            expanded={expanded === 'configuration'} 
            onChange={handleExpandChange('configuration')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings />
                <Typography>การตั้งค่า Environment</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>ตัวแปร</strong></TableCell>
                      <TableCell><strong>สถานะ</strong></TableCell>
                      <TableCell><strong>รายละเอียด</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(status.configuration).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>
                          <Chip 
                            label={value === 'set' ? 'SET' : value === 'missing' ? 'MISSING' : String(value)}
                            color={value === 'missing' ? 'error' : value === 'set' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {key.includes('Length') && typeof value === 'number' && (
                            <Typography variant="caption">
                              {value} ตัวอักษร
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          {/* Database */}
          <Accordion 
            expanded={expanded === 'database'} 
            onChange={handleExpandChange('database')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage />
                <Typography>ฐานข้อมูล</Typography>
                <Chip 
                  label={status.database.connected ? 'เชื่อมต่อแล้ว' : 'ขาดการเชื่อมต่อ'}
                  color={status.database.connected ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {status.database.connected ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    ✅ เชื่อมต่อฐานข้อมูลสำเร็จ
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Chip label={`Users: ${status.database.userCount}`} />
                    <Chip label={`Restaurants: ${status.database.restaurantCount}`} />
                    <Chip label={`Active: ${status.database.activeRestaurants}`} />
                  </Stack>
                </Box>
              ) : (
                <Alert severity="error">
                  ❌ ไม่สามารถเชื่อมต่อฐานข้อมูล: {status.database.error}
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Authentication */}
          <Accordion 
            expanded={expanded === 'authentication'} 
            onChange={handleExpandChange('authentication')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security />
                <Typography>การยืนยันตัวตน</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Cookies:</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip 
                      label={`จำนวน: ${status.authentication.cookieCount}`} 
                      size="small" 
                    />
                    <Chip 
                      label={status.authentication.hasSessionCookie ? 'มี Session Cookie' : 'ไม่มี Session Cookie'} 
                      color={status.authentication.hasSessionCookie ? 'success' : 'warning'}
                      size="small" 
                    />
                    {status.authentication.sessionCookieLength > 0 && (
                      <Chip 
                        label={`ขนาด: ${status.authentication.sessionCookieLength} ตัวอักษร`} 
                        size="small" 
                      />
                    )}
                  </Stack>
                </Box>

                {status.authentication.hasSessionCookie && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>JWT Status:</Typography>
                    <Chip 
                      label={status.authentication.jwtValid ? 'JWT ถูกต้อง' : 'JWT ไม่ถูกต้อง'}
                      color={status.authentication.jwtValid ? 'success' : 'error'}
                    />
                    {status.authentication.jwtError && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        JWT Error: {status.authentication.jwtError}
                      </Alert>
                    )}
                    {status.authentication.jwtPayload && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          User ID: {status.authentication.jwtPayload.userId} | 
                          Role: {status.authentication.jwtPayload.role} |
                          Expires: {new Date(status.authentication.jwtPayload.exp * 1000).toLocaleString('th-TH')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Cookie Names:</Typography>
                  <Typography variant="caption">
                    {status.authentication.cookieNames.join(', ') || 'ไม่มี cookies'}
                  </Typography>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Cookies Configuration */}
          <Accordion 
            expanded={expanded === 'cookies'} 
            onChange={handleExpandChange('cookies')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Cookie />
                <Typography>การตั้งค่า Cookies</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Property</strong></TableCell>
                      <TableCell><strong>Expected Value</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(status.cookies.expectedSettings).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{String(value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          {/* Networking */}
          <Accordion 
            expanded={expanded === 'networking'} 
            onChange={handleExpandChange('networking')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NetworkCheck />
                <Typography>เครือข่าย</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Client Information:</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip 
                      label={status.networking.isLineApp ? 'LINE App' : 'Web Browser'} 
                      color={status.networking.isLineApp ? 'success' : 'info'}
                      size="small" 
                    />
                    <Chip 
                      label={status.networking.isDesktop ? 'Desktop' : 'Mobile'} 
                      size="small" 
                    />
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Headers:</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <strong>Origin:</strong> {status.networking.origin || 'ไม่มี'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <strong>Referer:</strong> {status.networking.referer || 'ไม่มี'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <strong>User Agent:</strong> {status.networking.userAgent}
                  </Typography>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Container>
  );
} 