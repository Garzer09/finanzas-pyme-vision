/**
 * Production Security Features Tests
 * 
 * Tests for rate limiting, structured logging, CSRF protection,
 * and other production security features.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SecurityService } from '../../services/securityService';
import { CSRFProtection, InputSanitizer, SecurityMiddleware } from '../../utils/securityMiddleware';

describe('Production Security Features', () => {
  describe('Rate Limiting Service', () => {
    let securityService: SecurityService;

    beforeEach(() => {
      securityService = new SecurityService({
        maxAttempts: 3,
        windowMs: 60000, // 1 minute
        blockDurationMs: 120000 // 2 minutes
      });
    });

    it('should allow authentication attempts within limit', () => {
      const identifier = 'test-ip-1';
      const email = 'test@example.com';

      // First attempt should be allowed
      const check1 = securityService.checkAuthRateLimit(identifier);
      expect(check1.allowed).toBe(true);

      securityService.recordAuthAttempt(identifier, email);

      // Second attempt should be allowed
      const check2 = securityService.checkAuthRateLimit(identifier);
      expect(check2.allowed).toBe(true);

      securityService.recordAuthAttempt(identifier, email);

      // Third attempt should be allowed
      const check3 = securityService.checkAuthRateLimit(identifier);
      expect(check3.allowed).toBe(true);
    });

    it('should block authentication attempts after exceeding limit', () => {
      const identifier = 'test-ip-2';
      const email = 'test@example.com';

      // Make 3 attempts (the limit)
      for (let i = 0; i < 3; i++) {
        securityService.recordAuthAttempt(identifier, email);
      }

      // 4th attempt should be blocked
      const check = securityService.checkAuthRateLimit(identifier);
      expect(check.allowed).toBe(false);
      expect(check.retryAfter).toBeGreaterThan(0);
    });

    it('should reset attempts after successful authentication', () => {
      const identifier = 'test-ip-3';
      const email = 'test@example.com';
      const userId = 'user-123';

      // Make 2 attempts
      securityService.recordAuthAttempt(identifier, email);
      securityService.recordAuthAttempt(identifier, email);

      expect(securityService.getAttemptCount(identifier)).toBe(2);

      // Successful authentication should reset
      securityService.recordAuthSuccess(identifier, email, userId);

      expect(securityService.getAttemptCount(identifier)).toBe(0);
    });

    it('should track attempt counts correctly', () => {
      const identifier = 'test-ip-4';
      const email = 'test@example.com';

      expect(securityService.getAttemptCount(identifier)).toBe(0);

      securityService.recordAuthAttempt(identifier, email);
      expect(securityService.getAttemptCount(identifier)).toBe(1);

      securityService.recordAuthAttempt(identifier, email);
      expect(securityService.getAttemptCount(identifier)).toBe(2);
    });
  });

  describe('Structured Logging Service', () => {
    let securityService: SecurityService;
    let consoleSpy: any;

    beforeEach(() => {
      // Mock environment variables with DEBUG level
      vi.stubGlobal('import.meta', {
        env: {
          VITE_ENVIRONMENT: 'test',
          VITE_LOG_LEVEL: 'DEBUG'
        }
      });

      securityService = new SecurityService();
      consoleSpy = {
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {})
      };
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should support debug logging when enabled', () => {
      // Create a new security service with explicit debug level
      const debugSecurityService = new SecurityService();
      const logger = debugSecurityService.getLogger();
      
      // Force debug level for this test
      (logger as any).logLevel = 'DEBUG';
      
      const testMessage = 'Test debug message';
      const testContext = { userId: '123', action: 'test' };

      logger.debug(testMessage, testContext, 'user-123', 'session-456');

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
    });

    it('should log info messages with proper format', () => {
      const logger = securityService.getLogger();
      const testMessage = 'Test info message';

      logger.info(testMessage);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
    });

    it('should log warning messages with proper format', () => {
      const logger = securityService.getLogger();
      const testMessage = 'Test warning message';

      logger.warn(testMessage);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
    });

    it('should log error messages with proper format', () => {
      const logger = securityService.getLogger();
      const testMessage = 'Test error message';

      logger.error(testMessage);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
    });
  });

  describe('Security Event Logging', () => {
    let securityService: SecurityService;
    let consoleSpy: any;

    beforeEach(() => {
      securityService = new SecurityService();
      consoleSpy = {
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {})
      };
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should log authentication attempts', () => {
      const securityLogger = securityService.getSecurityLogger();
      const email = 'test@example.com';
      const userId = 'user-123';

      securityLogger.logAuthAttempt(email, userId);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('Authentication attempt')
      );
    });

    it('should log authentication failures', () => {
      const securityLogger = securityService.getSecurityLogger();
      const email = 'test@example.com';
      const reason = 'Invalid password';

      securityLogger.logAuthFailure(email, reason);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Authentication failed')
      );
    });

    it('should log rate limit violations', () => {
      const securityLogger = securityService.getSecurityLogger();
      const identifier = 'test-ip';
      const email = 'test@example.com';

      securityLogger.logRateLimitExceeded(identifier, email);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );
    });

    it('should log suspicious activities', () => {
      const securityLogger = securityService.getSecurityLogger();
      const description = 'Multiple failed login attempts from same IP';
      const details = { ip: '192.168.1.1', attempts: 10 };

      securityLogger.logSuspiciousActivity(description, details);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious activity detected')
      );
    });
  });

  describe('CSRF Protection', () => {
    let csrfProtection: CSRFProtection;

    beforeEach(() => {
      // Mock sessionStorage
      const mockStorage: Record<string, string> = {};
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
        removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
        clear: vi.fn(() => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); })
      });

      // Mock crypto.getRandomValues
      vi.stubGlobal('crypto', {
        getRandomValues: vi.fn((array: Uint8Array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
          return array;
        })
      });

      csrfProtection = new CSRFProtection();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should generate CSRF tokens', () => {
      const token = csrfProtection.getToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should validate CSRF tokens correctly', () => {
      const token = csrfProtection.getToken();
      
      // Valid token should pass validation
      expect(csrfProtection.validateToken(token)).toBe(true);
      
      // Invalid token should fail validation
      expect(csrfProtection.validateToken('invalid-token')).toBe(false);
    });

    it('should add CSRF token to request headers', () => {
      const originalInit: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const secureInit = csrfProtection.addTokenToRequest(originalInit);

      expect(secureInit.headers).toHaveProperty('X-CSRF-Token');
    });

    it('should refresh CSRF tokens', () => {
      const token1 = csrfProtection.getToken();
      const token2 = csrfProtection.refreshToken();

      expect(token1).not.toBe(token2);
      expect(csrfProtection.validateToken(token2)).toBe(true);
      expect(csrfProtection.validateToken(token1)).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML input to prevent XSS', () => {
      const maliciousInput = '<script>alert("xss")</script><img src="x" onerror="alert(1)">';
      const sanitized = InputSanitizer.sanitizeHTML(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('BLOCKED'); // Our blocked event handler replacement
    });

    it('should sanitize email addresses', () => {
      const email = '  TEST@EXAMPLE.COM  ';
      const sanitized = InputSanitizer.sanitizeEmail(email);

      expect(sanitized).toBe('test@example.com');
    });

    it('should sanitize filenames', () => {
      const maliciousFilename = '../../../etc/passwd<script>alert(1)</script>';
      const sanitized = InputSanitizer.sanitizeFilename(maliciousFilename);

      expect(sanitized).not.toContain('../');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    it('should validate and sanitize URLs', () => {
      const validUrl = 'https://example.com/path';
      const invalidUrl = 'javascript:alert(1)';
      const malformedUrl = 'not-a-url';

      expect(InputSanitizer.sanitizeURL(validUrl)).toBe(validUrl);
      expect(InputSanitizer.sanitizeURL(invalidUrl)).toBeNull();
      expect(InputSanitizer.sanitizeURL(malformedUrl)).toBeNull();
    });

    it('should sanitize JSON objects recursively', () => {
      const maliciousJSON = JSON.stringify({
        name: '<script>alert("xss")</script>',
        items: ['<img src="x" onerror="alert(1)">', 'safe-item'],
        nested: {
          value: '<svg onload="alert(1)">test</svg>'
        }
      });

      const sanitized = InputSanitizer.sanitizeJSON(maliciousJSON);

      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.items[0]).not.toContain('onerror');
      expect(sanitized.nested.value).not.toContain('onload');
      // Check that dangerous handlers are blocked
      expect(sanitized.items[0]).toContain('BLOCKED');
      expect(sanitized.nested.value).toContain('BLOCKED');
    });
  });

  describe('Security Middleware', () => {
    let securityMiddleware: SecurityMiddleware;
    let fetchSpy: any;

    beforeEach(() => {
      securityMiddleware = new SecurityMiddleware();
      
      // Mock fetch
      fetchSpy = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
      vi.stubGlobal('fetch', fetchSpy);

      // Mock sessionStorage and crypto
      const mockStorage: Record<string, string> = {};
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; })
      });

      vi.stubGlobal('crypto', {
        getRandomValues: vi.fn((array: Uint8Array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
          return array;
        })
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should apply security headers to requests', async () => {
      await securityMiddleware.secureFetch('https://example.com/api', {
        method: 'GET'
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          })
        })
      );
    });

    it('should add CSRF tokens to state-changing requests', async () => {
      await securityMiddleware.secureFetch('https://example.com/api', {
        method: 'POST'
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': expect.any(String)
          })
        })
      );
    });

    it('should not add CSRF tokens to safe requests', async () => {
      await securityMiddleware.secureFetch('https://example.com/api', {
        method: 'GET'
      });

      const callArgs = fetchSpy.mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('X-CSRF-Token');
    });

    it('should provide CSRF token for forms', () => {
      const token = securityMiddleware.getCSRFToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should validate CSRF tokens', () => {
      const token = securityMiddleware.getCSRFToken();
      
      expect(securityMiddleware.validateCSRFToken(token)).toBe(true);
      expect(securityMiddleware.validateCSRFToken('invalid')).toBe(false);
    });
  });
});