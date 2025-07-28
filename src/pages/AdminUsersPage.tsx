import React from 'react';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

const AdminUsersPage = () => {

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Panel de Administración</h1>
              <p className="text-muted-foreground">Gestiona usuarios, archivos y configuraciones del sistema</p>
            </div>

            <AdminDashboard />
          </main>
        </div>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminUsersPage;