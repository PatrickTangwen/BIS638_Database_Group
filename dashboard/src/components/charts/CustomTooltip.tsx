interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
      {label && <div className="font-medium mb-1 border-b border-primary-600 pb-1">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            {entry.color && (
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            )}
            <span className="text-primary-300">{entry.name}:</span>
            <span className="font-medium">
              {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MortalityTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0]?.payload as {
    name?: string;
    total?: number;
    survived?: number;
    died?: number;
    mortalityRate?: number;
  } | undefined;

  if (!data) return null;

  return (
    <div className="bg-primary-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm min-w-[150px]">
      <div className="font-medium mb-2 border-b border-primary-600 pb-1">{label || data.name}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-primary-300">Total:</span>
          <span className="font-medium">{data.total?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-survived-light">Survived:</span>
          <span className="font-medium">{data.survived?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-died-light">Died:</span>
          <span className="font-medium">{data.died?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-primary-600 pt-1 mt-1">
          <span className="text-primary-300">Mortality:</span>
          <span className="font-medium">{((data.mortalityRate || 0) * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

