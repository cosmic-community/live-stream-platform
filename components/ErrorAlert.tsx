interface ErrorAlertProps {
  message: string;
  onClose: () => void;
  action?: React.ReactNode;
}

export default function ErrorAlert({ message, onClose, action }: ErrorAlertProps) {
  return (
    <div className="bg-red-900 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-red-400 text-xl">⚠️</div>
          <div className="flex-1">
            <h3 className="text-red-400 font-medium mb-1">Error</h3>
            <p className="text-red-200 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {action}
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 transition-colors duration-200"
            aria-label="Close error alert"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}