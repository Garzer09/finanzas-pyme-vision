/**
 * 🏥 Health Check Service - Production Monitoring
 * 
 * Provides real-time health monitoring and alerting for production systems.
 * Extends the existing system health check with continuous monitoring.
 */

import { performSystemHealthCheck, SystemHealthReport, SystemHealthCheck } from '@/utils/systemHealthCheck';
import { SecurityService } from './securityService';

export interface HealthCheckEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus: number;
  timeout: number;
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  activeConnections?: number;
  errorRate?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number;
  environment: string;
  checks: SystemHealthCheck[];
  performance: PerformanceMetrics;
  dependencies: DependencyStatus[];
}

export interface DependencyStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

/**
 * Production Health Check Service
 */
export class HealthCheckService {
  private securityService: SecurityService;
  private startTime: Date;
  private lastHealthCheck?: SystemHealthReport;
  private healthCheckInterval?: NodeJS.Timeout;
  private performanceMetrics: PerformanceMetrics;

  constructor(securityService: SecurityService) {
    this.securityService = securityService;
    this.startTime = new Date();
    this.performanceMetrics = {
      responseTime: 0,
      errorRate: 0
    };

    // Start continuous monitoring in production
    if (import.meta.env.VITE_ENVIRONMENT === 'production') {
      this.startContinuousMonitoring();
    }
  }

  /**
   * Get application uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Get application version
   */
  getVersion(): string {
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return import.meta.env.VITE_ENVIRONMENT || 'development';
  }

  /**
   * Check external dependencies
   */
  private async checkDependencies(): Promise<DependencyStatus[]> {
    const dependencies: DependencyStatus[] = [];

    // Check Supabase API
    const supabaseCheck = await this.checkSupabaseHealth();
    dependencies.push(supabaseCheck);

    // Check other critical dependencies here
    // e.g., external APIs, CDNs, etc.

    return dependencies;
  }

  /**
   * Check Supabase health
   */
  private async checkSupabaseHealth(): Promise<DependencyStatus> {
    const startTime = Date.now();
    
    try {
      // Simple health check to Supabase
      const response = await fetch(`https://hlwchpmogvwmpuvwmvwv.supabase.co/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsd2NocG1vZ3Z3bXB1dndtdnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ5MjMsImV4cCI6MjA2Mzg2MDkyM30.WAKJS5_qPOgzTdwNmIRo15w-SD8KyH9X6x021bEhKaY',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsd2NocG1vZ3Z3bXB1dndtdnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ5MjMsImV4cCI6MjA2Mzg2MDkyM30.WAKJS5_qPOgzTdwNmIRo15w-SD8KyH9X6x021bEhKaY`
        }
      });

      const responseTime = Date.now() - startTime;

      return {
        name: 'Supabase',
        status: response.ok ? 'up' : 'degraded',
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        name: 'Supabase',
        status: 'down',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const logger = this.securityService.getLogger();
    
    try {
      // Run system health check
      const systemHealth = await performSystemHealthCheck();
      this.lastHealthCheck = systemHealth;

      // Check dependencies
      const dependencies = await this.checkDependencies();

      // Determine overall status
      let status: HealthStatus['status'] = 'healthy';
      
      if (systemHealth.overall === 'critical' || dependencies.some(d => d.status === 'down')) {
        status = 'unhealthy';
      } else if (systemHealth.overall === 'warning' || dependencies.some(d => d.status === 'degraded')) {
        status = 'degraded';
      }

      const healthStatus: HealthStatus = {
        status,
        timestamp: new Date(),
        version: this.getVersion(),
        uptime: this.getUptime(),
        environment: this.getEnvironment(),
        checks: systemHealth.checks,
        performance: this.performanceMetrics,
        dependencies
      };

      logger.info('Health check completed', {
        status: healthStatus.status,
        uptime: healthStatus.uptime,
        environment: healthStatus.environment,
        dependencyCount: dependencies.length,
        systemChecks: systemHealth.summary
      });

      return healthStatus;
    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        status: 'unhealthy',
        timestamp: new Date(),
        version: this.getVersion(),
        uptime: this.getUptime(),
        environment: this.getEnvironment(),
        checks: [],
        performance: this.performanceMetrics,
        dependencies: []
      };
    }
  }

  /**
   * Get a simple health check response for load balancers
   */
  async getSimpleHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const health = await this.getHealthStatus();
      return {
        status: health.status === 'healthy' ? 'ok' : 'error',
        timestamp: health.timestamp.toISOString()
      };
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Start continuous health monitoring
   */
  private startContinuousMonitoring(): void {
    const logger = this.securityService.getLogger();
    
    logger.info('Starting continuous health monitoring', {
      environment: this.getEnvironment(),
      version: this.getVersion()
    });

    // Check health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        
        // Log warnings and errors
        if (health.status === 'degraded') {
          logger.warn('System health degraded', {
            status: health.status,
            checks: health.checks.filter(c => c.status !== 'healthy'),
            dependencies: health.dependencies.filter(d => d.status !== 'up')
          });
        } else if (health.status === 'unhealthy') {
          logger.error('System health critical', {
            status: health.status,
            checks: health.checks.filter(c => c.status === 'critical'),
            dependencies: health.dependencies.filter(d => d.status === 'down')
          });
        }
      } catch (error) {
        logger.error('Continuous health monitoring failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop continuous monitoring
   */
  stopContinuousMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Record response time for performance monitoring
   */
  recordResponseTime(responseTime: number): void {
    // Simple moving average
    this.performanceMetrics.responseTime = 
      (this.performanceMetrics.responseTime + responseTime) / 2;
  }

  /**
   * Record error for error rate calculation
   */
  recordError(): void {
    const currentErrorRate = this.performanceMetrics.errorRate || 0;
    this.performanceMetrics.errorRate = Math.min(currentErrorRate + 0.01, 1); // Cap at 100%
  }

  /**
   * Record successful operation (reduces error rate)
   */
  recordSuccess(): void {
    const currentErrorRate = this.performanceMetrics.errorRate || 0;
    this.performanceMetrics.errorRate = Math.max(currentErrorRate - 0.001, 0); // Floor at 0%
  }

  /**
   * Get the last health check report
   */
  getLastHealthCheck(): SystemHealthReport | undefined {
    return this.lastHealthCheck;
  }
}

/**
 * Health Check Middleware for performance monitoring
 */
export class HealthCheckMiddleware {
  private healthService: HealthCheckService;

  constructor(healthService: HealthCheckService) {
    this.healthService = healthService;
  }

  /**
   * Monitor fetch requests for performance metrics
   */
  monitorFetch(): void {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const responseTime = Date.now() - startTime;
        
        this.healthService.recordResponseTime(responseTime);
        
        if (response.ok) {
          this.healthService.recordSuccess();
        } else {
          this.healthService.recordError();
        }
        
        return response;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.healthService.recordResponseTime(responseTime);
        this.healthService.recordError();
        throw error;
      }
    };
  }
}

// Export singleton health check service
export const createHealthCheckService = (securityService: SecurityService) => {
  return new HealthCheckService(securityService);
};

export default HealthCheckService;