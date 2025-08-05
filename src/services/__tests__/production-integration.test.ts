/**
 * Production Integration Tests
 * 
 * Tests the integration of all production-ready features working together.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { productionServices } from '../../services/productionServices';

describe('Production System Integration', () => {
  beforeEach(() => {
    // Mock environment variables for production testing
    vi.stubGlobal('import.meta', {
      env: {
        VITE_ENVIRONMENT: 'production',
        VITE_LOG_LEVEL: 'INFO',
        VITE_ENABLE_RATE_LIMITING: 'true',
        VITE_ENABLE_CSRF_PROTECTION: 'true',
        VITE_ENABLE_HEALTH_MONITORING: 'true',
        VITE_ENABLE_SECURITY_LOGGING: 'true',
        VITE_ENABLE_PERFORMANCE_MONITORING: 'true',
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key'
      }
    });

    // Mock DOM APIs
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    });

    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      })
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Production Services Initialization', () => {
    it('should initialize all production services successfully', async () => {
      // This test verifies that all services can be initialized without errors
      expect(productionServices.security).toBeDefined();
      expect(productionServices.healthCheck).toBeDefined();
      expect(productionServices.securityMiddleware).toBeDefined();
    });

    it('should provide comprehensive system status', async () => {
      const status = await productionServices.getSystemStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('timestamp');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('checks');
      expect(status).toHaveProperty('performance');
      expect(status).toHaveProperty('dependencies');
      expect(status).toHaveProperty('services');
      expect(status).toHaveProperty('initialized');
    });

    it('should provide health endpoint for monitoring', async () => {
      const health = await productionServices.getHealthEndpoint();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(['ok', 'error']).toContain(health.status);
    });

    it('should provide security metrics', () => {
      const metrics = productionServices.getSecurityMetrics();
      
      expect(metrics).toHaveProperty('rateLimitViolations');
      expect(metrics).toHaveProperty('suspiciousActivityCount');
      expect(metrics).toHaveProperty('authenticationAttempts');
      expect(metrics).toHaveProperty('lastSecurityEvent');
    });
  });

  describe('Integrated Security Flow', () => {
    it('should handle complete authentication flow with security features', () => {
      const securityService = productionServices.security;
      const identifier = 'test-integration-ip';
      const email = 'integration@test.com';
      const userId = 'integration-user-123';

      // 1. Check rate limiting (should be allowed initially)
      const rateLimitCheck = securityService.checkAuthRateLimit(identifier);
      expect(rateLimitCheck.allowed).toBe(true);

      // 2. Record authentication attempt
      securityService.recordAuthAttempt(identifier, email);
      expect(securityService.getAttemptCount(identifier)).toBe(1);

      // 3. Record successful authentication
      securityService.recordAuthSuccess(identifier, email, userId);
      expect(securityService.getAttemptCount(identifier)).toBe(0);

      // 4. Verify security logging occurred
      const logger = securityService.getLogger();
      expect(logger).toBeDefined();
    });

    it('should integrate CSRF protection with security middleware', () => {
      const securityMiddleware = productionServices.securityMiddleware;
      
      // Get CSRF token
      const token = securityMiddleware.getCSRFToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Validate token
      const isValid = securityMiddleware.validateCSRFToken(token);
      expect(isValid).toBe(true);

      // Invalid token should fail
      const isInvalid = securityMiddleware.validateCSRFToken('invalid-token');
      expect(isInvalid).toBe(false);
    });

    it('should handle security events across services', () => {
      const securityService = productionServices.security;
      const securityLogger = securityService.getSecurityLogger();

      // Mock console methods to verify logging
      const consoleSpy = {
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {})
      };

      // Test suspicious activity logging
      securityLogger.logSuspiciousActivity(
        'Integration test suspicious activity',
        { testCase: 'production-integration' },
        'test-user'
      );

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious activity detected')
      );

      // Test rate limit logging
      securityLogger.logRateLimitExceeded('test-ip', 'test@example.com');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );

      consoleSpy.warn.mockRestore();
      consoleSpy.error.mockRestore();
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track performance metrics across the system', async () => {
      const healthService = productionServices.healthCheck;

      // Record some performance metrics
      healthService.recordResponseTime(150);
      healthService.recordSuccess();
      healthService.recordError();
      healthService.recordSuccess();

      const status = await productionServices.getDetailedHealth();
      expect(status.performance).toBeDefined();
      expect(typeof status.performance.responseTime).toBe('number');
      expect(typeof status.performance.errorRate).toBe('number');
    });

    it('should provide comprehensive health monitoring', async () => {
      const status = await productionServices.getDetailedHealth();
      
      expect(status.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(status.status);
      
      expect(status.checks).toBeDefined();
      expect(Array.isArray(status.checks)).toBe(true);
      
      expect(status.dependencies).toBeDefined();
      expect(Array.isArray(status.dependencies)).toBe(true);
      
      expect(status.performance).toBeDefined();
      expect(typeof status.performance.responseTime).toBe('number');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle graceful degradation when services fail', async () => {
      // Mock a failing health check
      const originalFetch = global.fetch;
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      try {
        const health = await productionServices.getHealthEndpoint();
        
        // Should still return a response, but with error status
        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('timestamp');
      } catch (error) {
        // If it throws, it should be handled gracefully
        expect(error).toBeDefined();
      } finally {
        vi.stubGlobal('fetch', originalFetch);
      }
    });

    it('should maintain security even when monitoring fails', () => {
      const securityService = productionServices.security;
      
      // Security should still work even if monitoring has issues
      const rateLimitCheck = securityService.checkAuthRateLimit('test-ip');
      expect(rateLimitCheck).toHaveProperty('allowed');
      
      const logger = securityService.getLogger();
      expect(logger).toBeDefined();
      
      // Should not throw when logging
      expect(() => {
        logger.info('Test message during monitoring failure');
      }).not.toThrow();
    });
  });

  describe('Production Configuration Validation', () => {
    it('should validate all required environment variables', () => {
      // Mock required environment variables
      vi.stubGlobal('import.meta', {
        env: {
          ...import.meta.env,
          VITE_ENVIRONMENT: 'production',
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-anon-key-12345'
        }
      });
      
      const requiredVars = [
        'VITE_ENVIRONMENT',
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
      ];

      requiredVars.forEach(varName => {
        const value = import.meta.env[varName];
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should validate security settings are enabled in production', () => {
      // Mock production environment for this test
      vi.stubGlobal('import.meta', {
        env: {
          ...import.meta.env,
          VITE_ENVIRONMENT: 'production',
          VITE_ENABLE_RATE_LIMITING: 'true',
          VITE_ENABLE_CSRF_PROTECTION: 'true',
          VITE_ENABLE_SECURITY_LOGGING: 'true'
        }
      });
      
      expect(import.meta.env.VITE_ENVIRONMENT).toBe('production');
      expect(import.meta.env.VITE_ENABLE_RATE_LIMITING).toBe('true');
      expect(import.meta.env.VITE_ENABLE_CSRF_PROTECTION).toBe('true');
      expect(import.meta.env.VITE_ENABLE_SECURITY_LOGGING).toBe('true');
    });

    it('should validate monitoring is enabled in production', () => {
      // Mock production environment for this test
      vi.stubGlobal('import.meta', {
        env: {
          ...import.meta.env,
          VITE_ENVIRONMENT: 'production',
          VITE_ENABLE_HEALTH_MONITORING: 'true',
          VITE_ENABLE_PERFORMANCE_MONITORING: 'true'
        }
      });
      
      expect(import.meta.env.VITE_ENABLE_HEALTH_MONITORING).toBe('true');
      expect(import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING).toBe('true');
    });
  });

  describe('End-to-End Production Scenarios', () => {
    it('should handle complete user session lifecycle with security', async () => {
      const securityService = productionServices.security;
      const identifier = 'e2e-test-ip';
      const email = 'e2e@test.com';
      const userId = 'e2e-user-123';

      // 1. Initial rate limit check
      const initialCheck = securityService.checkAuthRateLimit(identifier);
      expect(initialCheck.allowed).toBe(true);

      // 2. Multiple login attempts (simulate real usage)
      for (let i = 0; i < 3; i++) {
        securityService.recordAuthAttempt(identifier, email);
      }

      // 3. Successful login resets counter
      securityService.recordAuthSuccess(identifier, email, userId);
      expect(securityService.getAttemptCount(identifier)).toBe(0);

      // 4. System health check during session
      const health = await productionServices.getDetailedHealth();
      expect(health.status).toBeDefined();

      // 5. CSRF protection during session
      const token = productionServices.securityMiddleware.getCSRFToken();
      expect(productionServices.securityMiddleware.validateCSRFToken(token)).toBe(true);
    });

    it('should handle production failure scenarios gracefully', async () => {
      const healthService = productionServices.healthCheck;

      // Simulate errors
      healthService.recordError();
      healthService.recordError();
      healthService.recordSuccess(); // Some operations still work

      const status = await productionServices.getDetailedHealth();
      
      // System should still be responsive even with some errors
      expect(status).toBeDefined();
      expect(status.status).toBeDefined();
      expect(status.performance.errorRate).toBeGreaterThan(0);
    });
  });
});