
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { BreakevenCurrentModule } from '@/components/modules/BreakevenCurrentModule';

export default function BreakEvenPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <BreakevenCurrentModule />
      </div>
    </div>
  );
}
