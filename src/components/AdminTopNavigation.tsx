import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Upload, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdminTopNavigation: React.FC = () => {
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
    }
  ];

  return (
    <div className="bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <nav className="flex gap-1">
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
        </nav>
      </div>
    </div>
  );
};