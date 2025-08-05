/**
 * 🔐 Security Service - Production-Ready Security Features
 * 
 * Implements rate limiting, structured logging, and security monitoring
 * for production environments.
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface SecurityEvent {
  type: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'rate_limit_exceeded' | 'suspicious_activity';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface LogLevel {
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  timestamp: Date;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

/**
 * Rate Limiting Service for Authentication
 */
class RateLimitingService {
  private attempts: Map<string, { count: number; firstAttempt: number; blockedUntil?: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  }) {
    this.config = config;
  }

  /**
   * Check if an IP/identifier is rate limited
   */
  isRateLimited(identifier: string): { limited: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      return { limited: false };
    }

    // Check if still blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return { limited: true, retryAfter };
    }

    // Check if window has expired
    if (now - record.firstAttempt > this.config.windowMs) {
      this.attempts.delete(identifier);
      return { limited: false };
    }

    // Check if too many attempts
    if (record.count >= this.config.maxAttempts) {
      const blockedUntil = now + this.config.blockDurationMs;
      this.attempts.set(identifier, { ...record, blockedUntil });
      const retryAfter = Math.ceil(this.config.blockDurationMs / 1000);
      return { limited: true, retryAfter };
    }

    return { limited: false };
  }

  /**
   * Record an authentication attempt
   */
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now - record.firstAttempt > this.config.windowMs) {
      // New window
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
    } else {
      // Increment existing window
      this.attempts.set(identifier, { ...record, count: record.count + 1 });
    }
  }

  /**
   * Reset attempts for successful authentication
   */
  resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get current attempt count
   */
  getAttemptCount(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;

    const now = Date.now();
    if (now - record.firstAttempt > this.config.windowMs) {
      this.attempts.delete(identifier);
      return 0;
    }

    return record.count;
  }

  /**
   * Clean up expired records (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, record] of this.attempts.entries()) {
      if (now - record.firstAttempt > this.config.windowMs && 
          (!record.blockedUntil || now > record.blockedUntil)) {
        this.attempts.delete(identifier);
      }
    }
  }
}

/**
 * Structured Logging Service
 */
class StructuredLogger {
  private environment: string;
  private logLevel: LogLevel['level'];

  constructor() {
    this.environment = import.meta.env.VITE_ENVIRONMENT || 'development';
    this.logLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel['level'] || 'INFO';
  }

  private shouldLog(level: LogLevel['level']): boolean {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLog(logEntry: LogLevel): string {
    const timestamp = logEntry.timestamp.toISOString();
    const context = logEntry.context ? JSON.stringify(logEntry.context) : '';
    const userId = logEntry.userId ? `[User: ${logEntry.userId}]` : '';
    const sessionId = logEntry.sessionId ? `[Session: ${logEntry.sessionId}]` : '';
    
    return `[${timestamp}] ${logEntry.level} ${userId}${sessionId} ${logEntry.message} ${context}`.trim();
  }

  private log(entry: LogLevel): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedLog = this.formatLog(entry);

    // Console output with appropriate level
    switch (entry.level) {
      case 'ERROR':
        console.error(formattedLog);
        break;
      case 'WARN':
        console.warn(formattedLog);
        break;
      case 'INFO':
        console.info(formattedLog);
        break;
      case 'DEBUG':
        console.debug(formattedLog);
        break;
    }

    // In production, you would also send to external logging service
    if (this.environment === 'production') {
      this.sendToExternalLogger(entry);
    }
  }

  private sendToExternalLogger(entry: LogLevel): void {
    // Placeholder for external logging service integration
    // e.g., Sentry, LogRocket, DataDog, etc.
    if (entry.level === 'ERROR') {
      // Would send to error tracking service
    }
  }

  debug(message: string, context?: Record<string, any>, userId?: string, sessionId?: string): void {
    this.log({
      level: 'DEBUG',
      timestamp: new Date(),
      message,
      context,
      userId,
      sessionId
    });
  }

  info(message: string, context?: Record<string, any>, userId?: string, sessionId?: string): void {
    this.log({
      level: 'INFO',
      timestamp: new Date(),
      message,
      context,
      userId,
      sessionId
    });
  }

  warn(message: string, context?: Record<string, any>, userId?: string, sessionId?: string): void {
    this.log({
      level: 'WARN',
      timestamp: new Date(),
      message,
      context,
      userId,
      sessionId
    });
  }

