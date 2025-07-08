'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  TextField,
  Divider
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

interface LineAuthDebugProps {
  show?: boolean;
}

interface LiffScriptStatus {
  scriptsFound: number;
  scriptSources: string[];
  hasLayoutScript: boolean;
  hasManualScript: boolean;
  hasBackupScript: boolean;
  liffObjectAvailable: boolean;
  lastLoadAttempt: string | null;
  loadErrors: string[];
}

export default function LineAuthDebug({ show = false }: LineAuthDebugProps) {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [liffConfig, setLiffConfig] = useState<any>(null);
  const [scriptStatus, setScriptStatus] = useState<LiffScriptStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const checkScriptStatus = () => {
    if (typeof window === 'undefined') return null;

    const scripts = document.querySelectorAll('script[src*="liff"], script[data-liff-sdk]');
    const scriptSources = Array.from(scripts).map(script => 
      (script as HTMLScriptElement).src || 'inline'
    );

    const status: LiffScriptStatus = {
      scriptsFound: scripts.length,
      scriptSources,
      hasLayoutScript: !!document.querySelector('script[data-liff-sdk="true"]'),
      hasManualScript: !!document.querySelector('script[data-liff-sdk="manual"]'),
      hasBackupScript: !!document.querySelector('script[data-liff-sdk="manual-backup"]'),
      liffObjectAvailable: !!(window as any).liff,
      lastLoadAttempt: localStorage.getItem('liff-last-load-attempt'),
      loadErrors: JSON.parse(localStorage.getItem('liff-load-errors') || '[]')
    };

    return status;
  };

  const checkAuthStatus = async () => {
    setRefreshing(true);
    
    try {
      // ตรวจสอบ script status
      const scriptStat = checkScriptStatus();
      setScriptStatus(scriptStat);

      // ตรวจสอบ LIFF config
      const envLiffId = process.env.NEXT_PUBLIC_LIFF_ID;
      const { getValidatedLiffId } = await import('@/lib/liffUtils');
      const { liffId, error } = getValidatedLiffId();
      
      setLiffConfig({
        envLiffId,
        validatedLiffId: liffId,
        validationError: error,
        hasEnvVar: !!envLiffId,
        isValid: !!liffId
      });

      // ตรวจสอบ auth status
      const status: any = {
        liffSdk: {
          available: !!(window as any).liff,
          initialized: false,
          loggedIn: false,
          canGetProfile: false,
          hasAccessToken: false,
          version: 'unknown',
          environment: 'unknown'
        },
        session: {
          hasSession: false,
          sessionType: 'none',
          userId: null,
          userEmail: null
        },
        environment: {
          userAgent: navigator.userAgent,
          isLineApp: navigator.userAgent.includes('Line'),
          currentUrl: window.location.href,
          hasLiffParam: window.location.search.includes('liff=true'),
          timestamp: new Date().toISOString()
        }
      };

      // ตรวจสอบ LIFF SDK
      if ((window as any).liff) {
        try {
          status.liffSdk.initialized = true;
          
          if ((window as any).liff.isLoggedIn()) {
            status.liffSdk.loggedIn = true;
            
            try {
              const profile = await (window as any).liff.getProfile();
              status.liffSdk.canGetProfile = true;
              status.liffSdk.userId = profile.userId;
              status.liffSdk.displayName = profile.displayName;
            } catch (profileError) {
              console.warn('Cannot get LIFF profile:', profileError);
            }
            
            try {
              const accessToken = (window as any).liff.getAccessToken();
              status.liffSdk.hasAccessToken = !!accessToken;
            } catch (tokenError) {
              console.warn('Cannot get access token:', tokenError);
            }
          }
          
          // ตรวจสอบ version และ environment
          try {
            status.liffSdk.version = (window as any).liff.getVersion();
            status.liffSdk.environment = (window as any).liff.getOS();
            status.liffSdk.isInClient = (window as any).liff.isInClient();
          } catch (versionError) {
            console.warn('Cannot get LIFF version info:', versionError);
          }
          
                 } catch (liffError) {
           console.warn('LIFF error:', liffError);
           status.liffSdk.error = liffError instanceof Error ? liffError.message : 'Unknown LIFF error';
         }
      }

      // ตรวจสอบ NextAuth session
      try {
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData && sessionData.user) {
            status.session.hasSession = true;
            status.session.sessionType = 'nextauth';
            status.session.userId = sessionData.user.id;
            status.session.userEmail = sessionData.user.email;
            status.session.userName = sessionData.user.name;
          }
        }
      } catch (sessionError) {
        console.warn('Cannot check session:', sessionError);
      }

      setAuthStatus(status);
    } catch (error) {
      console.error('Debug check error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (show) {
      checkAuthStatus();
      
      // Auto refresh ทุก 5 วินาที
      const interval = setInterval(checkAuthStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        zIndex: 9999,
        overflow: 'auto',
        p: 2
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ color: '#FFD700', fontWeight: 600 }}>
        🔍 LINE Authentication Debug Panel
      </Typography>

      {/* Quick Actions */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={checkAuthStatus}
          disabled={refreshing}
          sx={{ bgcolor: '#1976d2' }}
        >
          {refreshing ? 'รีเฟรช...' : 'รีเฟรชข้อมูล'}
        </Button>
        
        <Button
          size="small"
          variant="outlined"
          onClick={async () => {
            try {
              console.log('🧪 Testing LIFF SDK reload...');
              
              // Clear existing LIFF
              if ((window as any).liff) {
                console.log('🗑️ Clearing existing LIFF object');
                delete (window as any).liff;
              }
              
              // Remove existing scripts
              const existingScripts = document.querySelectorAll('script[src*="liff"], script[data-liff-sdk]');
              existingScripts.forEach(script => script.remove());
              
              // Reload LIFF SDK
              const { ensureLiffSDKLoaded } = await import('@/lib/liffLoader');
              const loadResult = await ensureLiffSDKLoaded(2);
              
              console.log('🧪 LIFF SDK reload result:', loadResult);
              
              checkAuthStatus();
            } catch (error) {
              console.error('🧪 LIFF SDK reload test failed:', error);
            }
          }}
          sx={{ color: 'white', borderColor: 'white' }}
        >
          Test SDK Reload
        </Button>
        
        <Button
          size="small"
          variant="outlined"
          onClick={() => window.location.reload()}
          sx={{ color: 'white', borderColor: 'white' }}
        >
          Reload Page
        </Button>
      </Stack>

      {/* LIFF Script Status */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            📦 LIFF Script Loading Status
            {scriptStatus && (
              <Chip 
                label={`${scriptStatus.scriptsFound} scripts`} 
                color={scriptStatus.liffObjectAvailable ? 'success' : 'error'}
                size="small" 
                sx={{ ml: 2 }} 
              />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {scriptStatus && (
              <>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Scripts Found:</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {scriptStatus.scriptsFound} script(s) detected
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Script Sources:</Typography>
                  {scriptStatus.scriptSources.map((src, index) => (
                    <Typography key={index} sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.75rem',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      p: 0.5,
                      borderRadius: 1,
                      mb: 0.5
                    }}>
                      {src}
                    </Typography>
                  ))}
                </Box>
                
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip 
                    label="Layout Script" 
                    color={scriptStatus.hasLayoutScript ? 'success' : 'default'}
                    size="small"
                  />
                  <Chip 
                    label="Manual Script" 
                    color={scriptStatus.hasManualScript ? 'warning' : 'default'}
                    size="small"
                  />
                  <Chip 
                    label="Backup Script" 
                    color={scriptStatus.hasBackupScript ? 'info' : 'default'}
                    size="small"
                  />
                  <Chip 
                    label="LIFF Object" 
                    color={scriptStatus.liffObjectAvailable ? 'success' : 'error'}
                    size="small"
                  />
                </Stack>
                
                {scriptStatus.lastLoadAttempt && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Last Load Attempt:</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {scriptStatus.lastLoadAttempt}
                    </Typography>
                  </Box>
                )}
                
                {scriptStatus.loadErrors.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f44336' }}>
                      Load Errors:
                    </Typography>
                    {scriptStatus.loadErrors.map((error, index) => (
                      <Alert key={index} severity="error" sx={{ mt: 1 }}>
                        {error}
                      </Alert>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
} 