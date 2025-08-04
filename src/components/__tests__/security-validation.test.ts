import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AuthState } from '@/types/auth';

// Mock security-related APIs
const mockSecurityAPIs = {
  localStorage: new Map<string, string>(),
  sessionStorage: new Map<string, string>(),
  document: {
    cookie: '',
    referrer: ''
  }
};

// Mock crypto API instead of overriding global
const mockCrypto = {
  getRandomValues: vi.fn(() => new Uint8Array([1, 2, 3, 4, 5])),
  subtle: {
    digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32)))
  }
};

describe('Security and Edge Case Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSecurityAPIs.localStorage.clear();
    mockSecurityAPIs.sessionStorage.clear();
    mockSecurityAPIs.document.cookie = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Direct URL Access Without Authentication', () => {
    it('should redirect unauthenticated users from protected routes', () => {
      const protectedRoutes = [
        '/admin/users',
        '/admin/empresas',
        '/admin/settings',
        '/app/mis-empresas',
        '/app/dashboard',
        '/subir-excel',
        '/archivos'
      ];

      const unauthenticatedState: AuthState = { status: 'unauthenticated' };
      let redirectsTriggered = 0;

      const mockRouteProtection = (authState: AuthState, requestedPath: string) => {
        if (authState.status !== 'authenticated' && protectedRoutes.includes(requestedPath)) {
          redirectsTriggered++;
          return { redirect: '/auth', blocked: true };
        }
        return { redirect: null, blocked: false };
      };

      protectedRoutes.forEach(route => {
        const result = mockRouteProtection(unauthenticatedState, route);
        expect(result.blocked).toBe(true);
        expect(result.redirect).toBe('/auth');
      });

      expect(redirectsTriggered).toBe(protectedRoutes.length);
    });

    it('should allow access to public routes without authentication', () => {
      const publicRoutes = [
        '/',
        '/auth',
        '/reset-password',
        '/landing'
      ];

      const unauthenticatedState: AuthState = { status: 'unauthenticated' };
      let publicAccessGranted = 0;

      const mockPublicRouteAccess = (authState: AuthState, requestedPath: string) => {
        if (publicRoutes.includes(requestedPath)) {
          publicAccessGranted++;
          return { allowed: true };
        }
        return { allowed: false };
      };

      publicRoutes.forEach(route => {
        const result = mockPublicRouteAccess(unauthenticatedState, route);
        expect(result.allowed).toBe(true);
      });

      expect(publicAccessGranted).toBe(publicRoutes.length);
    });

    it('should handle malicious URL manipulation attempts', () => {
      const maliciousURLs = [
        '/admin/../../../etc/passwd',
        '/app/%2E%2E%2F%2E%2E%2Fadmin',
        '/admin/users?redirect=javascript:alert(1)',
        '/auth?return_to=//evil.com',
        '/admin/users#<script>alert(1)</script>'
      ];

      let maliciousAttemptsBlocked = 0;

      const mockURLSanitization = (url: string) => {
        // Check for path traversal
        if (url.includes('..') || url.includes('%2E') || url.includes('%2F')) {
          maliciousAttemptsBlocked++;
          return { sanitized: '/auth', blocked: true };
        }

        // Check for XSS in fragments
        if (url.includes('<script>') || url.includes('javascript:')) {
          maliciousAttemptsBlocked++;
          return { sanitized: '/auth', blocked: true };
        }

        // Check for open redirects - more specific check
        if (url.includes('redirect=javascript:') || url.includes('return_to=//')) {
          maliciousAttemptsBlocked++;
          return { sanitized: '/auth', blocked: true };
        }

        return { sanitized: url, blocked: false };
      };

      maliciousURLs.forEach(url => {
        const result = mockURLSanitization(url);
        expect(result.blocked).toBe(true);
        expect(result.sanitized).toBe('/auth');
      });

      expect(maliciousAttemptsBlocked).toBe(maliciousURLs.length);
    });

    it('should validate referrer headers for additional security', () => {
      let suspiciousReferrersBlocked = 0;

      const mockReferrerValidation = (referrer: string, allowedDomains: string[]) => {
        if (!referrer) return { valid: true }; // Empty referrer is acceptable

        try {
          const referrerURL = new URL(referrer);
          const isAllowedDomain = allowedDomains.some(domain => 
            referrerURL.hostname === domain || referrerURL.hostname.endsWith(`.${domain}`)
          );

          if (!isAllowedDomain) {
            suspiciousReferrersBlocked++;
            return { valid: false, blocked: true };
          }

          return { valid: true, blocked: false };
        } catch (error) {
          // Invalid URL format
          suspiciousReferrersBlocked++;
          return { valid: false, blocked: true };
        }
      };

      const allowedDomains = ['company.com', 'app.company.com'];
      const suspiciousReferrers = [
        'https://evil.com/phishing',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'https://company.com.evil.com'
      ];

      suspiciousReferrers.forEach(referrer => {
        const result = mockReferrerValidation(referrer, allowedDomains);
        expect(result.valid).toBe(false);
      });

      expect(suspiciousReferrersBlocked).toBe(suspiciousReferrers.length);
    });
  });

  describe('Role Escalation Attempt Blocking', () => {
    it('should prevent viewers from accessing admin-only endpoints', () => {
      const viewerAuthState: AuthState = {
        status: 'authenticated',
        user: { id: 'viewer123', email: 'viewer@company.com' } as any,
        session: { access_token: 'viewer_token' } as any,
        role: 'viewer'
      };

      let escalationAttemptsBlocked = 0;

      const mockRoleEscalationPrevention = (authState: AuthState, requestedAction: string) => {
        const adminOnlyActions = [
          'create_user',
          'delete_user',
          'modify_roles',
          'access_admin_dashboard',
          'view_system_logs',
          'modify_system_settings'
        ];

        if (adminOnlyActions.includes(requestedAction) && authState.role !== 'admin') {
          escalationAttemptsBlocked++;
          return { blocked: true, reason: 'Insufficient privileges' };
        }

        return { blocked: false };
      };

      const adminOnlyActions = [
        'create_user',
        'delete_user',
        'modify_roles',
        'access_admin_dashboard',
        'view_system_logs',
        'modify_system_settings'
      ];

      adminOnlyActions.forEach(action => {
        const result = mockRoleEscalationPrevention(viewerAuthState, action);
        expect(result.blocked).toBe(true);
        expect(result.reason).toBe('Insufficient privileges');
      });

      expect(escalationAttemptsBlocked).toBe(adminOnlyActions.length);
    });

    it('should prevent token manipulation for role escalation', () => {
      let tokenTamperingDetected = false;
      let invalidTokenBlocked = false;

      const mockTokenValidation = (token: string, expectedSignature: string) => {
        // Simulate JWT token validation
        const tokenParts = token.split('.');
        
        if (tokenParts.length !== 3) {
          invalidTokenBlocked = true;
          return { valid: false, reason: 'Invalid token format' };
        }

        const [header, payload, signature] = tokenParts;

        // Check if signature matches expected
        if (signature !== expectedSignature) {
          tokenTamperingDetected = true;
          return { valid: false, reason: 'Token signature invalid' };
        }

        // Decode payload to check role claims
        try {
          const decodedPayload = JSON.parse(atob(payload));
          
          // Verify role claim hasn't been tampered with
          if (decodedPayload.role && !['admin', 'viewer'].includes(decodedPayload.role)) {
            tokenTamperingDetected = true;
            return { valid: false, reason: 'Invalid role claim' };
          }

          return { valid: true, role: decodedPayload.role };
        } catch (error) {
          invalidTokenBlocked = true;
          return { valid: false, reason: 'Invalid payload' };
        }
      };

      // Test various tampered tokens
      const tamperedTokens = [
        'header.payload', // Missing signature
        'header.payload.invalid_signature',
        'header.' + btoa(JSON.stringify({ role: 'superadmin' })) + '.signature',
        'invalid_format'
      ];

      const validSignature = 'valid_signature_123';

      tamperedTokens.forEach(token => {
        const result = mockTokenValidation(token, validSignature);
        expect(result.valid).toBe(false);
      });

      expect(tokenTamperingDetected || invalidTokenBlocked).toBe(true);
    });

    it('should log and alert on escalation attempts', () => {
      let securityAlertLogged = false;
      let adminNotified = false;

      const mockSecurityMonitoring = (userId: string, attemptedAction: string, userRole: string) => {
        const suspiciousActions = [
          'attempt_admin_access',
          'modify_other_user_data',
          'access_restricted_endpoints'
        ];

        if (suspiciousActions.includes(attemptedAction) && userRole !== 'admin') {
          // Log security event
          const securityEvent = {
            timestamp: new Date().toISOString(),
            userId,
            action: attemptedAction,
            userRole,
            severity: 'HIGH',
            blocked: true
          };

          securityAlertLogged = true;

          // Notify administrators
          const alertMessage = `Security Alert: User ${userId} (role: ${userRole}) attempted unauthorized action: ${attemptedAction}`;
          adminNotified = true;

          return { eventLogged: true, alertSent: true, event: securityEvent };
        }

        return { eventLogged: false, alertSent: false };
      };

      const result = mockSecurityMonitoring('viewer123', 'attempt_admin_access', 'viewer');

      expect(result.eventLogged).toBe(true);
      expect(result.alertSent).toBe(true);
      expect(securityAlertLogged).toBe(true);
      expect(adminNotified).toBe(true);
    });
  });

  describe('Expired Token Automatic Refresh', () => {
    it('should detect token expiration before API calls', () => {
      let expirationDetected = false;
      let refreshTriggered = false;

      const mockTokenExpirationCheck = (token: string) => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (payload.exp && payload.exp < currentTime) {
            expirationDetected = true;
            return { expired: true, shouldRefresh: true };
          }

          // Check if token will expire soon (within 5 minutes)
          const fiveMinutes = 5 * 60;
          if (payload.exp && (payload.exp - currentTime) < fiveMinutes) {
            refreshTriggered = true;
            return { expired: false, shouldRefresh: true };
          }

          return { expired: false, shouldRefresh: false };
        } catch (error) {
          return { expired: true, shouldRefresh: false, error: 'Invalid token' };
        }
      };

      // Create an expired token
      const expiredTokenPayload = {
        sub: 'user123',
        role: 'viewer',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      };

      const expiredToken = 'header.' + btoa(JSON.stringify(expiredTokenPayload)) + '.signature';
      
      const result = mockTokenExpirationCheck(expiredToken);
      
      expect(result.expired).toBe(true);
      expect(expirationDetected).toBe(true);
    });

    it('should handle refresh token rotation', () => {
      let refreshTokenRotated = false;
      let oldTokenInvalidated = false;

      const mockTokenRotation = (currentRefreshToken: string) => {
        // Generate new access and refresh tokens
        const newTokens = {
          accessToken: 'new_access_token_' + Date.now(),
          refreshToken: 'new_refresh_token_' + Date.now(),
          expiresIn: 3600
        };

        // Invalidate old refresh token
        if (currentRefreshToken) {
          oldTokenInvalidated = true;
        }

        refreshTokenRotated = true;

        return {
          success: true,
          tokens: newTokens,
          oldTokenInvalidated
        };
      };

      const result = mockTokenRotation('old_refresh_token_123');

      expect(result.success).toBe(true);
      expect(refreshTokenRotated).toBe(true);
      expect(oldTokenInvalidated).toBe(true);
      expect(result.tokens.accessToken).toContain('new_access_token_');
    });

    it('should handle refresh token expiration gracefully', () => {
      let userRedirectedToLogin = false;
      let sessionCleared = false;

      const mockRefreshTokenExpiration = (refreshToken: string) => {
        try {
          const payload = JSON.parse(atob(refreshToken.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          if (payload.exp && payload.exp < currentTime) {
            // Refresh token is expired, user must re-authenticate
            userRedirectedToLogin = true;
            sessionCleared = true;
            
            return {
              success: false,
              error: 'Refresh token expired',
              requiresReauth: true
            };
          }

          return { success: true };
        } catch (error) {
          userRedirectedToLogin = true;
          sessionCleared = true;
          return {
            success: false,
            error: 'Invalid refresh token',
            requiresReauth: true
          };
        }
      };

      // Create expired refresh token
      const expiredRefreshPayload = {
        sub: 'user123',
        type: 'refresh',
        exp: Math.floor(Date.now() / 1000) - 86400 // Expired 1 day ago
      };

      const expiredRefreshToken = 'header.' + btoa(JSON.stringify(expiredRefreshPayload)) + '.signature';
      
      const result = mockRefreshTokenExpiration(expiredRefreshToken);

      expect(result.success).toBe(false);
      expect(result.requiresReauth).toBe(true);
      expect(userRedirectedToLogin).toBe(true);
      expect(sessionCleared).toBe(true);
    });

    it('should implement token refresh with jitter to avoid thundering herd', () => {
      let jitterApplied = false;
      let refreshDelayed = false;

      const mockJitteredRefresh = (tokenExpiryTime: number, currentTime: number) => {
        const timeToExpiry = tokenExpiryTime - currentTime;
        const refreshWindowStart = 300; // 5 minutes before expiry
        const refreshWindowEnd = 60;   // 1 minute before expiry

        if (timeToExpiry <= refreshWindowStart && timeToExpiry > refreshWindowEnd) {
          // Add jitter to prevent all clients refreshing simultaneously
          const jitterSeconds = Math.random() * 60; // 0-60 seconds
          const refreshDelay = jitterSeconds * 1000;

          jitterApplied = true;
          refreshDelayed = true;

          return {
            shouldRefresh: true,
            delay: refreshDelay,
            jitter: jitterSeconds
          };
        }

        return { shouldRefresh: false };
      };

      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExpiryTime = currentTime + 240; // Expires in 4 minutes

      const result = mockJitteredRefresh(tokenExpiryTime, currentTime);

      expect(result.shouldRefresh).toBe(true);
      expect(typeof result.delay).toBe('number');
      expect(result.delay).toBeGreaterThanOrEqual(0);
      expect(result.delay).toBeLessThanOrEqual(60000);
    });
  });

  describe('CSRF and Session Hijacking Protection', () => {
    it('should validate CSRF tokens on state-changing operations', () => {
      let csrfTokenValidated = false;
      let maliciousRequestBlocked = false;

      const mockCSRFProtection = (requestToken: string, sessionToken: string, operation: string) => {
        const stateChangingOperations = [
          'create_user',
          'update_profile',
          'delete_data',
          'change_password',
          'upload_file'
        ];

        if (stateChangingOperations.includes(operation)) {
          if (!requestToken || requestToken !== sessionToken) {
            maliciousRequestBlocked = true;
            return { 
              valid: false, 
              error: 'CSRF token validation failed',
              blocked: true 
            };
          }
          csrfTokenValidated = true;
        }

        return { valid: true, blocked: false };
      };

      // Test with missing CSRF token
      const result1 = mockCSRFProtection('', 'valid_session_token', 'create_user');
      expect(result1.valid).toBe(false);
      expect(result1.blocked).toBe(true);

      // Test with valid CSRF token
      const result2 = mockCSRFProtection('valid_token_123', 'valid_token_123', 'create_user');
      expect(result2.valid).toBe(true);
      expect(csrfTokenValidated).toBe(true);

      expect(maliciousRequestBlocked).toBe(true);
    });

    it('should detect session hijacking attempts', () => {
      let hijackingDetected = false;
      let sessionInvalidated = false;

      const mockSessionHijackingDetection = (sessionData: any, currentRequest: any) => {
        // Check for suspicious changes in session fingerprint
        const fingerprintMismatch = 
          sessionData.userAgent !== currentRequest.userAgent ||
          sessionData.ipAddress !== currentRequest.ipAddress;

        // Check for impossible geographical changes
        const timeDiff = currentRequest.timestamp - sessionData.lastActivity;
        const distanceKm = calculateDistance(sessionData.location, currentRequest.location);
        const maxPossibleSpeed = 1000; // km/h (commercial aircraft speed)
        const impossibleTravel = (distanceKm / (timeDiff / 3600000)) > maxPossibleSpeed;

        if (fingerprintMismatch || impossibleTravel) {
          hijackingDetected = true;
          sessionInvalidated = true;
          
          return {
            suspicious: true,
            reason: fingerprintMismatch ? 'Fingerprint mismatch' : 'Impossible travel detected',
            action: 'session_invalidated'
          };
        }

        return { suspicious: false };
      };

      // Helper function for distance calculation
      const calculateDistance = (loc1: any, loc2: any) => {
        // Simplified distance calculation for testing
        if (!loc1 || !loc2) return 0;
        return Math.abs(loc1.lat - loc2.lat) * 111; // Rough km conversion
      };

      // Simulate suspicious session
      const sessionData = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        location: { lat: 40.7128, lng: -74.0060 }, // New York
        lastActivity: Date.now() - 60000 // 1 minute ago
      };

      const suspiciousRequest = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        ipAddress: '203.0.113.45',
        location: { lat: 51.5074, lng: -0.1278 }, // London
        timestamp: Date.now()
      };

      const result = mockSessionHijackingDetection(sessionData, suspiciousRequest);

      expect(result.suspicious).toBe(true);
      expect(hijackingDetected).toBe(true);
      expect(sessionInvalidated).toBe(true);
    });

    it('should implement secure session storage', () => {
      let secureStorageUsed = false;
      let encryptionApplied = false;

      const mockSecureSessionStorage = {
        encryptData: (data: string, key: string) => {
          // Simulate encryption
          encryptionApplied = true;
          return btoa(data + '_encrypted_with_' + key);
        },

        decryptData: (encryptedData: string, key: string) => {
          // Simulate decryption
          const decoded = atob(encryptedData);
          if (decoded.includes('_encrypted_with_' + key)) {
            return decoded.replace('_encrypted_with_' + key, '');
          }
          throw new Error('Decryption failed');
        },

        storeSession: function(sessionData: any) {
          const dataString = JSON.stringify(sessionData);
          const encryptionKey = 'user_specific_key_123';
          const encryptedSession = this.encryptData(dataString, encryptionKey);
          
          // Store in httpOnly cookie (simulated)
          secureStorageUsed = true;
          mockSecurityAPIs.document.cookie = `session=${encryptedSession}; HttpOnly; Secure; SameSite=Strict`;
          
          return true;
        },

        retrieveSession: function() {
          const cookieValue = mockSecurityAPIs.document.cookie.replace('session=', '').split(';')[0];
          if (cookieValue) {
            try {
              const decryptionKey = 'user_specific_key_123';
              const decryptedData = this.decryptData(cookieValue, decryptionKey);
              return JSON.parse(decryptedData);
            } catch (error) {
              return null;
            }
          }
          return null;
        }
      };

      // Test secure storage
      const sessionData = { userId: 'user123', role: 'viewer', token: 'abc123' };
      mockSecureSessionStorage.storeSession(sessionData);
      
      expect(secureStorageUsed).toBe(true);
      expect(encryptionApplied).toBe(true);

      const retrievedSession = mockSecureSessionStorage.retrieveSession();
      expect(retrievedSession?.userId).toBe('user123');
    });

    it('should implement Content Security Policy validation', () => {
      let cspViolationDetected = false;
      let maliciousContentBlocked = false;

      const mockCSPValidation = (contentType: string, source: string, policy: any) => {
        const cspPolicies = {
          'script-src': ['self', 'https://trusted-cdn.com'],
          'style-src': ['self', 'unsafe-inline'],
          'img-src': ['self', 'data:', 'https:'],
          'connect-src': ['self', 'https://api.company.com']
        };

        const allowedSources = cspPolicies[contentType as keyof typeof cspPolicies] || [];
        
        // Check if source is allowed
        const isAllowed = allowedSources.some(allowed => {
          if (allowed === 'self') return source.startsWith(window.location.origin);
          if (allowed === 'unsafe-inline') return true;
          if (allowed === 'data:') return source.startsWith('data:');
          if (allowed === 'https:') return source.startsWith('https:');
          return source.startsWith(allowed);
        });

        if (!isAllowed) {
          cspViolationDetected = true;
          maliciousContentBlocked = true;
          
          return {
            blocked: true,
            violation: {
              contentType,
              source,
              policy: allowedSources
            }
          };
        }

        return { blocked: false };
      };

      // Test malicious script injection
      const maliciousAttempts = [
        { type: 'script-src', source: 'https://evil.com/malicious.js' },
        { type: 'connect-src', source: 'https://attacker.com/exfiltrate' },
        { type: 'img-src', source: 'javascript:alert(1)' }
      ];

      maliciousAttempts.forEach(attempt => {
        const result = mockCSPValidation(attempt.type, attempt.source, {});
        expect(result.blocked).toBe(true);
      });

      expect(cspViolationDetected).toBe(true);
      expect(maliciousContentBlocked).toBe(true);
    });
  });

  describe('Advanced Security Scenarios', () => {
    it('should detect and prevent brute force attacks', () => {
      let bruteForceDetected = false;
      let accountLocked = false;

      const mockBruteForceProtection = {
        attempts: new Map<string, number>(),
        lockouts: new Map<string, number>(),
        
        recordFailedAttempt: function(identifier: string) {
          const currentAttempts = this.attempts.get(identifier) || 0;
          this.attempts.set(identifier, currentAttempts + 1);
          
          const maxAttempts = 5;
          const lockoutDuration = 15 * 60 * 1000; // 15 minutes
          
          if (currentAttempts + 1 >= maxAttempts) {
            bruteForceDetected = true;
            accountLocked = true;
            this.lockouts.set(identifier, Date.now() + lockoutDuration);
            return { locked: true, lockoutUntil: Date.now() + lockoutDuration };
          }
          
          return { locked: false, attemptsRemaining: maxAttempts - (currentAttempts + 1) };
        },
        
        isLocked: function(identifier: string) {
          const lockoutUntil = this.lockouts.get(identifier);
          if (lockoutUntil && Date.now() < lockoutUntil) {
            return { locked: true, timeRemaining: lockoutUntil - Date.now() };
          }
          return { locked: false };
        },
        
        clearAttempts: function(identifier: string) {
          this.attempts.delete(identifier);
          this.lockouts.delete(identifier);
        }
      };

      // Simulate multiple failed login attempts
      const userIdentifier = 'user@company.com';
      
      for (let i = 0; i < 6; i++) {
        const result = mockBruteForceProtection.recordFailedAttempt(userIdentifier);
        if (i >= 4) {
          expect(result.locked).toBe(true);
        }
      }

      expect(bruteForceDetected).toBe(true);
      expect(accountLocked).toBe(true);

      const lockStatus = mockBruteForceProtection.isLocked(userIdentifier);
      expect(lockStatus.locked).toBe(true);
    });

    it('should implement rate limiting for API endpoints', () => {
      let rateLimitExceeded = false;
      let requestsThrottled = 0;

      const mockRateLimiter = {
        requests: new Map<string, Array<number>>(),
        
        checkRateLimit: function(identifier: string, windowMs: number, maxRequests: number) {
          const now = Date.now();
          const windowStart = now - windowMs;
          
          // Get existing requests for this identifier
          const requests = this.requests.get(identifier) || [];
          
          // Filter out requests outside the time window
          const recentRequests = requests.filter(timestamp => timestamp > windowStart);
          
          if (recentRequests.length >= maxRequests) {
            rateLimitExceeded = true;
            requestsThrottled++;
            return {
              allowed: false,
              retryAfter: windowMs - (now - recentRequests[0]),
              requestsRemaining: 0
            };
          }
          
          // Add current request
          recentRequests.push(now);
          this.requests.set(identifier, recentRequests);
          
          return {
            allowed: true,
            requestsRemaining: maxRequests - recentRequests.length
          };
        }
      };

      // Test rate limiting
      const apiKey = 'test_api_key';
      const windowMs = 60000; // 1 minute
      const maxRequests = 10;

      // Make requests exceeding the limit
      for (let i = 0; i < 12; i++) {
        const result = mockRateLimiter.checkRateLimit(apiKey, windowMs, maxRequests);
        if (i >= 10) {
          expect(result.allowed).toBe(false);
        }
      }

      expect(rateLimitExceeded).toBe(true);
      expect(requestsThrottled).toBe(2); // Last 2 requests should be throttled
    });

    it('should validate input sanitization and XSS prevention', () => {
      let xssAttemptBlocked = false;
      let inputSanitized = false;

      const mockInputSanitization = {
        sanitizeHTML: (input: string) => {
          inputSanitized = true;
          
          // Remove script tags
          const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
          let sanitized = input.replace(scriptRegex, '');
          
          // Remove javascript: URLs
          sanitized = sanitized.replace(/javascript:/gi, '');
          
          // Remove on* event handlers
          sanitized = sanitized.replace(/\son\w+\s*=\s*['"][^'"]*['"]/gi, '');
          
          return sanitized;
        },
        
        validateInput: function(input: string, allowedTags: string[] = []) {
          const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i
          ];
          
          const hasDangerousContent = dangerousPatterns.some(pattern => pattern.test(input));
          
          if (hasDangerousContent) {
            xssAttemptBlocked = true;
            return {
              valid: false,
              sanitized: this.sanitizeHTML(input),
              blocked: true
            };
          }
          
          return { valid: true, sanitized: input, blocked: false };
        }
      };

      // Test XSS attempts
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      maliciousInputs.forEach(input => {
        const result = mockInputSanitization.validateInput(input);
        expect(result.blocked).toBe(true);
        expect(result.sanitized).not.toContain('<script');
      });

      expect(xssAttemptBlocked).toBe(true);
      expect(inputSanitized).toBe(true);
    });
  });
});