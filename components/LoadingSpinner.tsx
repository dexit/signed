
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-[100]">
      <div className="w-16 h-16 border-4 border-t-indigo-500 border-slate-700 rounded-full animate-spin"></div>
      <p className="mt-4 text-white text-lg font-semibold">Processing...</p>
    </div>
  );
};
