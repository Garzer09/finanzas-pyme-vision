import { describe, it, expect } from 'vitest';
import { shouldNavigateAfterAuth, canAccessProtectedRoute, isAuthLoading, getAuthError } from '@/types/auth';
import type { AuthState } from '@/types/auth';

describe('Auth State Machine Utilities', () => {
  describe('shouldNavigateAfterAuth', () => {
    it('should return null for unauthenticated state', () => {
      const authState: AuthState = { status: 'unauthenticated' };
      const result = shouldNavigateAfterAuth(authState, '/auth');
      expect(result).toBeNull();
    });

    it('should return target path for authenticated admin on auth page', () => {
      const authState: AuthState = {
        status: 'authenticated',
        user: {} as any,
        session: {} as any,
        role: 'admin'
      };
      const result = shouldNavigateAfterAuth(authState, '/auth');
      expect(result).toBe('/admin/empresas');
    });

    it('should return target path for authenticated viewer on auth page', () => {
      const authState: AuthState = {
        status: 'authenticated',
        user: {} as any,
        session: {} as any,
        role: 'viewer'
      };
      const result = shouldNavigateAfterAuth(authState, '/auth');
      expect(result).toBe('/app/mis-empresas');
    });

    it('should return null if already on protected route', () => {
      const authState: AuthState = {
        status: 'authenticated',
        user: {} as any,
        session: {} as any,
        role: 'admin'
      };
      const result = shouldNavigateAfterAuth(authState, '/admin/empresas');
      expect(result).toBeNull();
    });

    it('should return null for authenticated user with no role', () => {
      const authState: AuthState = {
        status: 'authenticated',
        user: {} as any,
        session: {} as any,
        role: 'none'
      };
      const result = shouldNavigateAfterAuth(authState, '/auth');
      expect(result).toBeNull();
    });
  });

  describe('canAccessProtectedRoute', () => {
    it('should return true for authenticated state', () => {
      const authState: AuthState = {
        status: 'authenticated',
        user: {} as any,
        session: {} as any,
        role: 'viewer'
      };
      expect(canAccessProtectedRoute(authState)).toBe(true);
    });

    it('should return false for unauthenticated state', () => {
      const authState: AuthState = { status: 'unauthenticated' };
      expect(canAccessProtectedRoute(authState)).toBe(false);
    });

    it('should return false for error state', () => {
      const authState: AuthState = {
        status: 'error',
        error: 'Network error',
        retry: () => {}
      };
      expect(canAccessProtectedRoute(authState)).toBe(false);
    });

    it('should return false for initializing state', () => {
      const authState: AuthState = { status: 'initializing' };
      expect(canAccessProtectedRoute(authState)).toBe(false);
    });
  });

  describe('isAuthLoading', () => {
    it('should return true for initializing state', () => {
      const authState: AuthState = { status: 'initializing' };
      expect(isAuthLoading(authState)).toBe(true);
    });

    it('should return true for authenticating state', () => {
      const authState: AuthState = { status: 'authenticating' };
      expect(isAuthLoading(authState)).toBe(true);
    });

    it('should return false for authenticated state', () => {
      const authState: AuthState = {
        status: 'authenticated',
        user: {} as any,
        session: {} as any,
        role: 'viewer'
      };
      expect(isAuthLoading(authState)).toBe(false);
    });

    it('should return false for unauthenticated state', () => {
      const authState: AuthState = { status: 'unauthenticated' };
      expect(isAuthLoading(authState)).toBe(false);
    });

    it('should return false for error state', () => {
      const authState: AuthState = {
        status: 'error',
        error: 'Network error',
        retry: () => {}
      };
      expect(isAuthLoading(authState)).toBe(false);
    });
  });

  describe('getAuthError', () => {
    it('should return error message for error state', () => {
      const authState: AuthState = {
        status: 'error',
        error: 'Network error',
        retry: () => {}
      };
      expect(getAuthError(authState)).toBe('Network error');
    });

    it('should return null for non-error states', () => {
      const authState: AuthState = { status: 'unauthenticated' };
      expect(getAuthError(authState)).toBeNull();
    });

    it('should return null for authenticated state', () => {
      const authState: AuthState = {
        status: 'authenticated',
        user: {} as any,
        session: {} as any,
        role: 'viewer'
      };
      expect(getAuthError(authState)).toBeNull();
    });
  });
});