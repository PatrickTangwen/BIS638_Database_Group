import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  onClick?: () => void;
  tooltip?: string;
  variant?: 'default' | 'positive' | 'negative' | 'info';
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className = '',
  onClick,
  tooltip,
  variant = 'default',
}: KPICardProps) {
  const variantClasses = {
    default: 'bg-white',
    positive: 'bg-gradient-to-br from-survived/5 to-survived/10 border-survived/20',
    negative: 'bg-gradient-to-br from-died/5 to-died/10 border-died/20',
    info: 'bg-gradient-to-br from-medical-blue/5 to-medical-blue/10 border-medical-blue/20',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-survived' : trend === 'down' ? 'text-died' : 'text-primary-400';

  return (
    <div
      className={`kpi-card ${variantClasses[variant]} ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary-500">{title}</span>
          {tooltip && (
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-primary-400 cursor-help" />
              <div className="tooltip opacity-0 group-hover:opacity-100 transition-opacity -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        {icon && <div className="text-primary-400">{icon}</div>}
      </div>
      
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-primary-900">{value}</span>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 ${trendColor} text-sm font-medium mb-1`}>
            <TrendIcon className="w-4 h-4" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      {subtitle && (
        <span className="text-sm text-primary-400">{subtitle}</span>
      )}
    </div>
  );
}

