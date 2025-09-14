import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { FinancialWizard } from '@/components/wizard/FinancialWizard';

export const FinancialWizardPage = () => {
  const { companyId } = useParams<{ companyId: string }>();

  if (!companyId) {
    return <Navigate to="/admin/empresas" replace />;
  }

  return <FinancialWizard companyId={companyId} />;
};