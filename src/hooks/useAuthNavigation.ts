import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Role } from '@/types/auth';
import { getPostLoginRedirect } from '@/utils/authHelpers';

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
    if (!hasJustLoggedIn || hasNavigatedRef.current) {
      return;
    }

    // Don't navigate if on auth page (let AuthPage handle it)
    if (location.pathname === '/auth') {
      return;
    }

    // Use centralized redirection logic
    const redirectInfo = getPostLoginRedirect(
      isAuthenticated,
      role,
      hasJustLoggedIn,
      location.pathname,
      location.state?.from?.pathname
    );

    console.debug('[AUTH-NAV] Navigation check:', redirectInfo);

    if (redirectInfo.shouldRedirect && redirectInfo.targetPath) {
      console.debug(`[AUTH-NAV] ${redirectInfo.reason} → ${redirectInfo.targetPath}`);
      hasNavigatedRef.current = true;
      navigate(redirectInfo.targetPath, { replace: true });
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