import { useState, useCallback, useRef, useEffect } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatLabel?: (value: number) => string;
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  formatLabel = String,
}: RangeSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<'min' | 'max' | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getPercentage = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return min;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const handleMouseDown = useCallback((type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = type;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newValue = getValueFromPosition(moveEvent.clientX);
      
      setLocalValue((prev) => {
        if (type === 'min') {
          return [Math.min(newValue, prev[1] - step), prev[1]];
        } else {
          return [prev[0], Math.max(newValue, prev[0] + step)];
        }
      });
    };
    
    const handleMouseUp = () => {
      isDragging.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      setLocalValue((current) => {
        onChange(current);
        return current;
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getValueFromPosition, onChange, step]);

  const minPercent = getPercentage(localValue[0]);
  const maxPercent = getPercentage(localValue[1]);

  return (
    <div className="space-y-2">
      <div className="relative h-6 flex items-center" ref={trackRef}>
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-primary-200 rounded-full" />
        
        {/* Active track */}
        <div
          className="absolute h-1.5 bg-medical-blue rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
        
        {/* Min thumb */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-medical-blue rounded-full cursor-grab shadow-md hover:scale-110 transition-transform -translate-x-1/2"
          style={{ left: `${minPercent}%` }}
          onMouseDown={handleMouseDown('min')}
        />
        
        {/* Max thumb */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-medical-blue rounded-full cursor-grab shadow-md hover:scale-110 transition-transform -translate-x-1/2"
          style={{ left: `${maxPercent}%` }}
          onMouseDown={handleMouseDown('max')}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-xs text-primary-500">
        <span className="font-medium text-primary-700">{formatLabel(localValue[0])}</span>
        <span className="font-medium text-primary-700">{formatLabel(localValue[1])}</span>
      </div>
    </div>
  );
}

