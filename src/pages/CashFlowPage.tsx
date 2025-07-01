
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { CashFlowCurrentModule } from '@/components/modules/CashFlowCurrentModule';

export default function CashFlowPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <CashFlowCurrentModule />
      </div>
    </div>
  );
}
