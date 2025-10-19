// LoadingState Component
// Reusable loading indicator with optional message

import { forwardRef } from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message, size = 'md', className = '' }, ref) => {
    // Size configurations
    const sizeClasses = {
      sm: 'h-32',
      md: 'h-64',
      lg: 'h-96',
    };

    const spinnerSizes = {
      sm: 'h-6 w-6 border-2',
      md: 'h-8 w-8 border-4',
      lg: 'h-12 w-12 border-4',
    };

    const textSizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    return (
      <div
        ref={ref}
        className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}
      >
        <div className="text-center">
          <div
            className={`inline-block animate-spin rounded-full border-solid border-accent-600 border-r-transparent ${spinnerSizes[size]}`}
          ></div>
          {message && (
            <p className={`mt-2 text-gray-600 ${textSizes[size]}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';

export default LoadingState;