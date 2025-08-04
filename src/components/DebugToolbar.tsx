import React, { useState, useEffect } from 'react';
import { useDebugTools } from '@/hooks/useDebugTools';
import { DebugDashboard } from '@/components/DebugDashboard';
import { AuthFlowDebugDashboard } from '@/components/AuthFlowDebugDashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, Activity, AlertTriangle, Zap, Shield } from 'lucide-react';

export const DebugToolbar: React.FC = () => {
  const { healthStatus, isDebugEnabled, enableDebugMode } = useDebugTools();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAuthFlowDashboardOpen, setIsAuthFlowDashboardOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show toolbar in development or when debug is enabled
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      isDebugEnabled || 
                      new URLSearchParams(window.location.search).has('debug');
    setIsVisible(shouldShow);
  }, [isDebugEnabled]);

  useEffect(() => {
    // Keyboard shortcuts for debug dashboards
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 'D') {
          e.preventDefault();
          if (!isDebugEnabled) {
            enableDebugMode();
          }
          setIsDashboardOpen(true);
        } else if (e.key === 'A') {
          e.preventDefault();
          if (!isDebugEnabled) {
            enableDebugMode();
          }
          setIsAuthFlowDashboardOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDebugEnabled, enableDebugMode]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    if (!healthStatus) return <Bug className="h-4 w-4" />;
    
    switch (healthStatus.status) {
      case 'healthy':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (!healthStatus) return 'bg-gray-500';
    
    switch (healthStatus.status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {/* Status indicator */}
        {healthStatus && (
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
            <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor()}`} />
            <span className="text-xs font-medium">{healthStatus.status.toUpperCase()}</span>
            {healthStatus.recentErrors > 0 && (
              <Badge variant="destructive" className="text-xs px-1">
                {healthStatus.recentErrors}
              </Badge>
            )}
            {healthStatus.recentWarnings > 0 && (
              <Badge variant="secondary" className="text-xs px-1">
                {healthStatus.recentWarnings}
              </Badge>
            )}
          </div>
        )}

        {/* Debug buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setIsDashboardOpen(true)}
            className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
            title="Open Debug Dashboard (Ctrl+Shift+D)"
          >
            {getStatusIcon()}
          </Button>
          
          <Button
            onClick={() => setIsAuthFlowDashboardOpen(true)}
            className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
            title="Open Auth Flow Dashboard (Ctrl+Shift+A)"
            variant="outline"
          >
            <Shield className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick info on hover */}
        {healthStatus && (
          <div className="opacity-0 hover:opacity-100 transition-opacity absolute bottom-16 right-0 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg min-w-[200px] pointer-events-none">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium">{healthStatus.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="font-medium">{healthStatus.recentErrors}</span>
              </div>
              <div className="flex justify-between">
                <span>Load Time:</span>
                <span className="font-medium">{healthStatus.avgLoadTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span className="font-medium">
                  {healthStatus.memoryUsage 
                    ? `${(healthStatus.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(0)}MB`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <DebugDashboard 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
      />
      
      <AuthFlowDebugDashboard 
        isOpen={isAuthFlowDashboardOpen} 
        onClose={() => setIsAuthFlowDashboardOpen(false)} 
      />
    </>
  );
};