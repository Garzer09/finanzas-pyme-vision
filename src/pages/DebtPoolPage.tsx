import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DebtPoolModule } from '@/components/modules/DebtPoolModule';
import { CompanyHeader } from '@/components/CompanyHeader';

export default function DebtPoolPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="container mx-auto p-6 space-y-6">
          <CompanyHeader />
          <DebtPoolModule />
        </main>
      </div>
    </div>
  );
}
