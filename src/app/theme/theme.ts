'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Minimal White Design with Liquid Glass
const colors = {
  primary: {
    main: '#10b981', // Green from the image
    light: '#34d399',
    dark: '#059669',
  },
  secondary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
  },
  background: {
    default: '#ffffff',
    paper: 'rgba(255, 255, 255, 0.8)',
    glass: 'rgba(255, 255, 255, 0.25)',
    glassSecondary: 'rgba(255, 255, 255, 0.15)',
  },
  surface: {
    primary: 'rgba(255, 255, 255, 0.9)',
    secondary: 'rgba(248, 250, 252, 0.8)',
    tertiary: 'rgba(241, 245, 249, 0.6)',
  },
  accent: {
    green: '#10b981',
    orange: '#f59e0b',
    purple: '#8b5cf6',
    pink: '#ec4899',
  },
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    light: '#9ca3af',
  }
};

// Glass morphism effects
const glassMorphism = {
  backdrop: 'blur(20px) saturate(180%)',
  backdropStrong: 'blur(40px) saturate(200%)',
  shadow: {
    soft: '0 2px 8px rgba(16, 185, 129, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06)',
    medium: '0 4px 16px rgba(16, 185, 129, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
    strong: '0 8px 32px rgba(16, 185, 129, 0.16), 0 4px 16px rgba(0, 0, 0, 0.12)',
    glass: '0 8px 32px rgba(16, 185, 129, 0.1), 0 4px 16px rgba(255, 255, 255, 0.15)',
    elevation: '0 12px 40px rgba(16, 185, 129, 0.2), 0 8px 32px rgba(0, 0, 0, 0.15)',
  },
  border: 'rgba(255, 255, 255, 0.25)',
  borderStrong: 'rgba(255, 255, 255, 0.4)',
  borderAccent: 'rgba(16, 185, 129, 0.3)',
};

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
  },
  typography: {
    fontFamily: 'var(--font-prompt)',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: colors.text.primary,
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      '@media (min-width:600px)': {
        fontSize: '2.75rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: colors.text.primary,
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
      '@media (min-width:600px)': {
        fontSize: '2.25rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: colors.text.primary,
      textShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      '@media (min-width:600px)': {
        fontSize: '1.875rem',
      },
    },
    h4: {
      fontSize: '1.375rem',
      fontWeight: 600,
      color: colors.text.primary,
      textShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      '@media (min-width:600px)': {
        fontSize: '1.625rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: colors.text.primary,
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
      '@media (min-width:600px)': {
        fontSize: '1.375rem',
      },
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: colors.text.primary,
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      '@media (min-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      color: colors.text.primary,
      fontWeight: 400,
      '@media (min-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: colors.text.secondary,
      fontWeight: 400,
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: colors.text.secondary,
      fontWeight: 500,
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    glassMorphism.shadow.soft,
    glassMorphism.shadow.soft,
    glassMorphism.shadow.medium,
    glassMorphism.shadow.medium,
    glassMorphism.shadow.medium,
    glassMorphism.shadow.strong,
    glassMorphism.shadow.strong,
    glassMorphism.shadow.strong,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
    glassMorphism.shadow.glass,
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#ffffff',
          minHeight: '100vh',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input::placeholder': {
            color: '#9ca3af',
            opacity: 0.7,
          },
          '& .MuiInputBase-input::-webkit-input-placeholder': {
            color: '#9ca3af',
            opacity: 0.7,
          },
          '& .MuiInputBase-input::-moz-placeholder': {
            color: '#9ca3af',
            opacity: 0.7,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          '&::placeholder': {
            color: '#9ca3af',
            opacity: 0.7,
          },
          '&::-webkit-input-placeholder': {
            color: '#9ca3af',
            opacity: 0.7,
          },
          '&::-moz-placeholder': {
            color: '#9ca3af',
            opacity: 0.7,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          backdropFilter: glassMorphism.backdrop,
          WebkitBackdropFilter: glassMorphism.backdrop,
          border: `1px solid ${glassMorphism.border}`,
          borderRadius: 16,
          boxShadow: glassMorphism.shadow.glass,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.glass,
          backdropFilter: glassMorphism.backdropStrong,
          WebkitBackdropFilter: glassMorphism.backdropStrong,
          border: `1px solid ${glassMorphism.border}`,
          borderRadius: 20,
          boxShadow: glassMorphism.shadow.soft,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: glassMorphism.shadow.elevation,
            backgroundColor: colors.background.paper,
            borderColor: glassMorphism.borderAccent,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '8px 16px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          backgroundColor: colors.primary.main,
          color: '#ffffff',
          boxShadow: glassMorphism.shadow.medium,
          '&:hover': {
            backgroundColor: colors.primary.dark,
            boxShadow: glassMorphism.shadow.strong,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: glassMorphism.border,
          backgroundColor: colors.background.glass,
          backdropFilter: glassMorphism.backdrop,
          WebkitBackdropFilter: glassMorphism.backdrop,
          '&:hover': {
            backgroundColor: colors.background.paper,
            borderColor: colors.primary.main,
          },
        },
      },
    },
  },
};

const theme = createTheme(themeOptions);

// Extend theme with custom properties
declare module '@mui/material/styles' {
  interface Palette {
    glass: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    accent: {
      green: string;
      orange: string;
      purple: string;
      pink: string;
    };
  }

  interface PaletteOptions {
    glass?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
    };
    accent?: {
      green?: string;
      orange?: string;
      purple?: string;
      pink?: string;
    };
  }
}

export default theme; 