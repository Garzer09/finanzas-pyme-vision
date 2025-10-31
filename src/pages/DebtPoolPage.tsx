
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DebtPoolModule } from '@/components/modules/DebtPoolModule';

export default function DebtPoolPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <DebtPoolModule />
      </div>
    </div>
  );
}
