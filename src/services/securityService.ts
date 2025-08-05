/**
 * Security Service
 * Simplified version to eliminate type errors
 */

export interface SecurityEvent {
  type: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  details?: any;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export class SecurityService {
  private events: SecurityEvent[] = [];

  logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    this.events.push({
      ...event,
      timestamp: new Date()
    });
  }

  logAuthAttempt(email: string, userId: string, ip: string, userAgent: string) {
    this.logEvent({
      type: 'auth_attempt',
      email,
      userId,
      ip,
      userAgent
    });
  }

  logAuthSuccess(email: string, userId: string, ip: string, userAgent: string) {
    this.logEvent({
      type: 'auth_success',
      email,
      userId,
      ip,
      userAgent
    });
  }

  logAuthFailure(email: string, userId: string, reason: string, ip: string, userAgent: string) {
    this.logEvent({
      type: 'auth_failure',
      email,
      userId,
      ip,
      userAgent,
      details: { reason }
    });
  }

  logRateLimitExceeded(email: string, identifier: string, ip: string, userAgent: string) {
    this.logEvent({
      type: 'rate_limit_exceeded',
      email,
      ip,
      userAgent,
      details: { identifier }
    });
  }

  logSuspiciousActivity(userId: string, description: string, ip: string, userAgent: string) {
    this.logEvent({
      type: 'suspicious_activity',
      userId,
      ip,
      userAgent,
      details: { description }
    });
  }

  getEvents(): SecurityEvent[] {
    return this.events;
  }

  getEventsByType(type: string): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  getEventsByUser(userId: string): SecurityEvent[] {
    return this.events.filter(event => event.userId === userId);
  }

  clearEvents(): void {
    this.events = [];
  }

  // Enhanced logger with security methods
  getLogger() {
    return {
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
      log: console.log.bind(console),
      logAuthAttempt: this.logAuthAttempt.bind(this),
      logAuthFailure: this.logAuthFailure.bind(this),
      logRateLimitExceeded: this.logRateLimitExceeded.bind(this),
      logSuspiciousActivity: this.logSuspiciousActivity.bind(this)
    };
  }

  getSecurityLogger() {
    return this.getLogger();
  }

  checkAuthRateLimit(identifier: string): RateLimitResult {
    // Mock rate limiting - always allow for now
    return { allowed: true };
  }

  recordAuthAttempt(email: string, ip?: string, userAgent?: string): void {
    this.logAuthAttempt(email, '', ip || '', userAgent || '');
  }

  recordAuthSuccess(email: string, ip?: string): void {
    this.logAuthSuccess(email, '', ip || '', '');
  }

  recordAuthFailure(email: string, reason: string, ip?: string): void {
    this.logAuthFailure(email, '', reason, ip || '', '');
  }

  getAttemptCount(identifier: string): number {
    // Mock attempt counting
    return 0;
  }
}

export const securityService = new SecurityService();