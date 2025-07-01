
import React from 'react';
import { cn } from '@/lib/utils';

interface GaugeProps {
  value: number;
  min?: number;
  max: number;
  label: string;
  unit?: string;
  ranges?: {
    min: number;
    max: number;
    color: string;
    label: string;
  }[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min = 0,
  max,
  label,
  unit = '',
  ranges = [],
  size = 'md',
  className
}) => {
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;
  const angle = (percentage / 100) * 180 - 90; // -90 to start from left
  
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  // Determine color based on value and ranges
  const getValueColor = () => {
    if (ranges.length === 0) return '#4682B4'; // Default steel blue
    
    for (const range of ranges) {
      if (value >= range.min && value <= range.max) {
        return range.color;
      }
    }
    return '#6B7280'; // Default gray
  };

  const valueColor = getValueColor();

  // Create SVG path for the gauge arc
  const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = polarToCartesian(0, 0, outerRadius, endAngle);
    const end = polarToCartesian(0, 0, outerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
      "L", polarToCartesian(0, 0, innerRadius, startAngle).x, polarToCartesian(0, 0, innerRadius, startAngle).y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, polarToCartesian(0, 0, innerRadius, endAngle).x, polarToCartesian(0, 0, innerRadius, endAngle).y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full transform -rotate-90" viewBox="-50 -50 100 100">
          {/* Background arc */}
          <path
            d="M -40 0 A 40 40 0 0 1 40 0"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Value arc */}
          <path
            d="M -40 0 A 40 40 0 0 1 40 0"
            fill="none"
            stroke={valueColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.66" // Approximate circumference of semicircle
            strokeDashoffset={125.66 - (125.66 * percentage / 100)}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Needle */}
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-35"
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle + 90})`}
            className="transition-transform duration-1000 ease-out"
          />
          
          {/* Center dot */}
          <circle
            cx="0"
            cy="0"
            r="3"
            fill="#374151"
          />
        </svg>
        
        {/* Value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-90">
          <div className={cn("font-bold text-slate-800", textSizes[size])}>
            {typeof value === 'number' ? value.toFixed(1) : value}{unit}
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="font-semibold text-slate-700 text-sm">{label}</div>
        {ranges.length > 0 && (
          <div className="text-xs text-slate-500 mt-1">
            {ranges.find(r => value >= r.min && value <= r.max)?.label || 'Fuera de rango'}
          </div>
        )}
      </div>
    </div>
  );
};
