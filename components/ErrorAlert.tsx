import { ReactNode } from 'react';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
  action?: ReactNode;
}

export default function ErrorAlert({ message, onClose, action }: ErrorAlertProps) {
  return (
    <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-red-400 text-xl">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-red-400 font-medium">Error</h3>
          <p className="text-red-300 text-sm mt-1">{message}</p>
        </div>
        <div className="flex items-center space-x-2">
          {action}
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 transition-colors"
            aria-label="Dismiss error"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}