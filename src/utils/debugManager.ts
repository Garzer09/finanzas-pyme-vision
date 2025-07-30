type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  source: string;
  sessionId: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  stackTrace?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class DebugManager {
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private isEnabled: boolean = false;
  private maxLogs: number = 1000;
  private maxMetrics: number = 500;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = this.shouldEnableDebug();
    
    if (this.isEnabled) {
      this.initializeDebugMode();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldEnableDebug(): boolean {
    // Enable debug in development or when debug flag is set
    return (
      process.env.NODE_ENV === 'development' ||
      localStorage.getItem('debug_mode') === 'true' ||
      new URLSearchParams(window.location.search).has('debug')
    );
  }

  private initializeDebugMode(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError('Global Error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason);
    });

    // Performance observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric(entry.name, (entry as any).value || entry.duration, {
              entryType: entry.entryType,
              startTime: entry.startTime
            });
          }
        });
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (e) {
        console.warn('Performance Observer not supported');
      }
    }

    // Console override for better logging
    this.overrideConsole();
    
    // Debug panel setup
    this.createDebugPanel();
  }

  private overrideConsole(): void {
    const originalConsole = { ...console };
    
    console.log = (...args) => {
      this.log('info', args.join(' '), 'console');
      originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.log('warn', args.join(' '), 'console');
      originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.log('error', args.join(' '), 'console');
      originalConsole.error(...args);
    };
  }

  public log(level: LogLevel, message: string, source: string = 'app', data?: any): void {
    if (!this.isEnabled && level !== 'error' && level !== 'critical') return;

    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      data,
      source,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      stackTrace: level === 'error' || level === 'critical' ? new Error().stack : undefined
    };

    this.logs.unshift(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Send critical errors to server
    if (level === 'critical') {
      this.reportCriticalError(entry);
    }
  }

  public logInfo(message: string, data?: any, source?: string): void {
    this.log('info', message, source, data);
  }

  public logWarning(message: string, data?: any, source?: string): void {
    this.log('warn', message, source, data);
  }

  public logError(message: string, error?: any, data?: any, source?: string): void {
    this.log('error', message, source, { error: error?.toString(), ...data });
  }

  public logCritical(message: string, error?: any, data?: any, source?: string): void {
    this.log('critical', message, source, { error: error?.toString(), ...data });
  }

  public recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.unshift(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`timer_${name}`, duration, { type: 'timer' });
    };
  }

  public getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = level ? this.logs.filter(log => log.level === level) : this.logs;
    return filtered.slice(0, limit);
  }

  public getMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    let filtered = name ? this.metrics.filter(m => m.name.includes(name)) : this.metrics;
    return filtered.slice(0, limit);
  }

  public getHealthStatus() {
    const now = Date.now();
    const recentErrors = this.logs.filter(log => 
      (log.level === 'error' || log.level === 'critical') && 
      (now - log.timestamp) < 300000 // Last 5 minutes
    ).length;

    const recentWarnings = this.logs.filter(log => 
      log.level === 'warn' && 
      (now - log.timestamp) < 300000
    ).length;

    const avgLoadTime = this.getAverageMetric('timer_', 60000); // Last minute

    return {
      status: recentErrors > 0 ? 'error' : recentWarnings > 3 ? 'warning' : 'healthy',
      recentErrors,
      recentWarnings,
      avgLoadTime,
      sessionId: this.sessionId,
      logsCount: this.logs.length,
      metricsCount: this.metrics.length,
      memoryUsage: this.getMemoryUsage()
    };
  }

  private getAverageMetric(namePattern: string, timeWindow: number): number {
    const now = Date.now();
    const metrics = this.metrics.filter(m => 
      m.name.includes(namePattern) && 
      (now - m.timestamp) < timeWindow
    );
    
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  private getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  private async reportCriticalError(entry: LogEntry): Promise<void> {
    try {
      // Here you could send to your error reporting service
      console.error('CRITICAL ERROR REPORTED:', entry);
      
      // Store in localStorage as backup
      const criticalErrors = JSON.parse(localStorage.getItem('critical_errors') || '[]');
      criticalErrors.unshift(entry);
      localStorage.setItem('critical_errors', JSON.stringify(criticalErrors.slice(0, 10)));
    } catch (e) {
      console.error('Failed to report critical error:', e);
    }
  }

  private createDebugPanel(): void {
    if (!this.isEnabled) return;

    // Create debug panel button
    const button = document.createElement('button');
    button.innerHTML = '🐛';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      background: #000;
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      cursor: pointer;
      font-size: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    button.onclick = () => this.toggleDebugPanel();
    document.body.appendChild(button);
  }

  private toggleDebugPanel(): void {
    let panel = document.getElementById('debug-panel');
    
    if (panel) {
      panel.remove();
      return;
    }

    panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 400px;
      height: 500px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      z-index: 99998;
      overflow-y: auto;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      font-family: monospace;
      font-size: 12px;
    `;

    const health = this.getHealthStatus();
    panel.innerHTML = `
      <h3>🐛 Debug Panel</h3>
      <div style="margin-bottom: 16px;">
        <strong>Status:</strong> <span style="color: ${health.status === 'healthy' ? 'green' : health.status === 'warning' ? 'orange' : 'red'}">${health.status.toUpperCase()}</span><br/>
        <strong>Session:</strong> ${health.sessionId.slice(-8)}<br/>
        <strong>Errors:</strong> ${health.recentErrors}<br/>
        <strong>Warnings:</strong> ${health.recentWarnings}<br/>
        <strong>Avg Load:</strong> ${health.avgLoadTime.toFixed(2)}ms<br/>
        <strong>Memory:</strong> ${health.memoryUsage ? `${(health.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` : 'N/A'}
      </div>
      <div>
        <button onclick="debugManager.exportLogs()" style="margin-right: 8px;">Export Logs</button>
        <button onclick="debugManager.clearLogs()">Clear</button>
      </div>
      <div style="margin-top: 16px; max-height: 300px; overflow-y: auto;">
        ${this.getLogs(undefined, 20).map(log => `
          <div style="margin-bottom: 8px; padding: 4px; background: ${this.getLogColor(log.level)}; border-radius: 4px;">
            <strong>${log.level.toUpperCase()}</strong> [${new Date(log.timestamp).toLocaleTimeString()}]<br/>
            ${log.message}<br/>
            <small>${log.source}</small>
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(panel);
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case 'error': return '#ffebee';
      case 'critical': return '#ffcdd2';
      case 'warn': return '#fff3e0';
      case 'info': return '#e3f2fd';
      default: return '#f5f5f5';
    }
  }

  public exportLogs(): void {
    const data = {
      logs: this.logs,
      metrics: this.metrics,
      health: this.getHealthStatus(),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${this.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public clearLogs(): void {
    this.logs = [];
    this.metrics = [];
    console.log('Debug logs cleared');
  }

  public enableDebugMode(): void {
    localStorage.setItem('debug_mode', 'true');
    this.isEnabled = true;
    this.initializeDebugMode();
  }

  public disableDebugMode(): void {
    localStorage.setItem('debug_mode', 'false');
    this.isEnabled = false;
  }
}

// Global instance
export const debugManager = new DebugManager();

// Make it available globally for console access
(window as any).debugManager = debugManager;
