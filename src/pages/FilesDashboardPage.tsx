import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { FileProcessingDashboard } from '@/components/FileProcessingDashboard';

const FilesDashboardPage = () => {
  return (
    <div className="min-h-screen bg-light-gray-bg">
      <DashboardHeader />
      
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-steel-blue-dark">
            Dashboard de Archivos
          </h1>
          <p className="text-professional text-lg">
            Gestiona y analiza todos los archivos financieros procesados
          </p>
        </div>

        <FileProcessingDashboard />
      </div>
    </div>
  );
};

export default FilesDashboardPage;