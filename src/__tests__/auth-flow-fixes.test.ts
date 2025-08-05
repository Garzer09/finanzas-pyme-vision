import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPostLoginRedirect } from '@/utils/authHelpers';
import { fetchUserRole } from '@/queries/authQueries';
import { supabase } from '@/integrations/supabase/client';
import { Role } from '@/types/auth';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    }))
  }
}));

describe('Authentication Flow Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPostLoginRedirect', () => {
    it('should redirect admin users to /admin/empresas from auth page', () => {
      const result = getPostLoginRedirect(
        true, // isAuthenticated
        'admin',
        true, // hasJustLoggedIn
        '/auth',
        undefined
      );

      expect(result.shouldRedirect).toBe(true);
      expect(result.targetPath).toBe('/admin/empresas');
      expect(result.reason).toContain('Redirecting admin from /auth to dashboard');
    });

    it('should redirect viewer users to /app/mis-empresas from auth page', () => {
      const result = getPostLoginRedirect(
        true, // isAuthenticated
        'viewer',
        true, // hasJustLoggedIn
        '/auth',
        undefined
      );

      expect(result.shouldRedirect).toBe(true);
      expect(result.targetPath).toBe('/app/mis-empresas');
      expect(result.reason).toContain('Redirecting viewer from /auth to dashboard');
    });

    it('should not redirect if user is already on correct route', () => {
      const adminResult = getPostLoginRedirect(
        true,
        'admin',
        false,
        '/admin/empresas',
        undefined
      );

      expect(adminResult.shouldRedirect).toBe(false);
      expect(adminResult.reason).toContain('Already on valid admin route');

      const viewerResult = getPostLoginRedirect(
        true,
        'viewer',
        false,
        '/app/mis-empresas',
        undefined
      );

      expect(viewerResult.shouldRedirect).toBe(false);
      expect(viewerResult.reason).toContain('Already on valid viewer route');
    });

    it('should redirect admin from viewer routes to admin dashboard', () => {
      const result = getPostLoginRedirect(
        true,
        'admin',
        false,
        '/app/some-page',
        undefined
      );

      expect(result.shouldRedirect).toBe(true);
      expect(result.targetPath).toBe('/admin/empresas');
      expect(result.reason).toContain('Admin user on viewer route');
    });

    it('should redirect viewer from admin routes to viewer dashboard', () => {
      const result = getPostLoginRedirect(
        true,
        'viewer',
        false,
        '/admin/some-page',
        undefined
      );

      expect(result.shouldRedirect).toBe(true);
      expect(result.targetPath).toBe('/app/mis-empresas');
      expect(result.reason).toContain('Viewer user on admin route');
    });

    it('should not redirect if role is not resolved', () => {
      const result = getPostLoginRedirect(
        true,
        'none',
        true,
        '/auth',
        undefined
      );

      expect(result.shouldRedirect).toBe(false);
      expect(result.reason).toContain('Role not yet resolved');
    });

    it('should use saved location if valid for user role', () => {
      const adminResult = getPostLoginRedirect(
        true,
        'admin',
        true,
        '/auth',
        '/admin/settings'
      );

      expect(adminResult.shouldRedirect).toBe(true);
      expect(adminResult.targetPath).toBe('/admin/settings');
      expect(adminResult.reason).toContain('Returning to saved admin location');

      const viewerResult = getPostLoginRedirect(
        true,
        'viewer',
        true,
        '/auth',
        '/app/dashboard'
      );

      expect(viewerResult.shouldRedirect).toBe(true);
      expect(viewerResult.targetPath).toBe('/app/dashboard');
      expect(viewerResult.reason).toContain('Returning to saved viewer location');
    });

    it('should ignore invalid saved locations', () => {
      // Admin trying to go to viewer route
      const result = getPostLoginRedirect(
        true,
        'admin',
        true,
        '/auth',
        '/app/something'
      );

      expect(result.shouldRedirect).toBe(true);
      expect(result.targetPath).toBe('/admin/empresas');
      expect(result.reason).toContain('Redirecting admin from /auth to dashboard');
    });
  });

  describe('fetchUserRole with improvements', () => {
    it('should handle RPC timeout gracefully', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      const mockFrom = vi.mocked(supabase.from);
      
      // Mock RPC to never resolve (timeout)
      mockRpc.mockImplementation(() => new Promise(() => {}));
      
      // Mock table query to return viewer
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'viewer' },
              error: null
            })
          }))
        }))
      } as any);

      const result = await fetchUserRole('test-user-id');
      expect(result).toBe('viewer');
    });

    it('should handle RPC error and fallback to table query', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      const mockFrom = vi.mocked(supabase.from);
      
      // Mock RPC to return error
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' }
      });
      
      // Mock table query to return admin
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      } as any);

      const result = await fetchUserRole('test-user-id');
      expect(result).toBe('admin');
    });

    it('should default to viewer when both methods fail', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      const mockFrom = vi.mocked(supabase.from);
      
      // Mock RPC to return error
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' }
      });
      
      // Mock table query to return error
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Table query failed' }
            })
          }))
        }))
      } as any);

      const result = await fetchUserRole('test-user-id');
      expect(result).toBe('viewer');
    });

    it('should return viewer for empty userId', async () => {
      const result = await fetchUserRole('');
      expect(result).toBe('viewer');
    });

    it('should return admin when RPC succeeds', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      
      mockRpc.mockResolvedValue({
        data: 'admin',
        error: null
      });

      const result = await fetchUserRole('admin-user-id');
      expect(result).toBe('admin');
    });
  });

  describe('Redirection Loop Prevention', () => {
    it('should prevent infinite redirects on landing page', () => {
      // Simulate existing session with valid role, should redirect once
      const firstResult = getPostLoginRedirect(
        true,
        'admin',
        false, // not just logged in (existing session)
        '/',
        undefined
      );

      expect(firstResult.shouldRedirect).toBe(true);
      expect(firstResult.targetPath).toBe('/admin/empresas');

      // Once on admin page, should not redirect again
      const secondResult = getPostLoginRedirect(
        true,
        'admin',
        false,
        '/admin/empresas',
        undefined
      );

      expect(secondResult.shouldRedirect).toBe(false);
    });

    it('should handle manual navigation flag from landing page', () => {
      // Manual navigation (e.g., clicking "Get Started") should not trigger auto-redirect
      // This is handled by checking location.state?.from === 'manual' in components
      const result = getPostLoginRedirect(
        false, // not authenticated
        'none',
        false,
        '/',
        undefined
      );

      expect(result.shouldRedirect).toBe(false);
      expect(result.reason).toContain('User not authenticated');
    });
  });
});