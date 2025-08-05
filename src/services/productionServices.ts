/**
 * 🚀 Production Services Initialization
 * 
 * Initializes all production-ready services including security, monitoring,
 * and health checks in a coordinated manner.
 */

import { securityService } from './securityService';
import { createHealthCheckService, HealthCheckMiddleware } from './healthCheckService';
import { securityMiddleware } from '../utils/securityMiddleware';

/**
 * Production Services Container
 */
export class ProductionServices {
  public readonly security = securityService;
  public readonly healthCheck = createHealthCheckService(securityService);
  public readonly securityMiddleware = securityMiddleware;
  private healthCheckMiddleware: HealthCheckMiddleware;
  private initialized = false;

  constructor() {
    this.healthCheckMiddleware = new HealthCheckMiddleware(this.healthCheck);
  }

  /**
   * Initialize all production services
   */
  async initialize(options: { skipHealthChecks?: boolean } = {}): Promise<void> {
    if (this.initialized) return;

    const logger = this.security.getLogger();
    const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
    
    logger.info('Initializing production services', {
      environment,
      timestamp: new Date().toISOString(),
      skipHealthChecks: options.skipHealthChecks
    });

    try {
      // Initialize health monitoring middleware
      this.healthCheckMiddleware.monitorFetch();
      
      // Run initial health check unless skipped
      let initialHealth = null;
      if (!options.skipHealthChecks) {
        initialHealth = await this.healthCheck.getHealthStatus();
        
        if (initialHealth.status === 'unhealthy') {
          logger.error('System failed initial health check', {
            status: initialHealth.status,
            failedChecks: initialHealth.checks.filter(c => c.status === 'critical')
          });
          
          if (environment === 'production') {
            throw new Error('System failed initial health check - not ready for production');
          }
        } else if (initialHealth.status === 'degraded') {
          logger.warn('System has degraded health on startup', {
            status: initialHealth.status,
            warnings: initialHealth.checks.filter(c => c.status === 'warning')
          });
        }
      }

      // Override global fetch with secure version for production
      if (environment === 'production') {
        this.overrideGlobalFetch();
      }

      this.initialized = true;
      
      logger.info('Production services initialized successfully', {
        environment,
        healthStatus: initialHealth?.status || 'skipped',
        uptime: initialHealth?.uptime || 0,
        version: initialHealth?.version || '1.0.0'
      });

    } catch (error) {
      logger.error('Failed to initialize production services', {
        error: error instanceof Error ? error.message : 'Unknown error',
        environment
      });
      throw error;
    }
  }

  /**
   * Override global fetch with security middleware
   */
  private overrideGlobalFetch(): void {
    const originalFetch = window.fetch;
    const logger = this.security.getLogger();

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        // Use secure fetch for external requests
        if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
          return this.securityMiddleware.secureFetch(input, init);
        }
        
        // Use original fetch for relative URLs
        return originalFetch(input, init);
      } catch (error) {
        logger.error('Secure fetch failed', {
          url: typeof input === 'string' ? input : input.toString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus() {
    if (!this.initialized) {
      throw new Error('Production services not initialized');
    }

    const healthStatus = await this.healthCheck.getHealthStatus();
    const logger = this.security.getLogger();

    return {
      ...healthStatus,
      services: {
        security: 'operational',
        healthCheck: 'operational',
        securityMiddleware: 'operational'
      },
      initialized: this.initialized
    };
  }

  /**
   * Perform graceful shutdown
   */
  async shutdown(): Promise<void> {
    const logger = this.security.getLogger();
    
    logger.info('Shutting down production services');
    
    try {
      // Stop health monitoring
      this.healthCheck.stopContinuousMonitoring();
      
      this.initialized = false;
      
      logger.info('Production services shutdown completed');
    } catch (error) {
      logger.error('Error during production services shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get service health for external monitoring
   */
  async getHealthEndpoint() {
    return this.healthCheck.getSimpleHealth();
  }

  /**
   * Get detailed health report
   */
  async getDetailedHealth() {
    return this.healthCheck.getHealthStatus();
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    // This would return security-related metrics in a real implementation
    return {
      rateLimitViolations: 0, // Would track actual violations
      suspiciousActivityCount: 0, // Would track actual suspicious activity
      authenticationAttempts: 0, // Would track authentication attempts
      lastSecurityEvent: null // Would track last security event
    };
  }
}

// Create singleton instance
export const productionServices = new ProductionServices();

/**
 * Initialize production services on app startup
 */
export async function initializeProductionServices(): Promise<ProductionServices> {
  await productionServices.initialize();
  return productionServices;
}

/**
 * Global error handler for production
 */
export function setupGlobalErrorHandling(): void {
  const logger = productionServices.security.getLogger();

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
      stack: event.reason?.stack
    });
    
    // Prevent the default handling (which would log to console)
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      logger.error('Resource loading error', {
        target: event.target,
        type: event.type
      });
    }
  }, true);
}

export default productionServices;