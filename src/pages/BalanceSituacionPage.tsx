import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { BalanceSheetCurrentModule } from '@/components/modules/BalanceSheetCurrentModule';
import { CompanyProvider } from '@/components/CompanyProvider';
import { CompanyHeader } from '@/components/CompanyHeader';

export const BalanceSituacionPage = () => {
  return (
    <CompanyProvider>
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="container mx-auto p-6 space-y-6">
            <CompanyHeader />
            <BalanceSheetCurrentModule />
          </main>
        </div>
      </div>
    </CompanyProvider>
  );
};