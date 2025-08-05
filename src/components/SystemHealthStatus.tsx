import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { performSystemHealthCheck, type SystemHealthReport } from '@/utils/systemHealthCheck';
import { validateProductionStability, type StabilityCheckResult } from '@/utils/productionStabilityValidator';

/**
 * 🚨 CRISIS RESPONSE: System Health Status Component
 * 
 * Real-time system health monitoring for the stabilization period
 */
export const SystemHealthStatus: React.FC = () => {
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);
  const [stabilityReport, setStabilityReport] = useState<StabilityCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const [health, stability] = await Promise.all([
        performSystemHealthCheck(),
        validateProductionStability()
      ]);
      
      setHealthReport(health);
      setStabilityReport(stability);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    
    // Auto-refresh every 5 minutes during stabilization
    const interval = setInterval(runHealthCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOverallProgress = () => {
    if (!healthReport) return 0;
    const { healthy, total } = healthReport.summary;
    return (healthy / total) * 100;
  };

  // Only show in development or when debugging is enabled
  if (import.meta.env.PROD && import.meta.env.VITE_DEBUG_MODE !== 'true') {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">System Health Status</CardTitle>
            <Badge variant={healthReport?.overall === 'healthy' ? 'default' : 
                          healthReport?.overall === 'warning' ? 'secondary' : 'destructive'}>
              {healthReport?.overall?.toUpperCase() || 'CHECKING...'}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runHealthCheck}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Real-time monitoring during system stabilization period
          {lastUpdate && (
            <span className="block text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        {healthReport && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>System Health</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>
        )}

        {/* Component Health Checks */}
        {healthReport && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Component Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {healthReport.checks.map((check, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                  {getStatusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                      {check.component}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {check.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Production Stability Status */}
        {stabilityReport && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Production Readiness</h4>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                {stabilityReport.isStable ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`font-medium ${stabilityReport.isStable ? 'text-green-600' : 'text-red-600'}`}>
                  {stabilityReport.isStable ? 'STABLE' : 'UNSTABLE'}
                </span>
              </div>
              
              {stabilityReport.criticalIssues.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-red-600 mb-1">Critical Issues:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {stabilityReport.criticalIssues.slice(0, 3).map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                    {stabilityReport.criticalIssues.length > 3 && (
                      <li>• ... and {stabilityReport.criticalIssues.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {stabilityReport.warnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-600 mb-1">Warnings:</p>
                  <ul className="text-xs text-yellow-600 space-y-1">
                    {stabilityReport.warnings.slice(0, 2).map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                    {stabilityReport.warnings.length > 2 && (
                      <li>• ... and {stabilityReport.warnings.length - 2} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !healthReport && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Running system health check...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthStatus;