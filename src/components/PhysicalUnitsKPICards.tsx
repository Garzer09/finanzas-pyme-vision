import React from 'react';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { usePhysicalUnitsData } from '@/hooks/usePhysicalUnitsData';
import { Package, TrendingUp, Factory, Calculator, Target, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PhysicalUnitsKPICards: React.FC = () => {
  const { getPhysicalKPIs, hasPhysicalData, isLoading, error } = usePhysicalUnitsData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[120px]" />
        ))}
      </div>
    );
  }

  if (error || !hasPhysicalData()) {
    return null;
  }

  const physicalKPIs = getPhysicalKPIs();
  
  if (physicalKPIs.length === 0) {
    return null;
  }

  const getIconForKPI = (title: string) => {
    if (title.includes('Vendidas')) return Package;
    if (title.includes('Precio')) return TrendingUp;
    if (title.includes('Producido')) return Factory;
    if (title.includes('Coste')) return Calculator;
    if (title.includes('Margen')) return Target;
    if (title.includes('Rendimiento')) return Zap;
    return Package;
  };

  const getVariantForKPI = (title: string) => {
    if (title.includes('Margen') || title.includes('Rendimiento')) return 'success';
    if (title.includes('Coste')) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Factory className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Métricas Operativas
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {physicalKPIs.map((kpi, index) => {
          const IconComponent = getIconForKPI(kpi.title);
          const variant = getVariantForKPI(kpi.title);
          
          return (
            <ModernKPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              subtitle={kpi.subtitle}
              icon={IconComponent}
              variant={variant}
              trend={kpi.trend}
              trendValue={kpi.trendValue}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PhysicalUnitsKPICards;