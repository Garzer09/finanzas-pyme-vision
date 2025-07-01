
import { useState } from 'react';
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
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    situacion: false,
    supuestos: false,
    proyecciones: false,
    sensibilidad: false,
    valoracion: false
  });
  
  const location = useLocation();
  const currentPath = location.pathname;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuSections = [
    {
      title: '1. Resumen Ejecutivo',
      items: [
        {
          path: '/',
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
      title: '3. Situación Actual (Año 0)',
      key: 'situacion',
      expandable: true,
      items: [
        {
          path: '/pyg-actual',
          label: '3.1. P&G Actual (PGC)',
          icon: FileText,
          color: 'text-steel-500'
        },
        {
          path: '/pyg-analitico-actual',
          label: '3.2. P&G Analítico Actual',
          icon: BarChart3,
          color: 'text-cadet-500'
        },
        {
          path: '/balance-actual',
          label: '3.3. Balance Actual (PGC)',
          icon: CreditCard,
          color: 'text-steel-600'
        },
        {
          path: '/flujos-actual',
          label: '3.4. Flujos de Caja Actual',
          icon: Wallet,
          color: 'text-success-600'
        },
        {
          path: '/ratios-actual',
          label: '3.5. Ratios Financieros',
          icon: Activity,
          color: 'text-warning-600'
        },
        {
          path: '/punto-muerto-actual',
          label: '3.6. Punto Muerto Actual',
          icon: Target,
          color: 'text-danger-500'
        },
        {
          path: '/endeudamiento-actual',
          label: '3.7. Endeudamiento Actual',
          icon: Database,
          color: 'text-steel-700'
        },
        {
          path: '/servicio-deuda-actual',
          label: '3.8. Servicio Deuda Actual',
          icon: AlertTriangle,
          color: 'text-warning-500'
        },
        {
          path: '/tesoreria-actual',
          label: '3.9. Tesorería Actual',
          icon: DollarSign,
          color: 'text-success-500'
        },
        {
          path: '/nof-actual',
          label: '3.10. NOF Actual',
          icon: CircleDot,
          color: 'text-cadet-600'
        },
        {
          path: '/segmentos-actual',
          label: '3.11. Ventas por Segmentos',
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
          path: '/premisas-ingresos',
          label: '4.1. Premisas de Ingresos',
          icon: TrendingUp,
          color: 'text-success-600'
        },
        {
          path: '/estructura-costes',
          label: '4.2. Estructura de Costes',
          icon: Layers,
          color: 'text-steel-600'
        },
        {
          path: '/capital-trabajo',
          label: '4.3. Capital de Trabajo',
          icon: RotateCcw,
          color: 'text-cadet-600'
        },
        {
          path: '/endeudamiento-coste',
          label: '4.4. Endeudamiento y Coste',
          icon: Percent,
          color: 'text-warning-600'
        },
        {
          path: '/inversiones',
          label: '4.5. Plan Inversiones (CAPEX)',
          icon: Briefcase,
          color: 'text-steel-700'
        },
        {
          path: '/supuestos',
          label: '4.6. Tasa Impositiva y Otros',
          icon: Calculator,
          color: 'text-cadet-500'
        }
      ]
    },
    {
      title: '5. Proyecciones (Año 1-3)',
      key: 'proyecciones',
      expandable: true,
      items: [
        {
          path: '/pyg-proyectado',
          label: '5.1. P&G Proyectado (PGC)',
          icon: FileText,
          color: 'text-success-500'
        },
        {
          path: '/pyg-analitico-proyectado',
          label: '5.2. P&G Analítico Proyectado',
          icon: BarChart3,
          color: 'text-steel-500'
        },
        {
          path: '/balance-proyectado',
          label: '5.3. Balance Proyectado (PGC)',
          icon: Building2,
          color: 'text-cadet-500'
        },
        {
          path: '/flujos-proyectado',
          label: '5.4. Flujos de Caja Proyectado',
          icon: Wallet,
          color: 'text-success-600'
        },
        {
          path: '/ratios-proyectado',
          label: '5.5. Ratios Proyectados',
          icon: Activity,
          color: 'text-warning-500'
        },
        {
          path: '/nof-proyectado',
          label: '5.6. NOF Proyectado',
          icon: CircleDot,
          color: 'text-steel-600'
        },
        {
          path: '/servicio-deuda-proyectado',
          label: '5.7. Servicio Deuda Proyectado',
          icon: AlertTriangle,
          color: 'text-danger-500'
        },
        {
          path: '/segmentos-proyectado',
          label: '5.8. Ventas por Segmentos Proyectado',
          icon: Users,
          color: 'text-cadet-600'
        }
      ]
    },
    {
      title: '6. Análisis de Sensibilidad',
      key: 'sensibilidad',
      expandable: true,
      items: [
        {
          path: '/metodologia-sensibilidad',
          label: '6.1. Metodología',
          icon: Target,
          color: 'text-steel-600'
        },
        {
          path: '/escenarios',
          label: '6.2. Escenarios y Resultados',
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
          path: '/introduccion-eva',
          label: '7.1. Introducción al EVA',
          icon: Zap,
          color: 'text-steel-500'
        },
        {
          path: '/calculo-eva',
          label: '7.2. Cálculo del EVA',
          icon: Calculator,
          color: 'text-success-600'
        },
        {
          path: '/interpretacion-eva',
          label: '7.3. Interpretación del EVA',
          icon: CheckCircle,
          color: 'text-cadet-600'
        },
        {
          path: '/valoracion',
          label: '7.4. EVA vs. Métodos Valoración',
          icon: DollarSign,
          color: 'text-steel-700'
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
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-professional bg-gradient-to-br from-steel-500 to-cadet-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">Next Consultor-IA</span>
              <p className="text-sm text-slate-600 font-medium">Análisis Financiero Profesional</p>
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

      {/* Footer with enhanced styling */}
      <div className="p-4 border-t border-slate-200/50">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-slate-50/80 text-slate-700 hover:text-steel-600 font-medium",
            collapsed && "justify-center"
          )}
          aria-label="Configuración"
          title={collapsed ? 'Configuración' : undefined}
        >
          <Settings className="h-5 w-5 text-slate-500" />
          {!collapsed && <span className="font-medium tracking-wide">Configuración</span>}
        </button>
      </div>
    </div>
  );
};
