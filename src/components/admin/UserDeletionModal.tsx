import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserDeletionModalProps {
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
  onUserDeleted: () => void;
}

export const UserDeletionModal: React.FC<UserDeletionModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserDeleted
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const expectedConfirmation = 'ELIMINAR';
  const isConfirmationValid = confirmationText === expectedConfirmation;

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      toast({
        title: "Error",
        description: "Debes escribir 'ELIMINAR' para confirmar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeleting(true);

      // First, check if this is the last admin
      if (user.role === 'admin') {
        const { data: adminCount, error: countError } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact' })
          .eq('role', 'admin');

        if (countError) throw countError;

        if (adminCount && adminCount.length <= 1) {
          toast({
            title: "No se puede eliminar",
            description: "No puedes eliminar el último administrador del sistema",
            variant: "destructive"
          });
          return;
        }
      }

      // Delete user memberships first
      const { error: membershipError } = await supabase
        .from('memberships')
        .delete()
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      // Delete user roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      if (roleError) throw roleError;

      // Delete user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Finally, delete the user from auth.users using admin API
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

      if (authError) throw authError;

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
        variant: "default"
      });

      onUserDeleted();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Eliminar Usuario
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el usuario y todos sus datos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-medium">{user.email}</h3>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </Badge>
              </div>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>¡Advertencia!</strong> Esta acción eliminará:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>La cuenta del usuario</li>
                <li>Todas sus asignaciones de empresas</li>
                <li>Sus perfiles y configuraciones</li>
                <li>Su historial de acceso</li>
              </ul>
            </AlertDescription>
          </Alert>

          {user.role === 'admin' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este usuario es un <strong>administrador</strong>. Asegúrate de que haya otros administradores en el sistema antes de eliminarlo.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Para confirmar, escribe <strong>ELIMINAR</strong> en mayúsculas:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="ELIMINAR"
              disabled={isDeleting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={!isConfirmationValid || isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar Usuario
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};