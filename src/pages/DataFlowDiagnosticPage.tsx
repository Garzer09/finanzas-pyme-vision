import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DataFlowDiagnostic } from '@/components/DataFlowDiagnostic';

export const DataFlowDiagnosticPage: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Diagnóstico del Flujo de Datos
              </h1>
              <p className="text-gray-600 mt-2">
                Herramienta para verificar que los datos CSV procesados lleguen correctamente a las visualizaciones
              </p>
            </div>
            <DataFlowDiagnostic />
          </div>
        </main>
      </div>
    </div>
  );
};
