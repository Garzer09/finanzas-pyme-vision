import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Role } from '@/types/auth';

interface UseAuthNavigationProps {
  isAuthenticated: boolean;
  role: Role;
  hasJustLoggedIn: boolean;
}

export const useAuthNavigation = ({ 
  isAuthenticated, 
  role, 
  hasJustLoggedIn 
}: UseAuthNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasNavigatedRef = useRef(false);
  
  useEffect(() => {
    // Only navigate if user just logged in and we haven't navigated yet
    if (!isAuthenticated || !hasJustLoggedIn || hasNavigatedRef.current) {
      return;
    }

    // Don't navigate if already on a protected route
    if (location.pathname.startsWith('/app/') || location.pathname.startsWith('/admin/')) {
      hasNavigatedRef.current = true;
      return;
    }

    // Get return path from location state if coming from protected route
    const returnTo = location.state?.from?.pathname;
    
    // Determine target path based on role
    let targetPath: string;
    
    if (role === 'admin') {
      targetPath = returnTo && returnTo.startsWith('/admin/') ? returnTo : '/admin/empresas';
    } else if (role === 'viewer') {
      targetPath = returnTo && returnTo.startsWith('/app/') ? returnTo : '/app/mis-empresas';
    } else {
      // Role still resolving, don't navigate yet
      return;
    }

    // Only navigate if not already on auth page or if we have a specific target
    if (location.pathname === '/auth' || returnTo) {
      console.debug('[AUTH-NAV] Navigating to:', targetPath, { role, returnTo });
      hasNavigatedRef.current = true;
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, role, hasJustLoggedIn, navigate, location]);

  // Reset navigation flag when hasJustLoggedIn changes to false
  useEffect(() => {
    if (!hasJustLoggedIn) {
      hasNavigatedRef.current = false;
    }
  }, [hasJustLoggedIn]);

  return {
    shouldNavigate: isAuthenticated && hasJustLoggedIn && !hasNavigatedRef.current,
    targetPath: role === 'admin' ? '/admin/empresas' : '/app/mis-empresas'
  };
};