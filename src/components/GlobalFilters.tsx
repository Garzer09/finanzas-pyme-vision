
import { useState, useEffect } from 'react';
import { CalendarDays, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PeriodSelector } from '@/components/PeriodSelector';
import { usePeriodContext } from '@/contexts/PeriodContext';

export const GlobalFilters = () => {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  
  const { selectedPeriods, availablePeriods } = usePeriodContext();

  const segments = [
    { id: 'all', label: 'Todos los Segmentos', value: 'all' },
    { id: 'retail', label: 'Retail', value: 'retail' },
    { id: 'corporate', label: 'Corporativo', value: 'corporate' },
    { id: 'digital', label: 'Digital', value: 'digital' },
    { id: 'services', label: 'Servicios', value: 'services' }
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-white border border-light-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Título */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-steel-blue" />
            <span className="font-semibold text-gray-900">Filtros Globales</span>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* Filtro de Período - Vista compacta */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 flex items-center gap-1 font-medium">
                <CalendarDays className="h-4 w-4" />
                Periodos Activos
              </label>
              <div className="flex items-center gap-2">
                <PeriodSelector compact />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                  className="bg-white hover:bg-steel-blue-light border-light-gray-200 hover:border-steel-blue text-gray-700 hover:text-steel-blue-dark"
                >
                  Configurar
                </Button>
              </div>
            </div>

            {/* Filtro de Segmento */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 flex items-center gap-1 font-medium">
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
                        ? 'bg-steel-blue-dark hover:bg-steel-blue text-white border-steel-blue-dark'
                        : 'bg-white hover:bg-light-gray-100 border-light-gray-200 hover:border-steel-blue text-gray-700 hover:text-steel-blue-dark'
                    }`}
                  >
                    {segment.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Botón de reset */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSegment('all');
              }}
              className="bg-white hover:bg-light-gray-100 border-light-gray-200 text-gray-700 hover:text-steel-blue-dark"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Selector de periodos expandido */}
      {showPeriodSelector && (
        <PeriodSelector 
          showComparison={true}
          onPeriodChange={() => setShowPeriodSelector(false)}
        />
      )}
    </div>
  );
};
