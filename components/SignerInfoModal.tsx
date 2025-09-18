import React, { useState } from 'react';
import { type SignerInfo } from '../types';
import { Icon } from './Icon';

interface SignerInfoModalProps {
  onSubmit: (info: SignerInfo) => void;
  onClose: () => void;
}

const SignerInfoModal: React.FC<SignerInfoModalProps> = ({ onSubmit, onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fName = firstName.trim();
    const lName = lastName.trim();

    if (fName && lName) {
      const fullName = `${fName} ${lName}`;
      const initials = `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase();
      onSubmit({ fullName, initials });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Confirm Your Name</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
                Please provide your name as you would like it to appear on the signed document. A digital certificate will be generated for you.
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                    <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        required
                        placeholder="e.g., John"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                 <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                    <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                        placeholder="e.g., Doe"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>
        </div>
        <footer className="p-4 bg-slate-800/50 border-t border-slate-700 text-right">
             <button
                type="submit"
                disabled={!firstName.trim() || !lastName.trim()}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50"
            >
                Continue & Sign
            </button>
        </footer>
      </form>
    </div>
  );
};

export default SignerInfoModal;