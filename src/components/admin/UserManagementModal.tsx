import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Shield,
  Building2,
  Plus,
  Trash2,
  Calendar,
  Clock
} from 'lucide-react';
import { UserMembershipManager } from './UserMembershipManager';
import { CompanyCreationModal } from './CompanyCreationModal';
import { UserDeletionModal } from './UserDeletionModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    company_name: string;
    role: 'admin' | 'user';
    created_at: string;
    last_sign_in_at?: string;
  };
  onUserUpdated: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [showMembershipManager, setShowMembershipManager] = useState(false);
  const [showCompanyCreation, setShowCompanyCreation] = useState(false);
  const [showUserDeletion, setShowUserDeletion] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const { toast } = useToast();

  const handlePromoteToAdmin = async () => {
    if (user.role === 'admin') {
      toast({
        title: "Usuario ya es administrador",
        description: "Este usuario ya tiene permisos de administrador",
        variant: "default"
      });
      return;
    }

    try {
      setIsPromoting(true);
      const { error } = await supabase.rpc('promote_user_to_admin', {
        target_user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Usuario promovido",
        description: "El usuario ha sido promovido a administrador exitosamente",
        variant: "default"
      });

      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: "Error",
        description: "No se pudo promover el usuario a administrador",
        variant: "destructive"
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const handleCloseModal = () => {
    setShowMembershipManager(false);
    setShowCompanyCreation(false);
    setShowUserDeletion(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Gestión de Usuario
            </DialogTitle>
            <DialogDescription>
              Administra permisos y asignaciones para este usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Info */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{user.email}</h3>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{user.company_name || 'Sin empresa asignada'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Registrado: {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Último acceso: {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'Nunca'
                    }
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Management Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Acciones de Gestión</h4>
              
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={handlePromoteToAdmin}
                  disabled={user.role === 'admin' || isPromoting}
                  variant="outline"
                  className="justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {user.role === 'admin' ? 'Ya es Administrador' : 'Promover a Admin'}
                </Button>

                <Button 
                  onClick={() => setShowMembershipManager(true)}
                  variant="outline"
                  className="justify-start"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Asignar Empresas Existentes
                </Button>

                <Button 
                  onClick={() => setShowCompanyCreation(true)}
                  variant="outline"
                  className="justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nueva Empresa
                </Button>

                <Button 
                  onClick={() => setShowUserDeletion(true)}
                  variant="destructive"
                  className="justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Usuario
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleCloseModal} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      <UserMembershipManager
        isOpen={showMembershipManager}
        onClose={() => setShowMembershipManager(false)}
        userId={user.id}
        userEmail={user.email}
        userName={user.email}
      />

      <CompanyCreationModal
        isOpen={showCompanyCreation}
        onClose={() => setShowCompanyCreation(false)}
        userId={user.id}
        userEmail={user.email}
        onCompanyCreated={() => {
          onUserUpdated();
          setShowCompanyCreation(false);
        }}
      />

      <UserDeletionModal
        isOpen={showUserDeletion}
        onClose={() => setShowUserDeletion(false)}
        user={user}
        onUserDeleted={() => {
          onUserUpdated();
          setShowUserDeletion(false);
          onClose();
        }}
      />
    </>
  );
};