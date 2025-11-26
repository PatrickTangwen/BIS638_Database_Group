import { ReactNode } from 'react';
import { Info, Download } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
  onExport?: () => void;
  actions?: ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  tooltip,
  children,
  className = '',
  onExport,
  actions,
}: ChartContainerProps) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-primary-800">{title}</h3>
            {tooltip && (
              <div className="group relative">
                <Info className="w-4 h-4 text-primary-400 cursor-help" />
                <div className="tooltip opacity-0 group-hover:opacity-100 transition-opacity -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap max-w-xs text-wrap">
                  {tooltip}
                </div>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-primary-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onExport && (
            <button
              onClick={onExport}
              className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
              title="Export data"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

