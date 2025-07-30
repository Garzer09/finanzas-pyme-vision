import { useState, useEffect, useCallback } from 'react';
import { debugManager } from '@/utils/debugManager';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  recentErrors: number;
  recentWarnings: number;
  avgLoadTime: number;
  sessionId: string;
  logsCount: number;
  metricsCount: number;
  memoryUsage: any;
}

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
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

export const useDebugTools = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  useEffect(() => {
    const updateHealth = () => {
      setHealthStatus(debugManager.getHealthStatus() as HealthStatus);
      setLogs(debugManager.getLogs());
      setMetrics(debugManager.getMetrics());
      setIsDebugEnabled(localStorage.getItem('debug_mode') === 'true');
    };

    updateHealth();
    
    // Update every 5 seconds
    const interval = setInterval(updateHealth, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const logInfo = useCallback((message: string, data?: any, source?: string) => {
    debugManager.logInfo(message, data, source);
  }, []);

  const logWarning = useCallback((message: string, data?: any, source?: string) => {
    debugManager.logWarning(message, data, source);
  }, []);

  const logError = useCallback((message: string, error?: any, data?: any, source?: string) => {
    debugManager.logError(message, error, data, source);
  }, []);

  const logCritical = useCallback((message: string, error?: any, data?: any, source?: string) => {
    debugManager.logCritical(message, error, data, source);
  }, []);

  const recordMetric = useCallback((name: string, value: number, metadata?: Record<string, any>) => {
    debugManager.recordMetric(name, value, metadata);
  }, []);

  const startTimer = useCallback((name: string) => {
    return debugManager.startTimer(name);
  }, []);

  const exportLogs = useCallback(() => {
    debugManager.exportLogs();
  }, []);

  const clearLogs = useCallback(() => {
    debugManager.clearLogs();
    setLogs([]);
    setMetrics([]);
  }, []);

  const enableDebugMode = useCallback(() => {
    debugManager.enableDebugMode();
    setIsDebugEnabled(true);
  }, []);

  const disableDebugMode = useCallback(() => {
    debugManager.disableDebugMode();
    setIsDebugEnabled(false);
  }, []);

  const getFilteredLogs = useCallback((level?: string, limit: number = 50) => {
    return debugManager.getLogs(level as any, limit);
  }, []);

  const getFilteredMetrics = useCallback((name?: string, limit: number = 50) => {
    return debugManager.getMetrics(name, limit);
  }, []);

  const trackComponentLoad = useCallback((componentName: string) => {
    const endTimer = startTimer(`component_load_${componentName}`);
    
    return () => {
      endTimer();
      logInfo(`Component loaded: ${componentName}`, undefined, 'component');
    };
  }, [startTimer, logInfo]);

  const trackApiCall = useCallback((apiName: string, url: string) => {
    const endTimer = startTimer(`api_call_${apiName}`);
    
    return {
      success: (data?: any) => {
        endTimer();
        logInfo(`API call successful: ${apiName}`, { url, data }, 'api');
      },
      error: (error: any) => {
        endTimer();
        logError(`API call failed: ${apiName}`, error, { url }, 'api');
      }
    };
  }, [startTimer, logInfo, logError]);

  const trackUserAction = useCallback((action: string, metadata?: any) => {
    logInfo(`User action: ${action}`, metadata, 'user');
    recordMetric(`user_action_${action}`, 1, { timestamp: Date.now(), ...metadata });
  }, [logInfo, recordMetric]);

  return {
    // State
    healthStatus,
    logs,
    metrics,
    isDebugEnabled,
    
    // Basic logging
    logInfo,
    logWarning,
    logError,
    logCritical,
    
    // Performance tracking
    recordMetric,
    startTimer,
    
    // Data management
    exportLogs,
    clearLogs,
    getFilteredLogs,
    getFilteredMetrics,
    
    // Debug mode control
    enableDebugMode,
    disableDebugMode,
    
    // Specialized tracking
    trackComponentLoad,
    trackApiCall,
    trackUserAction
  };
};