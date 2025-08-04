import React from 'react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
}

export const SessionTimeoutProvider: React.FC<SessionTimeoutProviderProps> = ({ children }) => {
  // Initialize session timeout globally
  useSessionTimeout({ timeoutMinutes: 120, warningMinutes: 15 });
  
  return <>{children}</>;
};