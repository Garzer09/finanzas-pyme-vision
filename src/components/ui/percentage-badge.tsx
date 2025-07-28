import { cn } from '@/lib/utils';

interface PercentageBadgeProps {
  percentage: number;
  className?: string;
}

export const PercentageBadge = ({ percentage, className }: PercentageBadgeProps) => {
  const getVariant = (value: number) => {
    if (value >= 20) return 'success';
    if (value >= 10) return 'warning';
    return 'neutral';
  };

  const variant = getVariant(percentage);
  
  const variantClasses = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200'
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {percentage.toFixed(1)}%
    </span>
  );
};