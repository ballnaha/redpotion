// App Configuration for Production/Development Mode
export interface AppConfig {
  // Authentication settings
  enforceLineApp: boolean;
  allowDesktopAccess: boolean;
  enableBypassMode: boolean;
  requireLineLogin: boolean;
  
  // Development features
  enableDebugLogs: boolean;
  enableMockUser: boolean;
  skipAuthenticationCheck: boolean;
  
  // LIFF settings
  enableLiffStrictMode: boolean;
  liffSessionTimeout: number;
  
  // UI settings
  showDebugInfo: boolean;
  enableDevTools: boolean;
}

// กำหนดค่าตาม NODE_ENV เท่านั้น
const getConfigByEnvironment = (): AppConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production Configuration
    return {
      enforceLineApp: false,
      allowDesktopAccess: true,
      enableBypassMode: false,
      requireLineLogin: true,
      enableDebugLogs: false,
      enableMockUser: false,
      skipAuthenticationCheck: false,
      enableLiffStrictMode: false,
      liffSessionTimeout: 1000,
      showDebugInfo: false,
      enableDevTools: false,
    };
  } else {
    // Development Configuration
    return {
      enforceLineApp: false,
      allowDesktopAccess: true,
      enableBypassMode: true,
      requireLineLogin: true,
      enableDebugLogs: true,
      enableMockUser: false,
      skipAuthenticationCheck: false,
      enableLiffStrictMode: false,
      liffSessionTimeout: 3000,
      showDebugInfo: true,
      enableDevTools: true,
    };
  }
};

/**
 * Get current app configuration based on NODE_ENV only
 */
export const getAppConfig = (): AppConfig => {
  const baseConfig = getConfigByEnvironment();
  
  // อนุญาตให้ override ด้วย environment variables (ถ้าจำเป็น)
  const envOverrides: Partial<AppConfig> = {};
  
  if (process.env.NEXT_PUBLIC_ENFORCE_LINE_APP !== undefined) {
    envOverrides.enforceLineApp = process.env.NEXT_PUBLIC_ENFORCE_LINE_APP === 'true';
  }
  
  if (process.env.NEXT_PUBLIC_ALLOW_DESKTOP !== undefined) {
    envOverrides.allowDesktopAccess = process.env.NEXT_PUBLIC_ALLOW_DESKTOP === 'true';
  }
  
  if (process.env.NEXT_PUBLIC_ENABLE_BYPASS !== undefined) {
    envOverrides.enableBypassMode = process.env.NEXT_PUBLIC_ENABLE_BYPASS === 'true';
  }
  
  if (process.env.NEXT_PUBLIC_DEBUG_MODE !== undefined) {
    envOverrides.enableDebugLogs = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  }
  
  if (process.env.NEXT_PUBLIC_REQUIRE_LINE_LOGIN !== undefined) {
    envOverrides.requireLineLogin = process.env.NEXT_PUBLIC_REQUIRE_LINE_LOGIN === 'true';
  }
  
  // รวมการตั้งค่า
  return {
    ...baseConfig,
    ...envOverrides,
  };
};

/**
 * Get current environment mode
 */
export const getEnvironmentMode = (): 'production' | 'development' => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

/**
 * Check if current environment is production
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if current environment is development
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};

/**
 * Utility functions for common checks
 */
export const appUtils = {
  shouldEnforceLineApp: () => getAppConfig().enforceLineApp,
  shouldAllowDesktop: () => getAppConfig().allowDesktopAccess,
  shouldEnableBypass: () => getAppConfig().enableBypassMode,
  shouldShowDebug: () => getAppConfig().enableDebugLogs,
  shouldUseMockUser: () => getAppConfig().enableMockUser,
  shouldRequireLineLogin: () => getAppConfig().requireLineLogin,
  isStrictMode: () => getAppConfig().enableLiffStrictMode,
  getSessionTimeout: () => getAppConfig().liffSessionTimeout,
}; 