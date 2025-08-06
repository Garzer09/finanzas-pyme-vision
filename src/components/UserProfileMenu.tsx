import React, { useState, useEffect } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  ShieldCheck, 
  UserCog, 
  Building 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileMenuProps {
  userEmail?: string;
  userRole?: string;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ 
  userEmail, 
  userRole 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>(userRole || 'user');
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setUserProfile(profile);
      setCurrentRole(role?.role || 'user');
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleToggleAdmin = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', user.id);

      if (error) throw error;

      setCurrentRole(newRole);
      
      toast({
        title: "Rol actualizado",
        description: `Tu rol ha sido cambiado a ${newRole === 'admin' ? 'Administrador' : 'Usuario estándar'}`,
      });

      // Reload page to apply new permissions
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Error al cambiar rol",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = (email: string): string => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
        {role === 'admin' ? 'Admin' : 'Usuario'}
      </Badge>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {userEmail ? getUserInitials(userEmail) : 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm hidden md:inline">{userEmail?.split('@')[0]}</span>
          {getRoleBadge(currentRole)}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="pb-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userEmail?.split('@')[0]}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            <div className="flex items-center gap-2 mt-2">
              {getRoleIcon(currentRole)}
              <span className="text-xs text-muted-foreground">
                {currentRole === 'admin' ? 'Administrador' : 'Usuario estándar'}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {userProfile?.company_name && (
          <>
            <DropdownMenuItem className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm">{userProfile.company_name}</span>
                <span className="text-xs text-muted-foreground">Empresa actual</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={handleToggleAdmin}
          disabled={isLoading}
        >
          {currentRole === 'admin' ? (
            <>
              <User className="h-4 w-4" />
              <span>Quitar permisos de admin</span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              <span>Activar modo administrador</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="flex items-center gap-2 text-red-600" 
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};