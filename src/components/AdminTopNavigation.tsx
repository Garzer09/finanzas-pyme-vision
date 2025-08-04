import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Upload, History, Users, LogOut, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export const AdminTopNavigation: React.FC = () => {
  const { signOut } = useAuth();
  
  const navItems = [
    {
      path: '/admin/empresas',
      label: 'Empresas',
      icon: Building2,
      description: 'Gestionar empresas'
    },
    {
      path: '/admin/carga-plantillas',
      label: 'Cargar Plantillas',
      icon: Upload,
      description: 'Subir datos CSV'
    },
    {
      path: '/admin/cargas',
      label: 'Histórico de Cargas',
      icon: History,
      description: 'Ver histórico'
    },
    {
      path: '/admin/users',
      label: 'Usuarios',
      icon: Users,
      description: 'Gestionar usuarios'
    }
  ];

  return (
    <div className="bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                  <span className="sm:hidden text-sm">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
          
          {/* Logout Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Confirmar Cierre de Sesión
                </AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder al panel de administración.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => signOut('/')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Cerrar Sesión
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>
      </div>
    </div>
  );
};