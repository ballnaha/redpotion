declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>;
      ready: Promise<void>;
      isLoggedIn: () => boolean;
      login: () => void;
      logout: () => void;
      getProfile: () => Promise<{
        userId: string;
        displayName: string;
        pictureUrl?: string;
        statusMessage?: string;
      }>;
      getAccessToken: () => string;
      sendMessages: (messages: unknown[]) => Promise<void>;
      openWindow: (params: { url: string; external?: boolean }) => void;
      closeWindow: () => void;
      getOS: () => 'ios' | 'android' | 'web';
      getLanguage: () => string;
      getVersion: () => string;
      getLineVersion: () => string;
      isInClient: () => boolean;
      isApiAvailable: (apiName: string) => boolean;
      getContext: () => {
        type: string;
        viewType: string;
        userId?: string;
        utouId?: string;
        roomId?: string;
        groupId?: string;
      };
    };
  }
}

export {}; 