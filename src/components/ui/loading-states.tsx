import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton para KPIs de flujos de caja
export const CashFlowKPISkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <div className="flex items-baseline gap-2 mb-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Skeleton para gráfico de flujos
export const CashFlowChartSkeleton = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-6 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 relative">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40" />
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Skeleton className="h-32 w-32 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton para tabla detallada
export const CashFlowTableSkeleton = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center py-3 px-6 border-b border-slate-100/60">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton completo para la pantalla de flujos de caja
export const CashFlowPageSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <section className="relative">
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-steel/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-cadet/6 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <Skeleton className="h-12 w-96 mb-4" />
            <Skeleton className="h-6 w-80" />
          </div>
        </div>
      </section>

      {/* KPIs Skeleton */}
      <CashFlowKPISkeleton />

      {/* Chart Skeleton */}
      <CashFlowChartSkeleton />

      {/* Table Skeleton */}
      <CashFlowTableSkeleton />
    </div>
  );
};

// Skeleton para proyecciones
export const ProjectionsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Insights Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-64" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-32 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
