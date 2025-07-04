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

// Default Production Configuration
const PRODUCTION_CONFIG: AppConfig = {
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

// Default Development Configuration
const DEVELOPMENT_CONFIG: AppConfig = {
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

// Custom Configuration Override
const CUSTOM_CONFIG: Partial<AppConfig> = {
  // คุณสามารถ override ค่าต่างๆ ได้ที่นี่
  // ตอนนี้ปล่อยว่างไว้ ใช้ default config
};

/**
 * Get current app configuration based on environment
 */
export const getAppConfig = (): AppConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseConfig = isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
  
  // Check for environment variable overrides
  const envOverrides: Partial<AppConfig> = {};
  
  // Allow environment variable overrides
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
  
  // Merge configurations
  return {
    ...baseConfig,
    ...CUSTOM_CONFIG,
    ...envOverrides,
  };
};

/**
 * Force Production Mode (for testing production behavior in development)
 */
export const getProductionConfig = (): AppConfig => {
  return {
    ...PRODUCTION_CONFIG,
    ...CUSTOM_CONFIG,
  };
};

/**
 * Force Development Mode (for testing development behavior)
 */
export const getDevelopmentConfig = (): AppConfig => {
  return {
    ...DEVELOPMENT_CONFIG,
    ...CUSTOM_CONFIG,
  };
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