import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, Filter, Save, BarChart3, TrendingUp, Info } from 'lucide-react';
import { usePeriodContext } from '@/contexts/PeriodContext';
import { cn } from '@/lib/utils';

interface PeriodSelectorProps {
  title?: string;
  description?: string;
  showComparison?: boolean;
  compact?: boolean;
  onPeriodChange?: (periods: string[]) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  title = "Seleccionar Periodos",
  description = "Elige los periodos que quieres incluir en el análisis",
  showComparison = true,
  compact = false,
  onPeriodChange
}) => {
  const {
    availablePeriods,
    selectedPeriods,
    comparisonEnabled,
    comparisonPeriods,
    setSelectedPeriods,
    setComparisonEnabled,
    setComparisonPeriods,
    saveConfiguration,
    loading
  } = usePeriodContext();

  const [isSaving, setIsSaving] = useState(false);

  const handlePeriodToggle = (periodId: string, checked: boolean) => {
    const newSelected = checked 
      ? [...selectedPeriods, periodId]
      : selectedPeriods.filter(id => id !== periodId);
    
    setSelectedPeriods(newSelected);
    onPeriodChange?.(newSelected);
  };

  const handleComparisonToggle = (periodId: string, checked: boolean) => {
    const newComparison = checked 
      ? [...comparisonPeriods, periodId]
      : comparisonPeriods.filter(id => id !== periodId);
    
    setComparisonPeriods(newComparison);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveConfiguration();
    setIsSaving(false);
  };

  const getSelectedPeriodsCount = () => {
    return selectedPeriods.length;
  };

  const getComparisonPeriodsCount = () => {
    return comparisonPeriods.length;
  };

  const groupPeriodsByType = () => {
    const grouped = availablePeriods.reduce((acc, period) => {
      if (!acc[period.period_type]) {
        acc[period.period_type] = [];
      }
      acc[period.period_type].push(period);
      return acc;
    }, {} as Record<string, typeof availablePeriods>);

    // Ordenar cada grupo por fecha
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => new Date(b.period_date).getTime() - new Date(a.period_date).getTime());
    });

    return grouped;
  };

  const groupedPeriods = groupPeriodsByType();

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-steel-blue" />
            <span className="text-sm font-medium text-steel-blue-dark">
              Periodos: {getSelectedPeriodsCount()} seleccionados
            </span>
          </div>
          
          {showComparison && comparisonEnabled && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cadet" />
              <span className="text-sm text-professional">
                Comparativa: {getComparisonPeriodsCount()}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availablePeriods
            .filter(period => selectedPeriods.includes(period.id))
            .slice(0, 3)
            .map(period => (
              <Badge key={period.id} variant="default" className="bg-steel-blue text-white">
                {period.period_label}
              </Badge>
            ))}
          
          {selectedPeriods.length > 3 && (
            <Badge variant="outline">
              +{selectedPeriods.length - 3} más
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-steel-blue" />
            <div>
              <CardTitle className="text-steel-blue-dark">{title}</CardTitle>
              <p className="text-sm text-professional mt-1">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-steel-blue text-steel-blue">
              {getSelectedPeriodsCount()} seleccionados
            </Badge>
            
            <Button 
              onClick={handleSave}
              disabled={isSaving || loading}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading && (
          <div className="text-center text-professional">
            Cargando periodos disponibles...
          </div>
        )}

        {!loading && availablePeriods.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No se han detectado periodos aún. Los periodos se detectarán automáticamente al cargar archivos financieros.
            </AlertDescription>
          </Alert>
        )}

        {!loading && availablePeriods.length > 0 && (
          <>
            {/* Periodos principales */}
            <div className="space-y-4">
              <h4 className="font-semibold text-steel-blue-dark flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Periodos para Análisis
              </h4>
              
              {Object.entries(groupedPeriods).map(([type, periods]) => (
                <div key={type} className="space-y-2">
                  <h5 className="text-sm font-medium text-professional capitalize">
                    {type === 'yearly' ? 'Anuales' : type === 'quarterly' ? 'Trimestrales' : 'Mensuales'}
                  </h5>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {periods.map(period => (
                      <div
                        key={period.id}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200",
                          selectedPeriods.includes(period.id)
                            ? "bg-steel-blue-light border-steel-blue"
                            : "bg-white border-light-gray-200 hover:border-steel-blue"
                        )}
                      >
                        <Checkbox
                          id={`period-${period.id}`}
                          checked={selectedPeriods.includes(period.id)}
                          onCheckedChange={(checked) => handlePeriodToggle(period.id, !!checked)}
                        />
                        <label
                          htmlFor={`period-${period.id}`}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {period.period_label}
                        </label>
                        
                        {period.confidence_score < 0.8 && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(period.confidence_score * 100)}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Comparativa */}
            {showComparison && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cadet" />
                    <h4 className="font-semibold text-steel-blue-dark">Análisis Comparativo</h4>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="comparison-mode"
                      checked={comparisonEnabled}
                      onCheckedChange={setComparisonEnabled}
                    />
                    <Label htmlFor="comparison-mode" className="text-sm">
                      Habilitar comparativa
                    </Label>
                  </div>
                </div>

                {comparisonEnabled && (
                  <div className="space-y-2">
                    <p className="text-sm text-professional">
                      Selecciona periodos adicionales para comparar (ej: año anterior)
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {availablePeriods
                        .filter(period => !selectedPeriods.includes(period.id))
                        .map(period => (
                          <div
                            key={`comp-${period.id}`}
                            className={cn(
                              "flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200",
                              comparisonPeriods.includes(period.id)
                                ? "bg-cadet-light border-cadet"
                                : "bg-white border-light-gray-200 hover:border-cadet"
                            )}
                          >
                            <Checkbox
                              id={`comp-period-${period.id}`}
                              checked={comparisonPeriods.includes(period.id)}
                              onCheckedChange={(checked) => handleComparisonToggle(period.id, !!checked)}
                            />
                            <label
                              htmlFor={`comp-period-${period.id}`}
                              className="text-sm font-medium cursor-pointer flex-1"
                            >
                              {period.period_label}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};