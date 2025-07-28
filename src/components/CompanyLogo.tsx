import { cn } from '@/lib/utils';

interface CompanyLogoProps {
  logoUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: React.ReactNode;
}

export const CompanyLogo = ({ 
  logoUrl, 
  className,
  size = 'md',
  fallback 
}: CompanyLogoProps) => {
  const sizeClasses = {
    sm: 'h-8 w-auto max-w-32',
    md: 'h-10 w-auto max-w-40',
    lg: 'h-12 w-auto max-w-48'
  };

  if (!logoUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={logoUrl}
      alt="Logo de la empresa"
      className={cn(
        sizeClasses[size],
        'object-contain',
        className
      )}
      onError={(e) => {
        // Hide image if it fails to load
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};