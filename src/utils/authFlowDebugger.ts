import { useAuth } from '@/contexts/AuthContext';
import { shouldNavigateAfterAuth } from '@/types/auth';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Enhanced authentication flow logger for debugging user flow issues
 */
export class AuthFlowLogger {
  private static instance: AuthFlowLogger;
  private logs: Array<{ timestamp: number; level: string; message: string; data?: any }> = [];
  private maxLogs = 1000;

  static getInstance(): AuthFlowLogger {
    if (!AuthFlowLogger.instance) {
      AuthFlowLogger.instance = new AuthFlowLogger();
    }
    return AuthFlowLogger.instance;
  }

  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: Date.now(),
      level: level.toUpperCase(),
      message: `[AUTH-FLOW] ${message}`,
      data
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console with appropriate level
    const consoleMethod = console[level] || console.log;
    if (data) {
      consoleMethod(logEntry.message, data);
    } else {
      consoleMethod(logEntry.message);
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  getLogs(level?: string): typeof this.logs {
    if (!level) return [...this.logs];
    return this.logs.filter(log => log.level === level.toUpperCase());
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * Performance monitoring for authentication flows
 */
export class AuthPerformanceMonitor {
  private static instance: AuthPerformanceMonitor;
  private metrics: Map<string, { startTime: number; endTime?: number; duration?: number; data?: any }> = new Map();

  static getInstance(): AuthPerformanceMonitor {
    if (!AuthPerformanceMonitor.instance) {
      AuthPerformanceMonitor.instance = new AuthPerformanceMonitor();
    }
    return AuthPerformanceMonitor.instance;
  }

  startTimer(operationId: string, data?: any) {
    this.metrics.set(operationId, {
      startTime: performance.now(),
      data
    });
  }

  endTimer(operationId: string) {
    const metric = this.metrics.get(operationId);
    if (metric) {
      const endTime = performance.now();
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      
      AuthFlowLogger.getInstance().info(`Performance: ${operationId} completed in ${metric.duration.toFixed(2)}ms`, metric.data);
    }
  }

  getMetric(operationId: string) {
    return this.metrics.get(operationId);
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

/**
 * Enhanced shouldNavigateAfterAuth with comprehensive logging
 */
export function shouldNavigateAfterAuthWithLogging(authState: any, currentPath: string): string | null {
  const logger = AuthFlowLogger.getInstance();
  const perfMonitor = AuthPerformanceMonitor.getInstance();

  logger.debug('Navigation check started', {
    authStatus: authState.status,
    role: authState.role,
    currentPath
  });

  perfMonitor.startTimer('navigation_check', { currentPath });

  try {
    const result = shouldNavigateAfterAuth(authState, currentPath);
    
    logger.info('Navigation decision made', {
      authStatus: authState.status,
      role: authState.role,
      currentPath,
      targetPath: result,
      shouldNavigate: !!result
    });

    perfMonitor.endTimer('navigation_check');
    return result;
  } catch (error) {
    logger.error('Navigation check failed', {
      error: error.message,
      authState,
      currentPath
    });

    perfMonitor.endTimer('navigation_check');
    return null;
  }
}

/**
 * Hook for monitoring authentication flows in components
 */
export function useAuthFlowMonitoring() {
  const auth = useAuth();
  const location = useLocation();
  const logger = AuthFlowLogger.getInstance();
  const perfMonitor = AuthPerformanceMonitor.getInstance();

  useEffect(() => {
    logger.debug('Auth state changed', {
      status: auth.authState.status,
      role: auth.role,
      user: auth.user?.id,
      path: location.pathname
    });
  }, [auth.authState.status, auth.role, auth.user?.id, location.pathname]);

  useEffect(() => {
    if (auth.authState.status === 'authenticating') {
      perfMonitor.startTimer('authentication_flow');
      logger.info('Authentication started');
    } else if (auth.authState.status === 'authenticated') {
      perfMonitor.endTimer('authentication_flow');
      logger.info('Authentication completed', {
        userId: auth.user?.id,
        role: auth.role
      });
    } else if (auth.authState.status === 'error') {
      perfMonitor.endTimer('authentication_flow');
      logger.error('Authentication failed', {
        error: auth.authState.status === 'error' ? auth.authState.error : 'Unknown error'
      });
    }
  }, [auth.authState.status]);

  return {
    logger,
    perfMonitor,
    getCurrentLogs: () => logger.getLogs(),
    getCurrentMetrics: () => perfMonitor.getAllMetrics(),
    exportDebugData: () => ({
      logs: logger.getLogs(),
      metrics: perfMonitor.getAllMetrics(),
      currentState: {
        authStatus: auth.authState.status,
        role: auth.role,
        user: auth.user?.id,
        path: location.pathname,
        timestamp: Date.now()
      }
    })
  };
}

/**
 * Error tracking and alerting system
 */
export class AuthErrorTracker {
  private static instance: AuthErrorTracker;
  private errors: Array<{
    id: string;
    timestamp: number;
    level: 'warning' | 'error' | 'critical';
    message: string;
    context: any;
    userId?: string;
    resolved: boolean;
  }> = [];
  private errorCounts: Map<string, number> = new Map();

  static getInstance(): AuthErrorTracker {
    if (!AuthErrorTracker.instance) {
      AuthErrorTracker.instance = new AuthErrorTracker();
    }
    return AuthErrorTracker.instance;
  }

  trackError(level: 'warning' | 'error' | 'critical', message: string, context: any, userId?: string) {
    const errorId = `${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const error = {
      id: errorId,
      timestamp: Date.now(),
      level,
      message,
      context,
      userId,
      resolved: false
    };

    this.errors.push(error);
    
    // Track error frequency
    const errorKey = `${level}:${message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Log to console and potentially send to monitoring service
    AuthFlowLogger.getInstance().error(`Error tracked: ${message}`, {
      errorId,
      level,
      context,
      userId
    });

    // Alert for critical errors
    if (level === 'critical') {
      this.sendAlert(error);
    }

    return errorId;
  }

  private sendAlert(error: any) {
    // In a real implementation, this would send alerts to monitoring services
    console.error('🚨 CRITICAL AUTH ERROR ALERT 🚨', error);
    
    // Could integrate with services like:
    // - Sentry
    // - DataDog
    // - Custom webhook
    // - Email notifications
  }

  getErrors(level?: string): typeof this.errors {
    if (!level) return [...this.errors];
    return this.errors.filter(error => error.level === level);
  }

  getErrorCounts(): Map<string, number> {
    return new Map(this.errorCounts);
  }

  resolveError(errorId: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      AuthFlowLogger.getInstance().info(`Error resolved: ${errorId}`);
    }
  }

  clearErrors() {
    this.errors = [];
    this.errorCounts.clear();
  }
}

/**
 * Real-time debugging dashboard data provider
 */
export function getAuthFlowDebugData() {
  const logger = AuthFlowLogger.getInstance();
  const perfMonitor = AuthPerformanceMonitor.getInstance();
  const errorTracker = AuthErrorTracker.getInstance();

  return {
    logs: {
      all: logger.getLogs(),
      debug: logger.getLogs('debug'),
      info: logger.getLogs('info'),
      warn: logger.getLogs('warn'),
      error: logger.getLogs('error')
    },
    performance: {
      metrics: perfMonitor.getAllMetrics(),
      averages: calculatePerformanceAverages(perfMonitor.getAllMetrics())
    },
    errors: {
      all: errorTracker.getErrors(),
      warnings: errorTracker.getErrors('warning'),
      errors: errorTracker.getErrors('error'),
      critical: errorTracker.getErrors('critical'),
      counts: Object.fromEntries(errorTracker.getErrorCounts())
    },
    summary: {
      totalLogs: logger.getLogs().length,
      totalErrors: errorTracker.getErrors().length,
      unresolvedErrors: errorTracker.getErrors().filter(e => !e.resolved).length,
      performanceIssues: Object.values(perfMonitor.getAllMetrics()).filter(m => m.duration && m.duration > 2000).length
    }
  };
}

function calculatePerformanceAverages(metrics: any) {
  const operationGroups: Map<string, number[]> = new Map();

  Object.entries(metrics).forEach(([key, metric]: [string, any]) => {
    if (metric.duration) {
      const operationType = key.split('_')[0];
      if (!operationGroups.has(operationType)) {
        operationGroups.set(operationType, []);
      }
      operationGroups.get(operationType)!.push(metric.duration);
    }
  });

  const averages: any = {};
  operationGroups.forEach((durations, operation) => {
    averages[operation] = {
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length
    };
  });

  return averages;
}

/**
 * User flow validation checklist
 */
export const USER_FLOW_VALIDATION_CHECKLIST = {
  authentication: [
    'Login form accepts valid credentials',
    'Login form rejects invalid credentials',
    'Login redirects to appropriate dashboard based on role',
    'Session is properly established after login',
    'Authentication errors are displayed clearly'
  ],
  navigation: [
    'Admin users can access admin routes',
    'Viewer users cannot access admin routes',
    'Unauthenticated users are redirected to login',
    'Post-login navigation works correctly',
    'Protected routes require authentication'
  ],
  roleDetection: [
    'RPC role fetch works correctly',
    'Table lookup fallback works when RPC fails',
    'Role changes are reflected in UI immediately',
    'Role-based permissions are enforced',
    'Default role assignment works for new users'
  ],
  sessionManagement: [
    'Inactivity warning appears at correct time',
    'Session timeout works after 30 minutes',
    'Session extension resets the timer',
    'Multi-tab activity is synchronized',
    'Session cleanup occurs on logout'
  ],
  errorRecovery: [
    'Network failures trigger retry logic',
    'Token refresh works automatically',
    'Expired tokens are handled gracefully',
    'Corrupted sessions are cleaned up',
    'Circuit breaker prevents cascading failures'
  ],
  security: [
    'Direct URL access is protected',
    'Role escalation attempts are blocked',
    'CSRF tokens are validated',
    'Session hijacking is detected',
    'Input sanitization prevents XSS'
  ]
};

/**
 * Automated flow validation runner
 */
export async function validateUserFlows(): Promise<{
  passed: string[];
  failed: string[];
  skipped: string[];
  summary: { total: number; passed: number; failed: number; skipped: number };
}> {
  const results = {
    passed: [] as string[],
    failed: [] as string[],
    skipped: [] as string[]
  };

  const logger = AuthFlowLogger.getInstance();
  logger.info('Starting automated user flow validation');

  // This would contain actual validation logic in a real implementation
  // For now, we'll simulate the validation results
  
  Object.entries(USER_FLOW_VALIDATION_CHECKLIST).forEach(([category, checks]) => {
    checks.forEach(check => {
      // Simulate validation - in reality, this would run actual tests
      const isValidationPassing = Math.random() > 0.1; // 90% pass rate for demo
      
      if (isValidationPassing) {
        results.passed.push(`${category}: ${check}`);
      } else {
        results.failed.push(`${category}: ${check}`);
      }
    });
  });

  const summary = {
    total: results.passed.length + results.failed.length + results.skipped.length,
    passed: results.passed.length,
    failed: results.failed.length,
    skipped: results.skipped.length
  };

  logger.info('User flow validation completed', summary);

  return { ...results, summary };
}