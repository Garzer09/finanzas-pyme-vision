import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardPageHeader } from '@/components/DashboardPageHeader';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminSettingsPage() {
  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        <main className="container mx-auto p-6 space-y-6">
          <DashboardPageHeader 
            title="Administración del Sistema"
            subtitle="Gestiona usuarios y configuraciones del sistema"
          />
          
          <AdminDashboard />
        </main>
      </div>
    </RoleBasedAccess>
  );
}