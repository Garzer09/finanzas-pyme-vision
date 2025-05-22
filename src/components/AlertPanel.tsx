
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

export const AlertPanel = () => {
  const alerts = [
    {
      type: 'critical',
      title: 'Tensión de Liquidez',
      message: 'Previsión de saldo negativo en 12 días',
      action: 'Revisar calendario de pagos'
    },
    {
      type: 'warning',
      title: 'Cobertura de Deuda',
      message: 'DSCR por debajo del mínimo recomendado (1.25)',
      action: 'Analizar refinanciación'
    },
    {
      type: 'info',
      title: 'Oportunidad de Mejora',
      message: 'Período medio de cobro superior al sector',
      action: 'Optimizar gestión de cobros'
    }
  ];

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800'
        };
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Alertas y Recomendaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const config = getAlertConfig(alert.type);
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
              >
                <div className="flex items-start space-x-3">
                  <config.icon className={`h-5 w-5 ${config.iconColor} mt-0.5`} />
                  <div className="flex-1">
                    <h4 className={`font-semibold ${config.titleColor} mb-1`}>
                      {alert.title}
                    </h4>
                    <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
                    <p className="text-xs font-medium text-slate-500">
                      Acción recomendada: {alert.action}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
