import React from 'react';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { DashboardHeader } from '@/components/DashboardHeader';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

const AdminUsersPage = () => {

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        <main className="container mx-auto p-6 space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">Gestiona usuarios, archivos y configuraciones del sistema</p>
          </div>

          <AdminDashboard />
        </main>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminUsersPage;