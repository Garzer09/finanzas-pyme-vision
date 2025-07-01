
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ModernKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

export const ModernKPICard: React.FC<ModernKPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  variant = 'default',
  className,
  onClick
}) => {
  const variantClasses = {
    default: 'kpi-card',
    success: 'kpi-card kpi-card-success',
    warning: 'kpi-card kpi-card-warning',
    danger: 'kpi-card kpi-card-danger'
  };

  const trendClasses = {
    up: 'text-success-600',
    down: 'text-danger-600',
    neutral: 'text-slate-500'
  };

  return (
    <div 
      className={cn(
        variantClasses[variant],
        'group cursor-pointer interactive',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="kpi-number text-kpi-md text-slate-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {trendValue && trend && (
              <span className={cn('text-sm font-semibold', trendClasses[trend])}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-slate-500 text-xs font-medium mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-slate-100/80 group-hover:bg-steel-100/80 transition-colors duration-200">
            <Icon className="h-6 w-6 text-steel-600" />
          </div>
        )}
      </div>
    </div>
  );
};
