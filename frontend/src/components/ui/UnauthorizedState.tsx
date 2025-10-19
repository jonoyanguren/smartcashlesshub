import type { FC } from 'react';

interface UnauthorizedStateProps {
  message?: string;
  description?: string;
  className?: string;
}

const UnauthorizedState: FC<UnauthorizedStateProps> = ({
  message = 'Unauthorized Access',
  description = 'You do not have permission to access this resource.',
  className = '',
}) => {
  return (
    <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md mx-auto px-4">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {message}
        </h2>
        <p className="text-gray-600 mb-6">
          {description}
        </p>

        {/* Additional Info */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedState;