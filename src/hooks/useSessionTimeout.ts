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
  const { user, role, signOut } = useAuth();
  
  // Extend timeout for admin users (8 hours vs 2 hours)
  const effectiveTimeoutMinutes = role === 'admin' ? 480 : timeoutMinutes;
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
      toast({
        title: "Sesión expirada",
        description: "Tu sesión ha expirado por inactividad. Redirigiendo...",
        variant: "destructive",
        duration: 5000,
      });
      
      try {
        await signOut('/auth');
      } catch (error) {
        console.error('Error during timeout signout:', error);
        // Force navigation even if signOut fails
        window.location.href = '/auth';
      }
    }, effectiveTimeoutMinutes * 60 * 1000);
  }, [user, role, signOut, navigate, effectiveTimeoutMinutes, warningMinutes]);

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
      const remaining = (effectiveTimeoutMinutes * 60 * 1000) - elapsed;
      return Math.max(0, remaining);
    }
  };
};