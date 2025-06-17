
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
  PieChart,
  TrendingDown,
  Briefcase,
  CreditCard,
  Wallet,
  Activity,
  Users,
  AlertTriangle,
  Database,
  Percent,
  Calendar,
  LineChart,
  RotateCcw,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Layers,
  CircleDot,
  ChevronDown,
  ChevronUp
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
          color: 'text-teal-400'
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
          color: 'text-blue-400'
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
          color: 'text-indigo-400'
        },
        {
          path: '/pyg-analitico-actual',
          label: '3.2. P&G Analítico Actual',
          icon: BarChart3,
          color: 'text-purple-400'
        },
        {
          path: '/balance-actual',
          label: '3.3. Balance Actual (PGC)',
          icon: CreditCard,
          color: 'text-cyan-400'
        },
        {
          path: '/flujos-actual',
          label: '3.4. Flujos de Caja Actual',
          icon: Wallet,
          color: 'text-green-400'
        },
        {
          path: '/ratios-actual',
          label: '3.5. Ratios Financieros',
          icon: Activity,
          color: 'text-orange-400'
        },
        {
          path: '/punto-muerto-actual',
          label: '3.6. Punto Muerto Actual',
          icon: Target,
          color: 'text-red-400'
        },
        {
          path: '/endeudamiento-actual',
          label: '3.7. Endeudamiento Actual',
          icon: Database,
          color: 'text-yellow-400'
        },
        {
          path: '/servicio-deuda-actual',
          label: '3.8. Servicio Deuda Actual',
          icon: AlertTriangle,
          color: 'text-pink-400'
        },
        {
          path: '/tesoreria-actual',
          label: '3.9. Tesorería Actual',
          icon: DollarSign,
          color: 'text-emerald-400'
        },
        {
          path: '/nof-actual',
          label: '3.10. NOF Actual',
          icon: CircleDot,
          color: 'text-violet-400'
        },
        {
          path: '/segmentos-actual',
          label: '3.11. Ventas por Segmentos',
          icon: Users,
          color: 'text-teal-300'
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
          color: 'text-blue-400'
        },
        {
          path: '/estructura-costes',
          label: '4.2. Estructura de Costes',
          icon: Layers,
          color: 'text-indigo-400'
        },
        {
          path: '/capital-trabajo',
          label: '4.3. Capital de Trabajo',
          icon: RotateCcw,
          color: 'text-purple-400'
        },
        {
          path: '/endeudamiento-coste',
          label: '4.4. Endeudamiento y Coste',
          icon: Percent,
          color: 'text-cyan-400'
        },
        {
          path: '/inversiones',
          label: '4.5. Plan Inversiones (CAPEX)',
          icon: Briefcase,
          color: 'text-amber-400'
        },
        {
          path: '/supuestos',
          label: '4.6. Tasa Impositiva y Otros',
          icon: Calculator,
          color: 'text-green-400'
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
          color: 'text-emerald-400'
        },
        {
          path: '/pyg-analitico-proyectado',
          label: '5.2. P&G Analítico Proyectado',
          icon: BarChart3,
          color: 'text-violet-400'
        },
        {
          path: '/balance-proyectado',
          label: '5.3. Balance Proyectado (PGC)',
          icon: Building2,
          color: 'text-pink-400'
        },
        {
          path: '/flujos-proyectado',
          label: '5.4. Flujos de Caja Proyectado',
          icon: Wallet,
          color: 'text-orange-400'
        },
        {
          path: '/ratios-proyectado',
          label: '5.5. Ratios Proyectados',
          icon: Activity,
          color: 'text-red-400'
        },
        {
          path: '/nof-proyectado',
          label: '5.6. NOF Proyectado',
          icon: CircleDot,
          color: 'text-yellow-400'
        },
        {
          path: '/servicio-deuda-proyectado',
          label: '5.7. Servicio Deuda Proyectado',
          icon: AlertTriangle,
          color: 'text-indigo-400'
        },
        {
          path: '/segmentos-proyectado',
          label: '5.8. Ventas por Segmentos Proyectado',
          icon: Users,
          color: 'text-cyan-400'
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
          color: 'text-blue-400'
        },
        {
          path: '/escenarios',
          label: '6.2. Escenarios y Resultados',
          icon: TrendingDown,
          color: 'text-red-400'
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
          color: 'text-purple-400'
        },
        {
          path: '/calculo-eva',
          label: '7.2. Cálculo del EVA',
          icon: Calculator,
          color: 'text-green-400'
        },
        {
          path: '/interpretacion-eva',
          label: '7.3. Interpretación del EVA',
          icon: CheckCircle,
          color: 'text-teal-400'
        },
        {
          path: '/valoracion',
          label: '7.4. EVA vs. Métodos Valoración',
          icon: DollarSign,
          color: 'text-yellow-400'
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
      "h-screen bg-white/95 backdrop-blur-xl border-r border-gray-200/60 transition-all duration-300 flex flex-col shadow-xl shadow-gray-900/10",
      collapsed ? "w-16" : "w-80"
    )} style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      
      {/* Header with enhanced glass effect */}
      <div className="p-6 border-b border-gray-200/50 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-blue-50/30"></div>
        {!collapsed && (
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">Next Consultor-IA</span>
              <p className="text-sm text-gray-600 font-medium">Análisis Financiero IA</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2.5 hover:bg-gray-100/70 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900 relative z-10 backdrop-blur-sm"
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
                    "w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-all duration-200 rounded-xl hover:bg-gray-50/80 backdrop-blur-sm",
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
                              ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 transform scale-[1.02]"
                              : "hover:bg-gray-50/80 text-gray-700 hover:text-indigo-600 hover:transform hover:scale-[1.01]"
                          )}
                          title={item.label}
                        >
                          <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-gray-500 group-hover:text-indigo-600")} />
                          <span className="font-medium truncate tracking-wide">{item.label}</span>
                          {active && <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-sm" />}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {!collapsed && (
                  <h3 className="text-sm font-bold text-gray-700 px-4 py-3 mb-2 tracking-wide">
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
                          ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 transform scale-[1.02]"
                          : "hover:bg-gray-50/80 text-gray-700 hover:text-indigo-600 hover:transform hover:scale-[1.01]"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={cn("h-5 w-5 transition-colors flex-shrink-0", active ? "text-white" : "text-gray-500 group-hover:text-indigo-600")} />
                      {!collapsed && <span className="font-medium truncate tracking-wide">{item.label}</span>}
                      {active && <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-sm" />}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
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
      <div className="p-4 border-t border-gray-200/50">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50/80 text-gray-700 hover:text-indigo-600 font-medium",
            collapsed && "justify-center"
          )}
          aria-label="Configuración"
          title={collapsed ? 'Configuración' : undefined}
        >
          <Settings className="h-5 w-5 text-gray-500" />
          {!collapsed && <span className="font-medium tracking-wide">Configuración</span>}
        </button>
      </div>
    </div>
  );
};