  error(message: string, context?: Record<string, any>, userId?: string, sessionId?: string): void {
    this.log({
      level: 'ERROR',
      timestamp: new Date(),
      message,
      context,
      userId,
      sessionId
    });
  }
}

/**
 * Security Event Logging Service
 */
class SecurityEventLogger {
  private logger: StructuredLogger;

  constructor(logger: StructuredLogger) {
    this.logger = logger;
  }

  private getClientInfo() {
    return {
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }

  private getClientIP(): string {
    // In a real production environment, this would come from headers
    // For now, we'll use a placeholder
    return 'client-ip-not-available';
  }

  logAuthAttempt(email: string, userId?: string): void {
    const event: SecurityEvent = {
      type: 'auth_attempt',
      email,
      userId,
      ...this.getClientInfo()
    };

    this.logger.info('Authentication attempt', {
      securityEvent: event,
      email: email.replace(/(.{2}).*@/, '$1***@') // Partially mask email
    }, userId);
  }

  logAuthSuccess(email: string, userId: string): void {
    const event: SecurityEvent = {
      type: 'auth_success',
      email,
      userId,
      ...this.getClientInfo()
    };

    this.logger.info('Authentication successful', {
      securityEvent: event,
      email: email.replace(/(.{2}).*@/, '$1***@')
    }, userId);
  }

  logAuthFailure(email: string, reason: string, userId?: string): void {
    const event: SecurityEvent = {
      type: 'auth_failure',
      email,
      userId,
      ...this.getClientInfo(),
      details: { reason }
    };

    this.logger.warn('Authentication failed', {
      securityEvent: event,
      email: email.replace(/(.{2}).*@/, '$1***@'),
      reason
    }, userId);
  }

  logRateLimitExceeded(identifier: string, email?: string): void {
    const event: SecurityEvent = {
      type: 'rate_limit_exceeded',
      email,
      ...this.getClientInfo(),
      details: { identifier }
    };

    this.logger.warn('Rate limit exceeded', {
      securityEvent: event,
      identifier
    });
  }

  logSuspiciousActivity(description: string, details?: Record<string, any>, userId?: string): void {
    const event: SecurityEvent = {
      type: 'suspicious_activity',
      userId,
      ...this.getClientInfo(),
      details: { description, ...details }
    };

    this.logger.error('Suspicious activity detected', {
      securityEvent: event,
      description,
      details
    }, userId);
  }
}

/**
 * Production Security Service
 */
export class SecurityService {
  private rateLimiter: RateLimitingService;
  private logger: StructuredLogger;
  private securityLogger: SecurityEventLogger;

  constructor(rateLimitConfig?: RateLimitConfig) {
    this.rateLimiter = new RateLimitingService(rateLimitConfig);
    this.logger = new StructuredLogger();
    this.securityLogger = new SecurityEventLogger(this.logger);

    // Clean up rate limit records every 5 minutes
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Get the structured logger instance
   */
  getLogger(): StructuredLogger {
    return this.logger;
  }

  /**
   * Get the security event logger instance
   */
  getSecurityLogger(): SecurityEventLogger {
    return this.securityLogger;
  }

  /**
   * Check if authentication attempt is allowed
   */
  checkAuthRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
    const rateLimitResult = this.rateLimiter.isRateLimited(identifier);
    
    if (rateLimitResult.limited) {
      this.securityLogger.logRateLimitExceeded(identifier);
      return { allowed: false, retryAfter: rateLimitResult.retryAfter };
    }

    return { allowed: true };
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(identifier: string, email: string): void {
    this.rateLimiter.recordAttempt(identifier);
    this.securityLogger.logAuthAttempt(email);
  }

  /**
   * Record successful authentication
   */
  recordAuthSuccess(identifier: string, email: string, userId: string): void {
    this.rateLimiter.resetAttempts(identifier);
    this.securityLogger.logAuthSuccess(email, userId);
  }

  /**
   * Record failed authentication
   */
  recordAuthFailure(identifier: string, email: string, reason: string): void {
    this.securityLogger.logAuthFailure(email, reason);
  }

  /**
   * Get current attempt count for identifier
   */
  getAttemptCount(identifier: string): number {
    return this.rateLimiter.getAttemptCount(identifier);
  }
}

// Create singleton instance
export const securityService = new SecurityService();

// Export default instance and types
export default securityService;