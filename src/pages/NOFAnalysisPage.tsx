
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { NOFModule } from '@/components/modules/NOFModule';

export default function NOFAnalysisPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <NOFModule />
      </div>
    </div>
  );
}
