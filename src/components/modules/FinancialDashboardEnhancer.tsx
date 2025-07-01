import React from 'react';
import { ExecutiveSummaryKPIs } from '@/components/ExecutiveSummaryKPIs';
import { CompanyHealthStatus } from '@/components/CompanyHealthStatus';
import { MainCharts } from '@/components/MainCharts';
import { GlobalFilters } from '@/components/GlobalFilters';
import { AlertPanel } from '@/components/AlertPanel';

/**
 * Enhanced dashboard component that ensures optimal visualization 
 * and integration across all financial analysis modules
 */
export const FinancialDashboardEnhancer = () => {
  return (
    <div className="space-y-8">
      {/* 2.1 Resumen Ejecutivo - High-level KPIs with evolution charts */}
      <section className="relative z-10">
        <CompanyHealthStatus />
      </section>
      
      <section className="relative z-10">
        <ExecutiveSummaryKPIs />
      </section>
      
      <section className="relative z-10">
        <GlobalFilters />
      </section>
      
      <section className="relative z-10">
        <MainCharts />
      </section>
      
      <section className="relative z-10">
        <AlertPanel />
      </section>
    </div>
  );
};