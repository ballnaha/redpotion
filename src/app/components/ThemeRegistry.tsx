'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NextAppDirEmotionCacheProvider } from './EmotionCache';
import liquidGlassTheme from '../theme/theme';

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={liquidGlassTheme}>
        <CssBaseline />
        <div suppressHydrationWarning>
          {children}
        </div>
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
} 