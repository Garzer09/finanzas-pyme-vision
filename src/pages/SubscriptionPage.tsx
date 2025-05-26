
import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { SubscriptionManager } from '@/components/SubscriptionManager';

const SubscriptionPage = () => {
  return (
    <div className="flex min-h-screen bg-navy-800">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <SubscriptionManager />
        </main>
      </div>
    </div>
  );
};

export default SubscriptionPage;
