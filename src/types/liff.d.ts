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
      sendMessages: (messages: any[]) => Promise<void>;
      openWindow: (params: { url: string; external?: boolean }) => void;
      closeWindow: () => void;
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