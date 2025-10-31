
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
    <Card className="bg-white border border-light-gray-200 p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Título */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-steel-blue" />
          <span className="font-semibold text-gray-900">Filtros Globales</span>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Filtro de Período */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 flex items-center gap-1 font-medium">
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
                      ? 'bg-steel-blue hover:bg-steel-blue-dark text-white border-steel-blue'
                      : 'bg-white hover:bg-steel-blue-light border-light-gray-200 hover:border-steel-blue text-gray-700 hover:text-steel-blue-dark'
                  }`}
                >
                  {period.label}
                </Button>
              ))}
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

        {/* Botón de aplicar/reset */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPeriod('ytd');
              setSelectedSegment('all');
            }}
            className="bg-white hover:bg-light-gray-100 border-light-gray-200 text-gray-700 hover:text-steel-blue-dark"
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};
