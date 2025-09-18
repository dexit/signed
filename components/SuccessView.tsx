import React from 'react';

interface SuccessViewProps {
  onReturn: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ onReturn }) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full">
        <svg className="w-14 h-14 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">Thank You!</h1>
      <p className="text-lg text-slate-300 max-w-md mb-8">
        Your signature has been successfully applied to the document. The document owner has been notified.
      </p>
      <button
        onClick={onReturn}
        className="px-6 py-3 text-lg font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
      >
        Return to Dashboard
      </button>
    </div>
  );
};

export default SuccessView;
