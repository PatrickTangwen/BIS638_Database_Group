import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = 'Select...' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText = value.length === 0 
    ? placeholder 
    : value.length === 1 
      ? options.find((o) => o.value === value[0])?.label || value[0]
      : `${value.length} selected`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-base flex items-center justify-between gap-2 text-left"
      >
        <span className={value.length === 0 ? 'text-primary-400' : 'text-primary-800 truncate'}>
          {displayText}
        </span>
        <div className="flex items-center gap-1">
          {value.length > 0 && (
            <button
              onClick={clearSelection}
              className="p-0.5 hover:bg-primary-200 rounded transition-colors"
            >
              <X className="w-3 h-3 text-primary-500" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-primary-200 rounded-lg shadow-elevated max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-primary-400">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    isSelected ? 'bg-medical-blue/10 text-medical-blue' : 'hover:bg-primary-50 text-primary-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-medical-blue border-medical-blue' : 'border-primary-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

