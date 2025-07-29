import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminImpersonationContextType {
  impersonatedUserId: string | null;
  impersonatedUserInfo: {
    id: string;
    email: string;
    company_name: string;
  } | null;
  setImpersonation: (userId: string | null, userInfo: any) => void;
  isImpersonating: boolean;
}

const AdminImpersonationContext = createContext<AdminImpersonationContextType | undefined>(undefined);

export const useAdminImpersonation = () => {
  const context = useContext(AdminImpersonationContext);
  if (!context) {
    throw new Error('useAdminImpersonation must be used within AdminImpersonationProvider');
  }
  return context;
};

interface AdminImpersonationProviderProps {
  children: ReactNode;
}

export const AdminImpersonationProvider: React.FC<AdminImpersonationProviderProps> = ({
  children
}) => {
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedUserInfo, setImpersonatedUserInfo] = useState<any>(null);

  const setImpersonation = (userId: string | null, userInfo: any = null) => {
    setImpersonatedUserId(userId);
    setImpersonatedUserInfo(userInfo);
  };

  const isImpersonating = !!impersonatedUserId;

  return (
    <AdminImpersonationContext.Provider
      value={{
        impersonatedUserId,
        impersonatedUserInfo,
        setImpersonation,
        isImpersonating
      }}
    >
      {children}
    </AdminImpersonationContext.Provider>
  );
};