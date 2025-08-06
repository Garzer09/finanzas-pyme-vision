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
import { SimpleUserCreationForm } from './SimpleUserCreationForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { UserCard } from './UserCard';
import { AdminUserDashboard } from './AdminUserDashboard';
import { AdminDataManager } from './AdminDataManager';
import { AdminImpersonationProvider, useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { GeneralLedgerUploadModal } from '@/components/GeneralLedgerUploadModal';
import { UserMembershipManager } from './UserMembershipManager';
import { UserManagementModal } from './UserManagementModal';

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
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [membershipUserId, setMembershipUserId] = useState<string | null>(null);
  const [selectedUserForManagement, setSelectedUserForManagement] = useState<AdminUserProfile | null>(null);
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
    setSelectedUserForManagement(user);
    setShowUserManagement(true);
  };

  const handleManageMemberships = (userId: string) => {
    setMembershipUserId(userId);
    setShowMembershipModal(true);
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
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
              {new Set(users.filter(u => u.company_name && u.company_name !== 'Sin empresa').map(u => u.company_name)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Empresas con usuarios activos
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
          <DialogContent className="max-w-md">
            <SimpleUserCreationForm
              onComplete={handleUserCreated}
              onCancel={() => setShowUserWizard(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Haz click en cualquier usuario para gestionar sus permisos y asignaciones
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
                onManageMemberships={() => handleManageMemberships(user.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de gestión de membresías */}
      {membershipUserId && (
        <UserMembershipManager
          isOpen={showMembershipModal}
          onClose={() => setShowMembershipModal(false)}
          userId={membershipUserId}
          userEmail={users.find(u => u.id === membershipUserId)?.email || ''}
          userName={users.find(u => u.id === membershipUserId)?.email || ''}
        />
      )}

      {/* Modal de gestión de usuario */}
      {selectedUserForManagement && (
        <UserManagementModal
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          user={selectedUserForManagement}
          onUserUpdated={fetchUsers}
        />
      )}
    </div>
  );
};
