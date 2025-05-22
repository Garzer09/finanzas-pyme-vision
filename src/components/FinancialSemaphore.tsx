
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const FinancialSemaphore = () => {
  const indicators = [
    { name: 'Liquidez', status: 'good', value: '1.85' },
    { name: 'Rentabilidad', status: 'warning', value: '18%' },
    { name: 'Solvencia', status: 'good', value: '2.1' },
    { name: 'Tendencias', status: 'critical', value: 'Negativa' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <XCircle className="h-5 w-5" />;
      default: return null;
    }
  };

  const overallStatus = indicators.some(i => i.status === 'critical') 
    ? 'critical' 
    : indicators.some(i => i.status === 'warning') 
    ? 'warning' 
    : 'good';

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className={`p-1 rounded-full ${getStatusColor(overallStatus)}`}>
            {getStatusIcon(overallStatus)}
          </div>
          <span className="text-lg">Semáforo Financiero</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {indicators.map((indicator, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={getStatusColor(indicator.status)}>
                  {getStatusIcon(indicator.status)}
                </div>
                <span className="text-sm font-medium text-slate-700">{indicator.name}</span>
              </div>
              <span className="text-sm font-semibold text-slate-600">{indicator.value}</span>
            </div>
          ))}
          
          <div className="mt-6 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Estado: Atención Requerida</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Revisar tendencias de rentabilidad
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
