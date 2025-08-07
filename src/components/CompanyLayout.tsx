import React from 'react';

import { useCompanyParams } from '@/hooks/useCompanyParams';

interface CompanyLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component that automatically sets the company context based on URL params
 */
export const CompanyLayout: React.FC<CompanyLayoutProps> = ({ children }) => {
  useCompanyParams();

  return (
    <>
      {children}
    </>
  );
};