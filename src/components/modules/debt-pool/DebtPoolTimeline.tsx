import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, CreditCard } from 'lucide-react';

interface VencimientoItem {
  id: string;
  entidad: string;
  tipo: string;
  importe: number;
  fecha: string;
  daysUntil: number;
  urgency: 'alta' | 'media' | 'baja';
}

interface DebtPoolTimelineProps {
  vencimientos: VencimientoItem[];
}

export const DebtPoolTimeline = ({ vencimientos }: DebtPoolTimelineProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getUrgencyConfig = (urgency: 'alta' | 'media' | 'baja') => {
    switch (urgency) {
      case 'alta': 
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          badge: 'destructive',
          iconColor: 'text-red-600',
          label: '< 30 días'
        };
      case 'media': 
        return {
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          badge: 'secondary',
          iconColor: 'text-amber-600',
          label: '30-90 días'
        };
      case 'baja': 
        return {
          color: 'text-green-700 bg-green-50 border-green-200',
          badge: 'default',
          iconColor: 'text-green-600',
          label: '> 90 días'
        };
    }
  };

  const formatDaysLabel = (days: number) => {
    if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `En ${days} días`;
  };

  const handlePay = (id: string) => {
    console.log(`Processing payment for debt ${id}`);
    // TODO: Implement payment processing
  };

  // Group by urgency
  const groupedVencimientos = vencimientos.reduce((acc, item) => {
    if (!acc[item.urgency]) {
      acc[item.urgency] = [];
    }
    acc[item.urgency].push(item);
    return acc;
  }, {} as Record<'alta' | 'media' | 'baja', VencimientoItem[]>);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#005E8A]" />
          Calendario de Vencimientos
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Accordion type="multiple" defaultValue={['alta', 'media']} className="w-full">
          {(['alta', 'media', 'baja'] as const).map((urgency) => {
            const items = groupedVencimientos[urgency] || [];
            const config = getUrgencyConfig(urgency);
            
            if (items.length === 0) return null;

            return (
              <AccordionItem key={urgency} value={urgency}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${config.color}`}>
                      <AlertTriangle className={`h-4 w-4 ${config.iconColor}`} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {urgency === 'alta' ? 'Urgente' : urgency === 'media' ? 'Próximo' : 'Futuro'}
                        </span>
                        <Badge variant={config.badge as any} className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-sm text-slate-500">
                        {items.length} vencimiento{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-lg border ${config.color} hover:shadow-sm transition-shadow`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className={`h-4 w-4 ${config.iconColor}`} />
                            <div>
                              <div className="font-medium text-slate-900">
                                {item.entidad}
                              </div>
                              <div className="text-sm text-slate-600">
                                {item.tipo}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatDaysLabel(item.daysUntil)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-slate-900">
                              {formatCurrency(item.importe)}
                            </div>
                            <div className="text-sm text-slate-600">
                              {new Date(item.fecha).toLocaleDateString('es-ES')}
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2 h-6 px-2 text-xs"
                              onClick={() => handlePay(item.id)}
                            >
                              Pagar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        
        {vencimientos.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No hay vencimientos próximos registrados.
          </div>
        )}
      </CardContent>
    </Card>
  );
};