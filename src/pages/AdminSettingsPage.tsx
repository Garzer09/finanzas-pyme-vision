import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardPageHeader } from '@/components/DashboardPageHeader';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50/30">
      <DashboardHeader />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <DashboardPageHeader 
            title="Panel de Administración"
            subtitle="Gestiona usuarios, configuraciones y datos de la plataforma"
          />
          
          <AdminDashboard />
        </div>
      </main>
    </div>
  );
}