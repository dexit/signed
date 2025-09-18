import React from 'react';
import { Icon } from './Icon';

interface LinksModalProps {
  onClose: () => void;
}

const LinksModal: React.FC<LinksModalProps> = ({ onClose }) => {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Document is Ready for Signing</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full">
                 <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="text-slate-300 text-center mb-6">
                The document has been saved and is now out for signature. You can track its status on the dashboard. In a real application, signing links would be emailed to each recipient.
            </p>
        </div>
        <footer className="p-4 mt-auto border-t border-slate-700 text-right">
             <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500"
            >
                Return to Dashboard
            </button>
        </footer>
      </div>
    </div>
  );
};

export default LinksModal;
