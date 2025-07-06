'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Stack,
  Button,
  Collapse,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess, 
  Refresh,
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';

interface LineAuthDebugProps {
  show?: boolean;
}

export default function LineAuthDebug({ show = false }: LineAuthDebugProps) {
  const [expanded, setExpanded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [liffConfig, setLiffConfig] = useState<any>(null);
  const [liffValidation, setLiffValidation] = useState<any>(null);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        localStorage: null,
        sessionStorage: null,
        sessionAPI: null,
        liffStatus: null,
        environment: {
          userAgent: navigator.userAgent,
          isLineApp: navigator.userAgent.includes('Line'),
          url: window.location.href,
          referrer: document.referrer
        }
      };

      // ตรวจสอบ localStorage
      try {
        const storedUser = localStorage.getItem('line_user_data');
        const liffSession = localStorage.getItem('liff_session_data');
        info.localStorage = {
          line_user_data: storedUser ? JSON.parse(storedUser) : null,
          liff_session_data: liffSession ? JSON.parse(liffSession) : null
        };
      } catch (e) {
        info.localStorage = { error: 'Invalid JSON in localStorage' };
      }

      // ตรวจสอบ sessionStorage
      try {
        const redirectCount = sessionStorage.getItem('menu_redirect_count');
        info.sessionStorage = {
          redirectCount: redirectCount || '0',
          allKeys: Object.keys(sessionStorage)
        };
      } catch (e) {
        info.sessionStorage = { error: 'Cannot access sessionStorage' };
      }

      // ตรวจสอบ Session API
      try {
        const response = await fetch('/api/auth/line-session');
        const data = await response.json();
        info.sessionAPI = {
          status: response.status,
          ok: response.ok,
          data: data
        };
      } catch (e) {
        info.sessionAPI = { error: e instanceof Error ? e.message : 'Unknown error' };
      }

      // ตรวจสอบ LIFF Status - ละเอียดขึ้น
      try {
        if (typeof window !== 'undefined' && (window as any).liff) {
          const liff = (window as any).liff;
          
          // ตรวจสอบ functions ต่างๆ ที่มีอยู่
          const liffMethods = {
            init: typeof liff.init === 'function',
            isLoggedIn: typeof liff.isLoggedIn === 'function',
            isInClient: typeof liff.isInClient === 'function',
            getProfile: typeof liff.getProfile === 'function',
            getAccessToken: typeof liff.getAccessToken === 'function'
          };

          let loginStatus = null;
          let clientStatus = null;
          let profileStatus = null;
          let accessTokenStatus = null;

          try {
            loginStatus = liff.isLoggedIn ? liff.isLoggedIn() : 'Method not available';
          } catch (e) {
            loginStatus = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
          }

          try {
            clientStatus = liff.isInClient ? liff.isInClient() : 'Method not available';
          } catch (e) {
            clientStatus = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
          }

          try {
            if (liff.getProfile && loginStatus === true) {
              const profile = await liff.getProfile();
              profileStatus = profile ? 'Available' : 'Not available';
            } else {
              profileStatus = 'Cannot check (not logged in or method unavailable)';
            }
          } catch (e) {
            profileStatus = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
          }

          try {
            if (liff.getAccessToken && loginStatus === true) {
              const token = liff.getAccessToken();
              accessTokenStatus = token ? 'Available' : 'Not available';
            } else {
              accessTokenStatus = 'Cannot check (not logged in or method unavailable)';
            }
          } catch (e) {
            accessTokenStatus = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
          }

          info.liffStatus = {
            sdkAvailable: true,
            methods: liffMethods,
            isLoggedIn: loginStatus,
            isInClient: clientStatus,
            profile: profileStatus,
            accessToken: accessTokenStatus,
            initialized: 'Unknown' // จะอัพเดทด้านล่าง
          };

          // ลองตรวจสอบว่า LIFF initialized หรือไม่โดยลอง call function
          try {
            if (liff.isLoggedIn) {
              liff.isLoggedIn(); // ถ้า call ได้แปลว่า initialized
              info.liffStatus.initialized = true;
            }
          } catch (initError) {
            if (initError instanceof Error && initError.message.includes('LIFF has not been initialized')) {
              info.liffStatus.initialized = false;
            } else {
              info.liffStatus.initialized = `Error: ${initError instanceof Error ? initError.message : 'Unknown'}`;
            }
          }
        } else {
          info.liffStatus = { sdkAvailable: false, reason: 'LIFF object not found' };
        }
      } catch (e) {
        info.liffStatus = { error: e instanceof Error ? e.message : 'Unknown error' };
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Debug check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบ LIFF configuration
  useEffect(() => {
    const checkLiffConfig = async () => {
      try {
        const { getValidatedLiffId, validateLiffId } = await import('@/lib/liffUtils');
        const envLiffId = process.env.NEXT_PUBLIC_LIFF_ID;
        const { liffId, error } = getValidatedLiffId();
        
        setLiffConfig({
          envLiffId,
          validatedLiffId: liffId,
          error,
          hasEnvVar: !!envLiffId
        });
        
        if (envLiffId) {
          const validation = validateLiffId(envLiffId);
          setLiffValidation(validation);
        }
      } catch (error) {
        console.error('Failed to check LIFF config:', error);
      }
    };

    if (show) {
      checkLiffConfig();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      checkAuthStatus();
    }
  }, [show]);

  const getStatusIcon = (status: any) => {
    if (status === null || status === undefined) return <Warning color="warning" />;
    if (status.error) return <Cancel color="error" />;
    if (status.authenticated || status.available) return <CheckCircle color="success" />;
    return <Warning color="warning" />;
  };

  const getStatusColor = (status: any) => {
    if (status === null || status === undefined) return 'warning';
    if (status.error) return 'error';
    if (status.authenticated || status.available) return 'success';
    return 'warning';
  };

  if (!show) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 10,
        right: 10,
        width: 300,
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 9999,
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        p: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
          🔍 LINE Auth Debug
        </Typography>
        <Box>
          <IconButton size="small" onClick={checkAuthStatus} disabled={loading} sx={{ color: 'white' }}>
            <Refresh />
          </IconButton>
          <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ color: 'white' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Stack spacing={1}>
        {/* Quick Status */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={getStatusIcon(debugInfo.localStorage)}
            label="Storage"
            size="small"
            color={getStatusColor(debugInfo.localStorage) as any}
            variant="outlined"
          />
          <Chip
            icon={getStatusIcon(debugInfo.sessionAPI)}
            label="Session"
            size="small"
            color={getStatusColor(debugInfo.sessionAPI) as any}
            variant="outlined"
          />
          <Chip
            icon={getStatusIcon(debugInfo.liffStatus)}
            label={debugInfo.liffStatus?.sdkAvailable ? 
              `LIFF ${debugInfo.liffStatus.initialized === true ? 'Ready' : 'Not Ready'}` : 
              'No LIFF'
            }
            size="small"
            color={debugInfo.liffStatus?.sdkAvailable && debugInfo.liffStatus.initialized === true ? 'success' : 'error'}
          />
        </Box>

        <Collapse in={expanded}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* localStorage */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                📦 localStorage
              </Typography>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                {debugInfo.localStorage ? (
                  <pre>{JSON.stringify(debugInfo.localStorage, null, 2)}</pre>
                ) : (
                  <Typography variant="caption">No data</Typography>
                )}
              </Box>
            </Box>

            {/* Session API */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                🔐 Session API
              </Typography>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                {debugInfo.sessionAPI ? (
                  <pre>{JSON.stringify(debugInfo.sessionAPI, null, 2)}</pre>
                ) : (
                  <Typography variant="caption">No data</Typography>
                )}
              </Box>
            </Box>

            {/* LIFF Status */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                📱 LIFF Status
              </Typography>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                {debugInfo.liffStatus ? (
                  <pre>{JSON.stringify(debugInfo.liffStatus, null, 2)}</pre>
                ) : (
                  <Typography variant="caption">No data</Typography>
                )}
              </Box>
            </Box>

            {/* Environment */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                🌍 Environment
              </Typography>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                {debugInfo.environment ? (
                  <pre>{JSON.stringify(debugInfo.environment, null, 2)}</pre>
                ) : (
                  <Typography variant="caption">No data</Typography>
                )}
              </Box>
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  localStorage.removeItem('line_user_data');
                  localStorage.removeItem('liff_session_data');
                  sessionStorage.removeItem('menu_redirect_count');
                  checkAuthStatus();
                }}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Clear All
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={async () => {
                  try {
                    const { restoreLiffSession } = await import('@/lib/sessionUtils');
                    const result = await restoreLiffSession();
                    console.log('🧪 Session restore test:', result);
                    checkAuthStatus();
                  } catch (error) {
                    console.error('🧪 Session restore test failed:', error);
                  }
                }}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Test Restore
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={async () => {
                  try {
                    console.log('🧪 Testing LIFF re-initialization...');
                    
                    // ลองลบ LIFF object และโหลดใหม่
                    if ((window as any).liff) {
                      console.log('🗑️ Clearing existing LIFF object');
                      delete (window as any).liff;
                    }
                    
                    // โหลด LIFF SDK ใหม่
                    const script = document.createElement('script');
                    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
                    script.async = true;
                    
                    await new Promise((resolve, reject) => {
                      script.onload = resolve;
                      script.onerror = reject;
                      document.head.appendChild(script);
                    });
                    
                    console.log('✅ LIFF SDK reloaded');
                    
                    // Initialize LIFF
                    const { initializeLiff } = await import('@/lib/sessionUtils');
                    const initResult = await initializeLiff();
                    
                    if (initResult.success) {
                      console.log('✅ LIFF re-initialized successfully');
                    } else {
                      console.error('❌ LIFF re-initialization failed:', initResult.error);
                    }
                    
                    checkAuthStatus();
                  } catch (error) {
                    console.error('🧪 LIFF re-init test failed:', error);
                  }
                }}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Re-init LIFF
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Reload
              </Button>
            </Stack>

            {/* LIFF Configuration Status */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">🔧 LIFF Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Environment Variable:</Typography>
                    <Typography sx={{ 
                      fontFamily: 'monospace', 
                      bgcolor: liffConfig?.hasEnvVar ? '#e8f5e8' : '#ffe8e8',
                      color: liffConfig?.hasEnvVar ? '#2e7d32' : '#d32f2f',
                      p: 1,
                      borderRadius: 1,
                      fontSize: '0.85rem'
                    }}>
                      NEXT_PUBLIC_LIFF_ID = {liffConfig?.envLiffId || 'NOT SET'}
                    </Typography>
                  </Box>

                  {liffValidation && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Validation:</Typography>
                      <Typography sx={{ 
                        fontFamily: 'monospace', 
                        bgcolor: liffValidation.valid ? '#e8f5e8' : '#ffe8e8',
                        color: liffValidation.valid ? '#2e7d32' : '#d32f2f',
                        p: 1,
                        borderRadius: 1,
                        fontSize: '0.85rem'
                      }}>
                        {liffValidation.valid ? '✅ Valid LIFF ID format' : `❌ ${liffValidation.error}`}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Validated LIFF ID:</Typography>
                    <Typography sx={{ 
                      fontFamily: 'monospace', 
                      bgcolor: liffConfig?.validatedLiffId ? '#e8f5e8' : '#ffe8e8',
                      color: liffConfig?.validatedLiffId ? '#2e7d32' : '#d32f2f',
                      p: 1,
                      borderRadius: 1,
                      fontSize: '0.85rem'
                    }}>
                      {liffConfig?.validatedLiffId || liffConfig?.error || 'No valid LIFF ID'}
                    </Typography>
                  </Box>

                  {liffConfig?.validatedLiffId && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>LIFF URL Example:</Typography>
                      <Typography sx={{ 
                        fontFamily: 'monospace', 
                        bgcolor: '#f5f5f5',
                        p: 1,
                        borderRadius: 1,
                        fontSize: '0.8rem',
                        wordBreak: 'break-all'
                      }}>
                        https://liff.line.me/{liffConfig.validatedLiffId}?restaurant=xxx
                      </Typography>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Detailed LIFF Status */}
            {debugInfo.liffStatus && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  🚀 LIFF Detailed Status
                </Typography>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                  {debugInfo.liffStatus.sdkAvailable ? (
                    <Stack spacing={0.5}>
                      <Typography sx={{ color: debugInfo.liffStatus.initialized === true ? '#4caf50' : '#f44336' }}>
                        <strong>Initialized:</strong> {debugInfo.liffStatus.initialized === true ? '✅ Yes' : debugInfo.liffStatus.initialized === false ? '❌ No' : debugInfo.liffStatus.initialized}
                      </Typography>
                      <Typography sx={{ color: debugInfo.liffStatus.isLoggedIn === true ? '#4caf50' : '#f44336' }}>
                        <strong>Logged In:</strong> {debugInfo.liffStatus.isLoggedIn === true ? '✅ Yes' : debugInfo.liffStatus.isLoggedIn === false ? '❌ No' : debugInfo.liffStatus.isLoggedIn}
                      </Typography>
                      <Typography sx={{ color: debugInfo.liffStatus.isInClient === true ? '#4caf50' : '#ff9800' }}>
                        <strong>In LINE App:</strong> {debugInfo.liffStatus.isInClient === true ? '✅ Yes' : debugInfo.liffStatus.isInClient === false ? '⚠️ No' : debugInfo.liffStatus.isInClient}
                      </Typography>
                      <Typography sx={{ color: debugInfo.liffStatus.profile === 'Available' ? '#4caf50' : '#f44336' }}>
                        <strong>Profile:</strong> {debugInfo.liffStatus.profile}
                      </Typography>
                      <Typography sx={{ color: debugInfo.liffStatus.accessToken === 'Available' ? '#4caf50' : '#f44336' }}>
                        <strong>Access Token:</strong> {debugInfo.liffStatus.accessToken}
                      </Typography>
                      
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#ccc' }}>
                        <strong>Available Methods:</strong>
                      </Typography>
                      {Object.entries(debugInfo.liffStatus.methods || {}).map(([method, available]) => (
                        <Typography key={method} variant="caption" sx={{ fontSize: '0.7rem', color: available ? '#4caf50' : '#f44336' }}>
                          • {method}: {available ? '✅' : '❌'}
                        </Typography>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ color: '#f44336' }}>
                      ❌ LIFF SDK not available - {debugInfo.liffStatus.reason || 'Unknown reason'}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
} 