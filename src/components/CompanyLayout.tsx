import React from 'react';

import { CompanyProvider } from './CompanyProvider';

interface CompanyLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component that automatically sets the company context based on URL params
 */
export const CompanyLayout: React.FC<CompanyLayoutProps> = ({ children }) => {
  

  return (
    <CompanyProvider>
      {children}
    </CompanyProvider>
  );
};