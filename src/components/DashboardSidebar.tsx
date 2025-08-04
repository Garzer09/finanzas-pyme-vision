import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home,
  FileText,
  Building2,
  BarChart3,
  Calculator,
  TrendingUp,
  Target,
  Zap,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Settings,
  CreditCard,
  Wallet,
  Activity,
  Users,
  AlertTriangle,
  Database,
  Percent,
  RotateCcw,
  CheckCircle,
  CircleDot,
  ChevronDown,
  ChevronUp,
  Layers,
  Briefcase,
  TrendingDown,
  Upload,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { LogOut, AlertCircle } from 'lucide-react';
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

export const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  
  // Initialize session timeout (moved here to ensure AuthProvider is available)
  useSessionTimeout({ timeoutMinutes: 120, warningMinutes: 15 });
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    situacion: true,
    supuestos: false,
    proyecciones: false,
    sensibilidad: false,
    valoracion: false,
    admin: false
  });
  
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin } = useUserRole();
  const { logoUrl } = useCompanyLogo();
  const { isImpersonating, impersonatedUserInfo, setImpersonation } = useAdminImpersonation();
  const navigate = useNavigate();

  // Function to get the section key based on current path
  const getSectionFromPath = (path: string): string | null => {
    // Admin section
    if (path.includes('/admin') || path.includes('/excel-upload')) {
      return 'admin';
    }
    
    // Section 3: Análisis Situación Actual
    if (path.includes('/cuenta-pyg') || path.includes('/balance-situacion') || 
        path.includes('/ratios-financieros') || path.includes('/flujos-caja') || 
        path.includes('/analisis-nof') || path.includes('/punto-muerto') || 
        path.includes('/endeudamiento') || path.includes('/servicio-deuda') || 
        path.includes('/pyg-analitico-actual') || 
        path.includes('/segmentos-actual')) {
      return 'situacion';
    }
    
    // Section 4: Supuestos y Plan Inversiones
    if (path.includes('/supuestos-financieros')) {
      return 'supuestos';
    }
    
    // Section 5: Proyecciones
    if (path.includes('/proyecciones')) {
      return 'proyecciones';
    }
    
    // Section 6: Análisis de Sensibilidad
    if (path.includes('/escenarios')) {
      return 'sensibilidad';
    }
    
    // Section 7: Valoración EVA
    if (path.includes('/valoracion-eva')) {
      return 'valoracion';
    }
    
    return null;
  };

  // Auto-expand section based on current route
  useEffect(() => {
    const activeSection = getSectionFromPath(currentPath);
    if (activeSection) {
      setExpandedSections(prev => {
        // Close all sections first
        const allClosed = Object.keys(prev).reduce((acc, key) => ({
          ...acc,
          [key]: false
        }), {});
        
        // Then open only the active section
        return {
          ...allClosed,
          [activeSection]: true
        };
      });
    }
  }, [currentPath]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      // Close all sections first
      const allClosed = Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {});
      
      // Then open only the clicked section if it wasn't already open
      return {
        ...allClosed,
        [section]: !prev[section]
      };
    });
  };

  const menuSections = [
    // Admin section - only visible to admins
    ...(isAdmin ? [{
      title: 'Administración',
      key: 'admin',
      expandable: false,
      items: [
        {
          path: '/admin/users',
          label: 'Panel de Administración',
          icon: Shield,
          color: 'text-primary'
        },
      ]
    }] : []),
    {
      title: '1. Resumen Ejecutivo',
      items: [
        {
          path: isAdmin && isImpersonating ? '/home' : (isAdmin ? '/admin/users' : '/home'),
          label: 'Dashboard Principal',
          icon: Home,
          color: 'text-steel-600'
        }
      ]
    },
    {
      title: '2. Descripción Empresa',
      items: [
        {
          path: '/descripcion-empresa',
          label: 'Descripción de la Empresa',
          icon: Building2,
          color: 'text-cadet-600'
        }
      ]
    },
    {
      title: '3. Análisis Situación Actual',
      key: 'situacion',
      expandable: true,
      items: [
        {
          path: '/cuenta-pyg',
          label: 'Cuenta P&G',
          icon: FileText,
          color: 'text-steel-500'
        },
        {
          path: '/balance-situacion',
          label: 'Balance Situación',
          icon: CreditCard,
          color: 'text-steel-600'
        },
        {
          path: '/ratios-financieros',
          label: 'Ratios Financieros',
          icon: Activity,
          color: 'text-warning-600'
        },
        {
          path: '/flujos-caja',
          label: 'Estado Flujos Caja',
          icon: Wallet,
          color: 'text-success-600'
        },
        {
          path: '/analisis-nof',
          label: 'Análisis NOF',
          icon: CircleDot,
          color: 'text-cadet-600'
        },
        {
          path: '/punto-muerto',
          label: 'Punto Muerto',
          icon: Target,
          color: 'text-danger-500'
        },
        {
          path: '/endeudamiento',
          label: 'Endeudamiento',
          icon: Database,
          color: 'text-steel-700'
        },
        {
          path: '/servicio-deuda',
          label: 'Servicio Deuda',
          icon: AlertTriangle,
          color: 'text-warning-500'
        },
        {
          path: '/pyg-analitico-actual',
          label: 'P&G Analítico Actual',
          icon: BarChart3,
          color: 'text-cadet-500'
        },
        {
          path: '/segmentos-actual',
          label: 'Ventas por Segmentos',
          icon: Users,
          color: 'text-steel-400'
        }
      ]
    },
    {
      title: '4. Supuestos y Plan Inversiones',
      key: 'supuestos',
      expandable: true,
      items: [
        {
          path: '/supuestos-financieros',
          label: 'Supuestos Financieros Clave',
          icon: Calculator,
          color: 'text-primary'
        }
      ]
    },
    {
      title: '5. Proyecciones (Año 1-3)',
      key: 'proyecciones',
      expandable: true,
      items: [
        {
          path: '/proyecciones',
          label: 'Proyecciones',
          icon: TrendingUp,
          color: 'text-success-500'
        }
      ]
    },
    {
      title: '6. Análisis de Sensibilidad',
      key: 'sensibilidad',
      expandable: true,
      items: [
        {
          path: '/escenarios',
          label: 'Escenarios y Sensibilidad',
          icon: TrendingDown,
          color: 'text-warning-600'
        }
      ]
    },
    {
      title: '7. Valoración EVA',
      key: 'valoracion',
      expandable: true,
      items: [
        {
          path: '/valoracion-eva',
          label: 'Valoración Integral',
          icon: DollarSign,
          color: 'text-steel-700'
        }
      ]
    },
    {
      title: '8. Conclusiones',
      items: [
        {
          path: '/conclusiones',
          label: 'Conclusiones y Recomendaciones',
          icon: FileText,
          color: 'text-steel-600'
        }
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className={cn(
      "h-screen sidebar-modern transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-80"
    )}>
      
      {/* Header with modern design */}
      <div className="p-6 border-b border-slate-200/60 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-steel-50/30 to-cadet-50/20"></div>
        {!collapsed && (
          <div className="flex items-center gap-3 relative z-10">
            <CompanyLogo 
              logoUrl={logoUrl}
              size="md"
              fallback={
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-professional bg-gradient-to-br from-steel-500 to-cadet-500">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              }
            />
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                {logoUrl ? '' : 'FinSight Pro'}
              </span>
              <p className="text-sm text-slate-600 font-medium">Análisis Financiero Integral</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2.5 hover:bg-slate-100/70 rounded-xl transition-all duration-200 text-slate-600 hover:text-steel-600 relative z-10"
          aria-label={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Admin Impersonation Banner */}
      {isAdmin && isImpersonating && impersonatedUserInfo && (
        <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-800 mb-1">Viendo como:</p>
              <p className="text-sm font-semibold text-blue-900 truncate">
                {impersonatedUserInfo.email}
              </p>
              <p className="text-xs text-blue-700 truncate">
                {impersonatedUserInfo.company_name}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setImpersonation(null, null);
              navigate('/admin/users');
            }}
            size="sm"
            variant="outline"
            className="w-full mt-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Shield className="h-3 w-3 mr-1" />
            Volver a Panel Admin
          </Button>
        </div>
      )}

      {/* Navigation with modern styling */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4">
            {section.expandable ? (
              <div>
                <button
                  onClick={() => toggleSection(section.key!)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:text-steel-600 transition-all duration-200 rounded-xl hover:bg-slate-50/80",
                    collapsed && "justify-center"
                  )}
                >
                  {!collapsed && <span className="font-semibold tracking-wide">{section.title}</span>}
                  {!collapsed && (
                    expandedSections[section.key!] ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {(!collapsed && expandedSections[section.key!]) && (
                  <div className="ml-2 mt-2 space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative text-sm font-medium",
                            active
                              ? "nav-active shadow-steel"
                              : "nav-hover text-slate-700"
                          )}
                          title={item.label}
                        >
                          <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-steel-600")} />
                          <span className="font-medium truncate tracking-wide">{item.label}</span>
                          {active && <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse" />}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {!collapsed && (
                  <h3 className="text-sm font-bold text-slate-700 px-4 py-3 mb-2 tracking-wide">
                    {section.title}
                  </h3>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative mb-1 font-medium",
                        active
                          ? "nav-active shadow-steel"
                          : "nav-hover text-slate-700"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={cn("h-5 w-5 transition-colors flex-shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-steel-600")} />
                      {!collapsed && <span className="font-medium truncate tracking-wide">{item.label}</span>}
                      {active && <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse" />}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                          {item.label}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Section */}
      <div className="mt-auto pt-4 border-t border-steel-700/30">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-steel-800/50 transition-all duration-200 rounded-lg group",
                collapsed && "justify-center"
              )}
              title={collapsed ? "Cerrar Sesión" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">Cerrar Sesión</span>}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Cerrar Sesión
                </div>
              )}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Confirmar Cierre de Sesión
              </AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder a la aplicación.
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
      </div>

    </div>
  );
};
