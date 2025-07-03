
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { FinancialAssumptionsWizard } from '@/components/wizard/FinancialAssumptionsWizard';

export const KeyFinancialAssumptionsModule = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 overflow-auto">
          <FinancialAssumptionsWizard />
        </main>
      </div>
    </div>
  );
};
