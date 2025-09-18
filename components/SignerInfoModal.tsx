import React, { useState } from 'react';
import { type SignerInfo } from '../types';
import { Icon } from './Icon';

interface SignerInfoModalProps {
  onSubmit: (info: SignerInfo) => void;
  onClose: () => void;
}

const SignerInfoModal: React.FC<SignerInfoModalProps> = ({ onSubmit, onClose }) => {
  const [fullName, setFullName] = useState('');
  const [initials, setInitials] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && initials.trim()) {
      onSubmit({ fullName: fullName.trim(), initials: initials.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Confirm Your Information</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
                Please provide your full name and initials as you would like them to appear on the signed document.
            </p>
            <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    placeholder="e.g., John Doe"
                    className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
             <div>
                <label htmlFor="initials" className="block text-sm font-medium text-slate-300 mb-1">Initials</label>
                <input
                    id="initials"
                    type="text"
                    value={initials}
                    onChange={e => setInitials(e.target.value)}
                    required
                    placeholder="e.g., JD"
                    maxLength={5}
                    className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>
        <footer className="p-4 bg-slate-800/50 border-t border-slate-700 text-right">
             <button
                type="submit"
                disabled={!fullName.trim() || !initials.trim()}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50"
            >
                Continue to Signing
            </button>
        </footer>
      </form>
    </div>
  );
};

export default SignerInfoModal;
