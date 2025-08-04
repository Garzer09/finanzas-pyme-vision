import { describe, it, expect } from 'vitest';
import { 
  createSecureRetry,
  checkRoutePermissions,
  getPostAuthRedirect,
  validateSession,
  formatAuthError
} from '@/utils/authHelpers';
import { AuthState } from '@/types/auth';

describe('Optimized Authentication Integration Tests', () => {
  describe('Production-Ready Authentication Flow', () => {
    it('should handle complete authentication cycle gracefully', () => {
      // Test the complete auth flow from unauthenticated to authenticated
      const unauthenticatedState: AuthState = { status: 'unauthenticated' };
      const authenticatingState: AuthState = { status: 'authenticating' };
      const authenticatedState: AuthState = {
        status: 'authenticated',
        user: { id: 'user1', email: 'test@example.com' } as any,
        session: { expires_at: Math.floor(Date.now() / 1000) + 3600 } as any,
        role: 'viewer'
      };

      // Verify initial state handling
      expect(checkRoutePermissions(unauthenticatedState, '/app/dashboard').canAccess).toBe(false);
      expect(checkRoutePermissions(unauthenticatedState, '/app/dashboard').suggestedAction).toBe('login');

      // Verify authenticated state handling
      expect(checkRoutePermissions(authenticatedState, '/app/dashboard').canAccess).toBe(true);
      expect(checkRoutePermissions(authenticatedState, '/app/dashboard').suggestedAction).toBe('none');

      // Verify role-based access
      expect(checkRoutePermissions(authenticatedState, '/admin/users').canAccess).toBe(false);
      expect(checkRoutePermissions(authenticatedState, '/admin/users').suggestedAction).toBe('home');
    });

    it('should handle session validation and recovery', () => {
      const validSession = {
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      } as any;

      const expiredSession = {
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      } as any;

      const expiringSession = {
        expires_at: Math.floor(Date.now() / 1000) + 120 // 2 minutes from now
      } as any;

      const user = { id: 'user1' } as any;

      // Valid session
      const validResult = validateSession(user, validSession);
      expect(validResult.isValid).toBe(true);
      expect(validResult.needsRefresh).toBe(false);

      // Expired session
      const expiredResult = validateSession(user, expiredSession);
      expect(expiredResult.isValid).toBe(false);
      expect(expiredResult.needsRefresh).toBe(true);

      // Expiring session
      const expiringResult = validateSession(user, expiringSession);
      expect(expiringResult.isValid).toBe(true);
      expect(expiringResult.needsRefresh).toBe(true);
    });

    it('should provide secure retry mechanisms', () => {
      let originalRetryCalled = false;
      let fallbackCalled = false;

      const originalRetry = () => { originalRetryCalled = true; };
      const fallback = () => { fallbackCalled = true; };

      // Test successful retry
      const secureRetry1 = createSecureRetry(originalRetry);
      secureRetry1();
      expect(originalRetryCalled).toBe(true);

      // Test fallback on error
      const failingRetry = () => { throw new Error('Retry failed'); };
      const secureRetry2 = createSecureRetry(failingRetry, fallback);
      secureRetry2();
      expect(fallbackCalled).toBe(true);
    });

    it('should provide user-friendly error messages in Spanish', () => {
      const errorMappings = [
        { input: 'Invalid email or password', expected: 'Email o contraseña incorrectos' },
        { input: 'Email not confirmed', expected: 'Email no confirmado. Por favor revisa tu bandeja de entrada' },
        { input: 'Too many requests', expected: 'Demasiados intentos. Por favor espera unos minutos' },
        { input: 'Network error', expected: 'Error de conexión. Por favor revisa tu internet' },
        { input: 'Session expired', expected: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente' },
        { input: 'Unknown error', expected: 'Ha ocurrido un error inesperado' }
      ];

      errorMappings.forEach(({ input, expected }) => {
        expect(formatAuthError(input)).toBe(expected);
      });

      // Test with Error object
      expect(formatAuthError(new Error('Network error'))).toBe('Error de conexión. Por favor revisa tu internet');
    });

    it('should handle post-authentication redirects correctly', () => {
      const viewerState: AuthState = {
        status: 'authenticated',
        user: { id: 'user1' } as any,
        session: {} as any,
        role: 'viewer'
      };

      const adminState: AuthState = {
        status: 'authenticated',
        user: { id: 'admin1' } as any,
        session: {} as any,
        role: 'admin'
      };

      // Test viewer redirect
      expect(getPostAuthRedirect(viewerState, '/login')).toBe('/app/mis-empresas');

      // Test admin redirect
      expect(getPostAuthRedirect(adminState, '/login')).toBe('/admin/empresas');

      // Test no redirect when already on valid route
      expect(getPostAuthRedirect(viewerState, '/app/dashboard')).toBeNull();
      expect(getPostAuthRedirect(adminState, '/admin/users')).toBeNull();

      // Test saved location preference
      expect(getPostAuthRedirect(viewerState, '/login', '/app/specific-page')).toBe('/app/specific-page');
    });

    it('should enforce role-based access control comprehensively', () => {
      const viewerState: AuthState = {
        status: 'authenticated',
        user: { id: 'user1' } as any,
        session: {} as any,
        role: 'viewer'
      };

      const adminState: AuthState = {
        status: 'authenticated',
        user: { id: 'admin1' } as any,
        session: {} as any,
        role: 'admin'
      };

      // Viewer access tests
      expect(checkRoutePermissions(viewerState, '/app/dashboard').canAccess).toBe(true);
      expect(checkRoutePermissions(viewerState, '/app/reports').canAccess).toBe(true);
      expect(checkRoutePermissions(viewerState, '/admin/users').canAccess).toBe(false);
      expect(checkRoutePermissions(viewerState, '/admin/settings').canAccess).toBe(false);

      // Admin access tests
      expect(checkRoutePermissions(adminState, '/app/dashboard').canAccess).toBe(true);
      expect(checkRoutePermissions(adminState, '/app/reports').canAccess).toBe(true);
      expect(checkRoutePermissions(adminState, '/admin/users').canAccess).toBe(true);
      expect(checkRoutePermissions(adminState, '/admin/settings').canAccess).toBe(true);

      // Specific role requirement tests
      expect(checkRoutePermissions(viewerState, '/any/path', 'admin').canAccess).toBe(false);
      expect(checkRoutePermissions(adminState, '/any/path', 'admin').canAccess).toBe(true);
      expect(checkRoutePermissions(viewerState, '/any/path', 'viewer').canAccess).toBe(true);
    });

    it('should maintain security and usability standards', () => {
      // Test that all critical paths have proper security
      const unauthenticatedState: AuthState = { status: 'unauthenticated' };
      
      const criticalPaths = [
        '/admin/users',
        '/admin/settings',
        '/admin/empresas',
        '/app/dashboard',
        '/app/reports',
        '/app/settings'
      ];

      criticalPaths.forEach(path => {
        const result = checkRoutePermissions(unauthenticatedState, path);
        expect(result.canAccess).toBe(false);
        expect(result.suggestedAction).toBe('login');
        expect(result.reason).toBe('User not authenticated');
      });

      // Test that error messages are user-friendly and actionable
      const commonErrors = [
        'Invalid email or password',
        'Network error',
        'Session expired'
      ];

      commonErrors.forEach(error => {
        const formatted = formatAuthError(error);
        expect(formatted).not.toContain('Error:');
        expect(formatted).not.toContain('error');
        expect(formatted.length).toBeGreaterThan(10); // Meaningful message
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle edge cases gracefully', () => {
      // Null/undefined handling
      expect(validateSession(null, null).isValid).toBe(false);
      expect(checkRoutePermissions({ status: 'unauthenticated' }, '').canAccess).toBe(false);
      expect(formatAuthError('')).toBe('Ha ocurrido un error inesperado');

      // Invalid session data
      const invalidSession = { expires_at: null } as any;
      expect(validateSession({ id: 'user1' } as any, invalidSession).isValid).toBe(false);

      // Empty paths
      expect(checkRoutePermissions({ status: 'unauthenticated' }, '/').canAccess).toBe(false);
    });

    it('should provide consistent state management', () => {
      const states: AuthState[] = [
        { status: 'initializing' },
        { status: 'unauthenticated' },
        { status: 'authenticating' },
        { 
          status: 'authenticated', 
          user: { id: 'user1' } as any, 
          session: {} as any, 
          role: 'viewer' 
        },
        { 
          status: 'error', 
          error: 'Test error', 
          retry: () => {} 
        }
      ];

      states.forEach(state => {
        // All states should be processable
        expect(() => checkRoutePermissions(state, '/test')).not.toThrow();
        expect(() => getPostAuthRedirect(state, '/test')).not.toThrow();
      });
    });
  });
});