import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Clock, Download, RefreshCw, Trash2 } from 'lucide-react';
import { 
  getAuthFlowDebugData, 
  useAuthFlowMonitoring, 
  validateUserFlows,
  USER_FLOW_VALIDATION_CHECKLIST 
} from '@/utils/authFlowDebugger';

interface DebugDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthFlowDebugDashboard: React.FC<DebugDashboardProps> = ({ isOpen, onClose }) => {
  const [debugData, setDebugData] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isRunningValidation, setIsRunningValidation] = useState(false);
  const { logger, perfMonitor, exportDebugData } = useAuthFlowMonitoring();

  const refreshData = () => {
    setDebugData(getAuthFlowDebugData());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const runValidation = async () => {
    setIsRunningValidation(true);
    try {
      const results = await validateUserFlows();
      setValidationResults(results);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsRunningValidation(false);
    }
  };

  const downloadDebugData = () => {
    const data = exportDebugData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auth-debug-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    logger.clearLogs();
    perfMonitor.clearMetrics();
    refreshData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Authentication Flow Debug Dashboard</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={downloadDebugData}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllData}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 overflow-hidden">
              <TabsContent value="overview" className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{debugData?.summary.totalLogs || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Active Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {debugData?.summary.unresolvedErrors || 0}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Performance Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">
                        {debugData?.summary.performanceIssues || 0}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {(debugData?.summary.unresolvedErrors || 0) === 0 ? (
                          <>
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <span className="text-green-600 font-semibold">Healthy</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-6 h-6 text-red-600" />
                            <span className="text-red-600 font-semibold">Issues</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        {debugData?.logs.all.slice(-10).map((log: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 py-1 text-sm">
                            <Badge variant={
                              log.level === 'ERROR' ? 'destructive' :
                              log.level === 'WARN' ? 'secondary' : 'default'
                            }>
                              {log.level}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="truncate">{log.message}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        {Object.entries(debugData?.performance.averages || {}).map(([operation, stats]: [string, any]) => (
                          <div key={operation} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="font-medium">{operation}</span>
                            <div className="text-right">
                              <div className="text-sm">{stats.average.toFixed(2)}ms avg</div>
                              <div className="text-xs text-gray-500">{stats.count} samples</div>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>System Logs</CardTitle>
                    <CardDescription>Real-time authentication flow logs</CardDescription>
                  </CardHeader>
                  <CardContent className="h-full pb-0">
                    <ScrollArea className="h-[400px]">
                      {debugData?.logs.all.map((log: any, index: number) => (
                        <div key={index} className="mb-2 p-2 border rounded text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              log.level === 'ERROR' ? 'destructive' :
                              log.level === 'WARN' ? 'secondary' : 'default'
                            }>
                              {log.level}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="font-mono">{log.message}</div>
                          {log.data && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-blue-600">Show data</summary>
                              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Operation timing and performance data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {Object.entries(debugData?.performance.metrics || {}).map(([key, metric]: [string, any]) => (
                        <div key={key} className="mb-3 p-3 border rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{key}</span>
                            {metric.duration && (
                              <Badge variant={metric.duration > 2000 ? 'destructive' : 'default'}>
                                {metric.duration.toFixed(2)}ms
                              </Badge>
                            )}
                          </div>
                          {metric.data && (
                            <div className="text-sm text-gray-600">
                              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(metric.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="errors" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Error Tracking</CardTitle>
                    <CardDescription>System errors and issues</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {debugData?.errors.all.map((error: any, index: number) => (
                        <div key={index} className="mb-3 p-3 border rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{error.message}</span>
                            <div className="flex gap-2">
                              <Badge variant={
                                error.level === 'critical' ? 'destructive' :
                                error.level === 'error' ? 'secondary' : 'default'
                              }>
                                {error.level}
                              </Badge>
                              {error.resolved && <Badge variant="outline">Resolved</Badge>}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>ID: {error.id}</div>
                            <div>Time: {new Date(error.timestamp).toLocaleString()}</div>
                            {error.userId && <div>User: {error.userId}</div>}
                          </div>
                          {error.context && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600">Show context</summary>
                              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="validation" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Flow Validation</CardTitle>
                    <CardDescription>Automated testing of user flows</CardDescription>
                    <Button 
                      onClick={runValidation} 
                      disabled={isRunningValidation}
                      className="w-fit"
                    >
                      {isRunningValidation ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Running Validation...
                        </>
                      ) : (
                        'Run Validation'
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {validationResults && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {validationResults.summary.passed}
                            </div>
                            <div className="text-sm text-gray-600">Passed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {validationResults.summary.failed}
                            </div>
                            <div className="text-sm text-gray-600">Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {validationResults.summary.skipped}
                            </div>
                            <div className="text-sm text-gray-600">Skipped</div>
                          </div>
                        </div>

                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {[...validationResults.passed, ...validationResults.failed, ...validationResults.skipped].map((item: string, index: number) => {
                              const isPassed = validationResults.passed.includes(item);
                              const isFailed = validationResults.failed.includes(item);
                              
                              return (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                  {isPassed && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  {isFailed && <AlertCircle className="w-4 h-4 text-red-600" />}
                                  {!isPassed && !isFailed && <Clock className="w-4 h-4 text-yellow-600" />}
                                  <span className="text-sm">{item}</span>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="checklist" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>User Flow Validation Checklist</CardTitle>
                    <CardDescription>Manual verification checklist for all user flows</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {Object.entries(USER_FLOW_VALIDATION_CHECKLIST).map(([category, checks]) => (
                        <div key={category} className="mb-6">
                          <h3 className="font-semibold mb-3 capitalize">{category}</h3>
                          <div className="space-y-2">
                            {checks.map((check, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                <input type="checkbox" className="w-4 h-4" />
                                <span className="text-sm">{check}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};