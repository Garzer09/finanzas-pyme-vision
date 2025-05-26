
import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { KPICardsAnimated } from '@/components/KPICardsAnimated';
import { GlobalFilters } from '@/components/GlobalFilters';
import { MainCharts } from '@/components/MainCharts';
import { FinancialSemaphore } from '@/components/FinancialSemaphore';
import { AlertPanel } from '@/components/AlertPanel';

const Index = () => {
  return (
    <div className="flex min-h-screen bg-navy-800">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Data wave background effect */}
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          {/* KPI Cards Section */}
          <section className="relative z-10">
            <KPICardsAnimated />
          </section>
          
          {/* Global Filters */}
          <section className="relative z-10">
            <GlobalFilters />
          </section>
          
          {/* Financial Semaphore */}
          <section className="relative z-10">
            <FinancialSemaphore />
          </section>
          
          {/* Main Charts Grid */}
          <section className="relative z-10">
            <MainCharts />
          </section>
          
          {/* Alert Panel */}
          <section className="relative z-10">
            <AlertPanel />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
