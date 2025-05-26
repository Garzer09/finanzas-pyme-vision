
import { useState } from 'react';
import { CalendarDays, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const GlobalFilters = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('ytd');
  const [selectedSegment, setSelectedSegment] = useState('all');

  const periods = [
    { id: 'mtd', label: 'Este Mes', value: 'mtd' },
    { id: 'qtd', label: 'Este Trimestre', value: 'qtd' },
    { id: 'ytd', label: 'Este Año', value: 'ytd' },
    { id: 'last12m', label: 'Últimos 12M', value: 'last12m' },
    { id: 'custom', label: 'Personalizado', value: 'custom' }
  ];

  const segments = [
    { id: 'all', label: 'Todos los Segmentos', value: 'all' },
    { id: 'retail', label: 'Retail', value: 'retail' },
    { id: 'corporate', label: 'Corporativo', value: 'corporate' },
    { id: 'digital', label: 'Digital', value: 'digital' },
    { id: 'services', label: 'Servicios', value: 'services' }
  ];

  return (
    <Card className="bg-card/30 backdrop-blur-sm border border-border/50 p-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Título */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-teal-400" />
          <span className="font-medium text-foreground">Filtros Globales</span>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Filtro de Período */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Período
            </label>
            <div className="flex flex-wrap gap-1">
              {periods.map((period) => (
                <Button
                  key={period.id}
                  variant={selectedPeriod === period.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`text-xs transition-all duration-200 ${
                    selectedPeriod === period.value
                      ? 'bg-teal-500 hover:bg-teal-600 text-white border-teal-500'
                      : 'bg-card/50 hover:bg-teal-500/20 border-border/50 hover:border-teal-500/50'
                  }`}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtro de Segmento */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Segmento
            </label>
            <div className="flex flex-wrap gap-1">
              {segments.map((segment) => (
                <Button
                  key={segment.id}
                  variant={selectedSegment === segment.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSegment(segment.value)}
                  className={`text-xs transition-all duration-200 ${
                    selectedSegment === segment.value
                      ? 'bg-coral-500 hover:bg-coral-600 text-white border-coral-500'
                      : 'bg-card/50 hover:bg-coral-500/20 border-border/50 hover:border-coral-500/50'
                  }`}
                >
                  {segment.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Botón de aplicar/reset */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPeriod('ytd');
              setSelectedSegment('all');
            }}
            className="bg-card/50 hover:bg-card/70 border-border/50"
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};
