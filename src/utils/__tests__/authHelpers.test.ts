import { describe, it, expect, vi } from 'vitest';
import { 
  createSecureRetry,
  checkRoutePermissions,
  getPostAuthRedirect,
  validateSession,
  formatAuthError,
  createSessionRecovery
} from '@/utils/authHelpers';
import { AuthState } from '@/types/auth';

describe('Auth Helpers', () => {
  describe('createSecureRetry', () => {
    it('should use original retry when available', () => {
      const originalRetry = vi.fn();
      const secureRetry = createSecureRetry(originalRetry);
      
      secureRetry();
      
      expect(originalRetry).toHaveBeenCalled();
    });

    it('should use fallback when original retry fails', () => {
      const originalRetry = vi.fn(() => {
        throw new Error('Retry failed');
      });
      const fallback = vi.fn();
      
      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const secureRetry = createSecureRetry(originalRetry, fallback);
      
      secureRetry();
      
      expect(fallback).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should navigate to login as last resort', () => {
      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });

      const secureRetry = createSecureRetry();
      secureRetry();
      
      expect(window.location.href).toBe('/login');
    });
  });

  describe('checkRoutePermissions', () => {
    const mockAuthenticatedState: AuthState = {
      status: 'authenticated',
      user: { id: 'user1' } as any,
      session: {} as any,
      role: 'viewer'
    };

    it('should deny access for unauthenticated users', () => {
      const result = checkRoutePermissions(
        { status: 'unauthenticated' },
        '/app/dashboard'
      );
      
      expect(result.canAccess).toBe(false);
      expect(result.suggestedAction).toBe('login');
    });

    it('should deny admin routes for non-admin users', () => {
      const result = checkRoutePermissions(
        mockAuthenticatedState,
        '/admin/users'
      );
      
      expect(result.canAccess).toBe(false);
      expect(result.suggestedAction).toBe('home');
    });

    it('should allow admin routes for admin users', () => {
      const adminState: AuthState = {
        ...mockAuthenticatedState,
        role: 'admin'
      };
      
      const result = checkRoutePermissions(
        adminState,
        '/admin/users'
      );
      
      expect(result.canAccess).toBe(true);
      expect(result.suggestedAction).toBe('none');
    });

    it('should check specific role requirements', () => {
      const result = checkRoutePermissions(
        mockAuthenticatedState,
        '/app/dashboard',
        'admin'
      );
      
      expect(result.canAccess).toBe(false);
      expect(result.reason).toContain('admin');
    });
  });

  describe('getPostAuthRedirect', () => {
    const mockAuthenticatedState: AuthState = {
      status: 'authenticated',
      user: { id: 'user1' } as any,
      session: {} as any,
      role: 'viewer'
    };

    it('should return null for unauthenticated users', () => {
      const result = getPostAuthRedirect(
        { status: 'unauthenticated' },
        '/login'
      );
      
      expect(result).toBeNull();
    });

    it('should use saved location when available', () => {
      const result = getPostAuthRedirect(
        mockAuthenticatedState,
        '/login',
        '/app/dashboard'
      );
      
      expect(result).toBe('/app/dashboard');
    });

    it('should not redirect if already on valid route', () => {
      const result = getPostAuthRedirect(
        mockAuthenticatedState,
        '/app/dashboard'
      );
      
      expect(result).toBeNull();
    });

    it('should redirect admin users to admin area', () => {
      const adminState: AuthState = {
        ...mockAuthenticatedState,
        role: 'admin'
      };
      
      const result = getPostAuthRedirect(
        adminState,
        '/login'
      );
      
      expect(result).toBe('/admin/empresas');
    });

    it('should redirect viewer users to user area', () => {
      const result = getPostAuthRedirect(
        mockAuthenticatedState,
        '/login'
      );
      
      expect(result).toBe('/app/mis-empresas');
    });
  });

  describe('validateSession', () => {
    it('should return invalid for null user or session', () => {
      const result = validateSession(null, null);
      
      expect(result.isValid).toBe(false);
      expect(result.needsRefresh).toBe(false);
    });

    it('should return invalid for expired session', () => {
      const expiredSession = {
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      } as any;
      
      const result = validateSession({ id: 'user1' } as any, expiredSession);
      
      expect(result.isValid).toBe(false);
      expect(result.needsRefresh).toBe(true);
    });

    it('should return valid but needs refresh for soon-to-expire session', () => {
      const soonToExpireSession = {
        expires_at: Math.floor(Date.now() / 1000) + 120 // 2 minutes from now
      } as any;
      
      const result = validateSession({ id: 'user1' } as any, soonToExpireSession);
      
      expect(result.isValid).toBe(true);
      expect(result.needsRefresh).toBe(true);
    });

    it('should return valid for healthy session', () => {
      const healthySession = {
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      } as any;
      
      const result = validateSession({ id: 'user1' } as any, healthySession);
      
      expect(result.isValid).toBe(true);
      expect(result.needsRefresh).toBe(false);
    });
  });

  describe('formatAuthError', () => {
    it('should format known errors in Spanish', () => {
      const error = formatAuthError('Invalid email or password');
      expect(error).toBe('Email o contraseña incorrectos');
    });

    it('should handle Error objects', () => {
      const error = formatAuthError(new Error('Too many requests'));
      expect(error).toBe('Demasiados intentos. Por favor espera unos minutos');
    });

    it('should return generic message for unknown errors', () => {
      const error = formatAuthError('Unknown error');
      expect(error).toBe('Ha ocurrido un error inesperado');
    });
  });

  describe('createSessionRecovery', () => {
    it('should succeed on first attempt', async () => {
      const mockRefresh = vi.fn().mockResolvedValue(undefined);
      const recovery = createSessionRecovery(mockRefresh);
      
      const result = await recovery();
      
      expect(result).toBe(true);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const mockRefresh = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);
      
      const recovery = createSessionRecovery(mockRefresh, 3);
      
      const result = await recovery();
      
      expect(result).toBe(true);
      expect(mockRefresh).toHaveBeenCalledTimes(2);
    });

    it('should fail after max attempts', async () => {
      const mockRefresh = vi.fn().mockRejectedValue(new Error('Always fails'));
      const recovery = createSessionRecovery(mockRefresh, 2);
      
      const result = await recovery();
      
      expect(result).toBe(false);
      expect(mockRefresh).toHaveBeenCalledTimes(2);
    });
  });
});