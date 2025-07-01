
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DebtServiceModule } from '@/components/modules/DebtServiceModule';

export default function DebtServicePage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <DebtServiceModule />
      </div>
    </div>
  );
}
