import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Plus,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { EnhancedUserCreationWizard } from './EnhancedUserCreationWizard';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { UserCard } from './UserCard';
import { AdminUserDashboard } from './AdminUserDashboard';
import { AdminDataManager } from './AdminDataManager';
import { AdminImpersonationProvider, useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { GeneralLedgerUploadModal } from '@/components/GeneralLedgerUploadModal';

interface AdminUserProfile {
  id: string;
  email: string;
  company_name: string;
  role: 'admin' | 'user';
  created_at: string;
  last_sign_in_at?: string;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [usersWithData, setUsersWithData] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [showUserWizard, setShowUserWizard] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'user-dashboard' | 'data-manager'>('list');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUserId, setUploadUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use the admin edge function to get users with emails
      const { data, error } = await supabase.functions.invoke('admin-users');

      if (error) throw error;

      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersDataStatus = async () => {
    try {
      // Fetch which users have financial data
      const { data: financialData, error } = await supabase
        .from('financial_data')
        .select('user_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create a map of users with data
      const dataStatus: {[key: string]: boolean} = {};
      financialData?.forEach(item => {
        dataStatus[item.user_id] = true;
      });

      setUsersWithData(dataStatus);
    } catch (error) {
      console.error('Error fetching users data status:', error);
    }
  };

  const handleUserCreated = () => {
    setShowUserWizard(false);
    fetchUsers();
  };

  const handleUserClick = (user: AdminUserProfile) => {
    setSelectedUserId(user.id);
    setCurrentView('user-dashboard');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedUserId(null);
  };

  const handleManageData = () => {
    setCurrentView('data-manager');
  };

  const handleUploadLedger = (userId: string) => {
    setUploadUserId(userId);
    setShowUploadModal(true);
  };

  const handleUploadSuccess = () => {
    // NO cerrar el modal automáticamente - dejamos que el usuario elija
    // setShowUploadModal(false);
    // setUploadUserId(null);
    
    // Refresh data status
    fetchUsersDataStatus();
    toast({
      title: "¡Éxito!",
      description: "Libro diario procesado correctamente",
    });
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      completed: "default",
      processing: "secondary", 
      error: "destructive",
      pending: "outline"
    };
    
    const labels: { [key: string]: string } = {
      completed: "Completado",
      processing: "Procesando",
      error: "Error",
      pending: "Pendiente"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUsers();
      await fetchUsersDataStatus();
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <AdminImpersonationProvider>
      <AdminDashboardContent 
        users={users}
        usersWithData={usersWithData}
        loading={loading}
        showUserWizard={showUserWizard}
        setShowUserWizard={setShowUserWizard}
        currentView={currentView}
        selectedUser={selectedUser}
        handleUserCreated={handleUserCreated}
        handleUserClick={handleUserClick}
        handleBackToList={handleBackToList}
        handleManageData={handleManageData}
        handleUploadLedger={handleUploadLedger}
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        uploadUserId={uploadUserId}
        handleUploadSuccess={handleUploadSuccess}
      />
    </AdminImpersonationProvider>
  );
};

interface AdminDashboardContentProps {
  users: AdminUserProfile[];
  usersWithData: {[key: string]: boolean};
  loading: boolean;
  showUserWizard: boolean;
  setShowUserWizard: (show: boolean) => void;
  currentView: 'list' | 'user-dashboard' | 'data-manager';
  selectedUser?: AdminUserProfile;
  handleUserCreated: () => void;
  handleUserClick: (user: AdminUserProfile) => void;
  handleBackToList: () => void;
  handleManageData: () => void;
  handleUploadLedger: (userId: string) => void;
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  uploadUserId: string | null;
  handleUploadSuccess: () => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({
  users,
  usersWithData,
  loading,
  showUserWizard,
  setShowUserWizard,
  currentView,
  selectedUser,
  handleUserCreated,
  handleUserClick,
  handleBackToList,
  handleManageData,
  handleUploadLedger,
  showUploadModal,
  setShowUploadModal,
  uploadUserId,
  handleUploadSuccess
}) => {
  const { setImpersonation } = useAdminImpersonation();

  // Set impersonation when user is selected
  React.useEffect(() => {
    if (currentView !== 'list' && selectedUser) {
      setImpersonation(selectedUser.id, {
        id: selectedUser.id,
        email: selectedUser.email,
        company_name: selectedUser.company_name
      });
    } else {
      setImpersonation(null, null);
    }
  }, [currentView, selectedUser?.id, setImpersonation]); // Fixed dependencies

  if (currentView === 'user-dashboard') {
    return (
      <AdminUserDashboard 
        onBack={handleBackToList}
        onManageData={handleManageData}
      />
    );
  }

  if (currentView === 'data-manager') {
    return (
      <AdminDataManager 
        onBack={() => currentView === 'data-manager' ? handleBackToList() : handleBackToList()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados en el sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(users.filter(u => u.company_name !== 'Sin empresa').map(u => u.company_name)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Empresas con usuarios activos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Datos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(usersWithData).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios con dashboards activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create User Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gestión de Usuarios</h2>
        <Dialog open={showUserWizard} onOpenChange={setShowUserWizard}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <EnhancedUserCreationWizard
              onComplete={handleUserCreated}
              onCancel={() => setShowUserWizard(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Haz click en cualquier usuario para acceder a su dashboard y gestionar sus datos
        </p>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay usuarios registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                hasData={usersWithData[user.id] || false}
                onClick={() => handleUserClick(user)}
                onUploadLedger={() => handleUploadLedger(user.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de carga de libro diario */}
      {uploadUserId && (
        <GeneralLedgerUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          userId={uploadUserId}
          isAdminImpersonating={true}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};