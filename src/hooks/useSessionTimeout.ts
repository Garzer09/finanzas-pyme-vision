import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export const useSessionTimeout = ({ 
  timeoutMinutes = 120, // 2 hours default
  warningMinutes = 15 // 15 minutes warning
}: UseSessionTimeoutOptions = {}) => {
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (!user) return;

    // Adjust timeout based on user role - admins get longer sessions
    const effectiveTimeoutMinutes = role === 'admin' ? 240 : timeoutMinutes; // 4 hours for admins

    console.debug('🕐 SessionTimeout: Reset timeout for', role, 'user -', effectiveTimeoutMinutes, 'minutes');

    // Set warning timeout
    warningRef.current = setTimeout(() => {
      toast({
        title: "Sesión por expirar",
        description: `Tu sesión expirará en ${warningMinutes} minutos por inactividad.`,
        duration: 10000,
      });
    }, (effectiveTimeoutMinutes - warningMinutes) * 60 * 1000);

    // Set logout timeout
    timeoutRef.current = setTimeout(async () => {
      console.debug('🕐 SessionTimeout: Session expired, signing out');
      toast({
        title: "Sesión expirada",
        description: "Tu sesión ha expirado por inactividad.",
        variant: "destructive",
      });
      
      await signOut();
      // Don't navigate to avoid interfering with auth flow
    }, effectiveTimeoutMinutes * 60 * 1000);
  }, [user, signOut, role, timeoutMinutes, warningMinutes]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timeout setup
    resetTimeout();

    return () => {
      // Cleanup
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [user, resetTimeout]);

  return {
    resetTimeout,
    getLastActivity: () => lastActivityRef.current,
    getTimeUntilExpiry: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
      return Math.max(0, remaining);
    }
  };
};