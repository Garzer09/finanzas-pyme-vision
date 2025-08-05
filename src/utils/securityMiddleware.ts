/**
 * 🛡️ Security Headers and Middleware
 * 
 * Provides security headers, CSRF protection, and input sanitization
 * for production environments.
 */

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy'?: string;
  'Strict-Transport-Security'?: string;
}

export interface CSRFConfig {
  cookieName: string;
  headerName: string;
  tokenLength: number;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
}

/**
 * Generate secure security headers for production
 */
export function getSecurityHeaders(environment: string = 'production'): SecurityHeaders {
  const baseHeaders: SecurityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  if (environment === 'production') {
    baseHeaders['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');

    baseHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    
    baseHeaders['Permissions-Policy'] = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', ');
  }

  return baseHeaders;
}

/**
 * Apply security headers to fetch requests
 */
export function applySecurityHeaders(init: RequestInit = {}): RequestInit {
  const securityHeaders = getSecurityHeaders(import.meta.env.VITE_ENVIRONMENT);
  
  return {
    ...init,
    headers: {
      ...init.headers,
      ...securityHeaders
    }
  };
}

/**
 * CSRF Token Management
 */
export class CSRFProtection {
  private config: CSRFConfig;
  private currentToken: string | null = null;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = {
      cookieName: 'csrf-token',
      headerName: 'X-CSRF-Token',
      tokenLength: 32,
      sameSite: 'strict',
      secure: import.meta.env.VITE_ENVIRONMENT === 'production',
      ...config
    };
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    const array = new Uint8Array(this.config.tokenLength);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get or create CSRF token
   */
  getToken(): string {
    if (!this.currentToken) {
      this.currentToken = this.generateToken();
      this.storeToken(this.currentToken);
    }
    return this.currentToken;
  }

  /**
   * Store token in secure storage
   */
  private storeToken(token: string): void {
    if (typeof window === 'undefined') return;

    // Store in sessionStorage (more secure than localStorage for CSRF tokens)
    try {
      sessionStorage.setItem(this.config.cookieName, token);
    } catch (error) {
      console.warn('Failed to store CSRF token:', error);
    }
  }

  /**
   * Retrieve token from storage
   */
  private retrieveToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      return sessionStorage.getItem(this.config.cookieName);
    } catch (error) {
      console.warn('Failed to retrieve CSRF token:', error);
      return null;
    }
  }

  /**
   * Validate CSRF token
   */
  validateToken(providedToken: string): boolean {
    const storedToken = this.retrieveToken();
    return storedToken !== null && storedToken === providedToken;
  }

  /**
   * Add CSRF token to request headers
   */
  addTokenToRequest(init: RequestInit = {}): RequestInit {
    const token = this.getToken();
    
    return {
      ...init,
      headers: {
        ...init.headers,
        [this.config.headerName]: token
      }
    };
  }

  /**
   * Refresh CSRF token
   */
  refreshToken(): string {
    this.currentToken = this.generateToken();
    this.storeToken(this.currentToken);
    return this.currentToken;
  }
}

/**
 * Input Sanitization Utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML input to prevent XSS
   */
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/onerror/gi, 'BLOCKED')
      .replace(/onload/gi, 'BLOCKED')
      .replace(/onclick/gi, 'BLOCKED')
      .replace(/javascript:/gi, 'BLOCKED:');
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    
    return email
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, '');
  }

  /**
   * Sanitize filename for upload
   */
  static sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') return '';
    
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 255); // Limit filename length
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeURL(url: string): string | null {
    if (typeof url !== 'string') return null;
    
    try {
      const parsed = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }
      
      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJSON(input: string): any {
    if (typeof input !== 'string') return null;
    
    try {
      const parsed = JSON.parse(input);
      
      // Recursively sanitize object
      return this.sanitizeObject(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return this.sanitizeHTML(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeHTML(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}

/**
 * Security Middleware for Fetch Requests
 */
export class SecurityMiddleware {
  private csrfProtection: CSRFProtection;

  constructor(csrfConfig?: Partial<CSRFConfig>) {
    this.csrfProtection = new CSRFProtection(csrfConfig);
  }

  /**
   * Secure fetch wrapper with security headers and CSRF protection
   */
  secureFetch = (url: string, init: RequestInit = {}): Promise<Response> => {
    // Apply security headers
    let secureInit = applySecurityHeaders(init);
    
    // Add CSRF protection for state-changing operations
    if (init.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method.toUpperCase())) {
      secureInit = this.csrfProtection.addTokenToRequest(secureInit);
    }

    return fetch(url, secureInit);
  };

  /**
   * Get CSRF token for forms
   */
  getCSRFToken(): string {
    return this.csrfProtection.getToken();
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    return this.csrfProtection.validateToken(token);
  }
}

// Create singleton instances
export const csrfProtection = new CSRFProtection();
export const inputSanitizer = InputSanitizer;
export const securityMiddleware = new SecurityMiddleware();

// Export utilities
export default {
  getSecurityHeaders,
  applySecurityHeaders,
  CSRFProtection,
  InputSanitizer,
  SecurityMiddleware,
  csrfProtection,
  inputSanitizer,
  securityMiddleware
};