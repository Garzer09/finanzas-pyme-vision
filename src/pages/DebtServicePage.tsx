import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DebtServiceModule } from '@/components/modules/DebtServiceModule';
import { CompanyHeader } from '@/components/CompanyHeader';

export default function DebtServicePage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="container mx-auto p-6 space-y-6">
          <CompanyHeader />
          <DebtServiceModule />
        </main>
      </div>
    </div>
  );
}
