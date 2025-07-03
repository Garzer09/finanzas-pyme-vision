
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
        <svg className="w-full h-full" viewBox="-60 -60 120 60">
          {/* Background arc */}
          <path
            d="M -45 0 A 45 45 0 0 1 45 0"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="6"
            strokeLinecap="round"
          />
          
          {/* Colored ranges */}
          {ranges.map((range, index) => {
            const rangeStartAngle = ((range.min - min) / (max - min)) * 180;
            const rangeEndAngle = ((range.max - min) / (max - min)) * 180;
            const rangeStartRad = (rangeStartAngle * Math.PI) / 180;
            const rangeEndRad = (rangeEndAngle * Math.PI) / 180;
            
            const x1 = -45 * Math.cos(rangeStartRad);
            const y1 = -45 * Math.sin(rangeStartRad);
            const x2 = -45 * Math.cos(rangeEndRad);
            const y2 = -45 * Math.sin(rangeEndRad);
            
            const largeArcFlag = rangeEndAngle - rangeStartAngle > 180 ? 1 : 0;
            
            return (
              <path
                key={index}
                d={`M ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                fill="none"
                stroke={range.color}
                strokeWidth="6"
                strokeLinecap="round"
                opacity={0.7}
              />
            );
          })}
          
          {/* Value indicator arc */}
          <path
            d="M -45 0 A 45 45 0 0 1 45 0"
            fill="none"
            stroke={valueColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="141.37" // π * 45 (semicircle circumference)
            strokeDashoffset={141.37 - (141.37 * percentage / 100)}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Needle */}
          <line
            x1="0"
            y1="0"
            x2={`${-35 * Math.cos((percentage / 100 * 180) * Math.PI / 180)}`}
            y2={`${-35 * Math.sin((percentage / 100 * 180) * Math.PI / 180)}`}
            stroke="#1F2937"
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Center dot */}
          <circle
            cx="0"
            cy="0"
            r="4"
            fill="#1F2937"
          />
          
          {/* Scale marks */}
          {[0, 25, 50, 75, 100].map((mark) => {
            const markAngle = (mark / 100 * 180) * Math.PI / 180;
            const x1 = -40 * Math.cos(markAngle);
            const y1 = -40 * Math.sin(markAngle);
            const x2 = -35 * Math.cos(markAngle);
            const y2 = -35 * Math.sin(markAngle);
            
            return (
              <line
                key={mark}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6B7280"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        
        {/* Value display - positioned below the gauge */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-center">
          <div className={cn("font-bold text-slate-800", textSizes[size])}>
            {typeof value === 'number' ? value.toFixed(2) : value}{unit}
          </div>
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <div className="font-semibold text-slate-700 text-sm">{label}</div>
        {ranges.length > 0 && (
          <div className="text-xs text-slate-500">
            {ranges.find(r => value >= r.min && value <= r.max)?.label || 'Fuera de rango'}
          </div>
        )}
      </div>
    </div>
  );
};
