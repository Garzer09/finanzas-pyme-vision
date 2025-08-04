import { AuthState, Role } from '@/types/auth';
import { User, Session } from '@supabase/supabase-js';

/**
 * Enhanced auth utility functions for production-ready authentication
 */

/**
 * Creates a secure retry function with improved error handling
 */
export function createSecureRetry(
  originalRetry?: () => void,
  fallbackAction?: () => void
): () => void {
  return () => {
    try {
      if (originalRetry) {
        originalRetry();
      } else if (fallbackAction) {
        fallbackAction();
      } else {
        // Graceful fallback - navigate to login instead of hard reload
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Auth retry failed:', error);
      // Try fallback action first, then last resort
      try {
        if (fallbackAction) {
          fallbackAction();
        } else {
          window.location.href = '/login';
        }
      } catch {
        // Last resort fallback
        window.location.href = '/login';
      }
    }
  };
}

/**
 * Enhanced permission check with detailed logging for debugging
 */
export function checkRoutePermissions(
  authState: AuthState,
  currentPath: string,
  requiredRole?: Role
): {
  canAccess: boolean;
  reason: string;
  suggestedAction: 'login' | 'home' | 'wait' | 'none';
} {
  // Must be authenticated
  if (authState.status !== 'authenticated') {
    return {
      canAccess: false,
      reason: 'User not authenticated',
      suggestedAction: 'login'
    };
  }

  // Admin routes require admin role
  if (currentPath.startsWith('/admin/') && authState.role !== 'admin') {
    return {
      canAccess: false,
      reason: 'Admin role required for admin routes',
      suggestedAction: 'home'
    };
  }

  // If specific role is required
  if (requiredRole && authState.role !== requiredRole) {
    return {
      canAccess: false,
      reason: `Role '${requiredRole}' required, user has '${authState.role}'`,
      suggestedAction: 'home'
    };
  }

  return {
    canAccess: true,
    reason: 'Access granted',
    suggestedAction: 'none'
  };
}

/**
 * Determines the appropriate redirect path after authentication
 */
export function getPostAuthRedirect(
  authState: AuthState,
  currentPath: string,
  savedLocation?: string
): string | null {
  if (authState.status !== 'authenticated') {
    return null;
  }

  // If there's a saved location, use it (unless it's a logout or login page)
  if (savedLocation && !savedLocation.includes('/login') && !savedLocation.includes('/logout')) {
    return savedLocation;
  }

  // Don't redirect if already on a valid protected route
  if (currentPath.startsWith('/app/') || 
      (currentPath.startsWith('/admin/') && authState.role === 'admin')) {
    return null;
  }

  // Navigate based on role
  return authState.role === 'admin' ? '/admin/empresas' : '/app/mis-empresas';
}

/**
 * Enhanced session validation with recovery capabilities
 */
export function validateSession(user: User | null, session: Session | null): {
  isValid: boolean;
  needsRefresh: boolean;
  reason: string;
} {
  if (!user || !session) {
    return {
      isValid: false,
      needsRefresh: false,
      reason: 'No user or session found'
    };
  }

  const now = Date.now() / 1000; // Current time in seconds
  const expiresAt = session.expires_at;

  if (!expiresAt) {
    return {
      isValid: false,
      needsRefresh: false,
      reason: 'Session has no expiry information'
    };
  }

  // Check if session is expired
  if (now >= expiresAt) {
    return {
      isValid: false,
      needsRefresh: true,
      reason: 'Session has expired'
    };
  }

  // Check if session expires soon (within 5 minutes)
  const fiveMinutes = 5 * 60;
  if ((expiresAt - now) < fiveMinutes) {
    return {
      isValid: true,
      needsRefresh: true,
      reason: 'Session expires soon, refresh recommended'
    };
  }

  return {
    isValid: true,
    needsRefresh: false,
    reason: 'Session is valid'
  };
}

/**
 * Safe navigation function that handles edge cases
 */
export function safeNavigate(
  path: string,
  navigate: (path: string, options?: any) => void,
  options: { replace?: boolean; state?: any } = {}
): void {
  try {
    // Validate path
    if (!path || typeof path !== 'string') {
      console.error('Invalid navigation path:', path);
      navigate('/', { replace: true });
      return;
    }

    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    navigate(normalizedPath, {
      replace: options.replace ?? false,
      state: options.state
    });
  } catch (error) {
    console.error('Navigation failed:', error);
    // Fallback navigation
    navigate('/', { replace: true });
  }
}

/**
 * Format auth errors for user-friendly display
 */
export function formatAuthError(error: string | Error): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Common error mappings
  const errorMappings: Record<string, string> = {
    'Invalid email or password': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Email no confirmado. Por favor revisa tu bandeja de entrada',
    'Too many requests': 'Demasiados intentos. Por favor espera unos minutos',
    'Network error': 'Error de conexión. Por favor revisa tu internet',
    'Session expired': 'Tu sesión ha expirado. Por favor inicia sesión nuevamente'
  };

  return errorMappings[errorMessage] || 'Ha ocurrido un error inesperado';
}

/**
 * Debounce function for auth operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Create a session recovery function with exponential backoff
 */
export function createSessionRecovery(
  refreshSession: () => Promise<void>,
  maxAttempts: number = 3
) {
  let attempts = 0;
  
  const recover = async (): Promise<boolean> => {
    if (attempts >= maxAttempts) {
      return false;
    }
    
    try {
      attempts++;
      await refreshSession();
      attempts = 0; // Reset on success
      return true;
    } catch (error) {
      console.warn(`Session recovery attempt ${attempts} failed:`, error);
      
      if (attempts < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempts - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return recover();
      }
      
      return false;
    }
  };
  
  return recover;
}