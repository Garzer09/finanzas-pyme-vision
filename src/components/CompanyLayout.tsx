import React from 'react';
import { useCompanyParams } from '@/hooks/useCompanyParams';
import { CompanyProvider } from './CompanyProvider';

interface CompanyLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component that automatically sets the company context based on URL params
 */
export const CompanyLayout: React.FC<CompanyLayoutProps> = ({ children }) => {
  useCompanyParams(); // This will automatically set the company context

  return (
    <CompanyProvider>
      {children}
    </CompanyProvider>
  );
};