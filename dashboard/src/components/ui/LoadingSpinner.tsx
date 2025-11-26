export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-primary-200 border-t-medical-blue rounded-full animate-spin`}
      />
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg text-primary-600 font-medium">{message}</p>
    </div>
  );
}

