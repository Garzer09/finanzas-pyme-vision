import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { FinancialRatiosCurrentModule } from '@/components/modules/FinancialRatiosCurrentModule';
import { CompanyHeader } from '@/components/CompanyHeader';

export const RatiosFinancierosPage = () => {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="container mx-auto p-6 space-y-6">
          <CompanyHeader />
          <FinancialRatiosCurrentModule />
        </main>
      </div>
    </div>
  );
};
