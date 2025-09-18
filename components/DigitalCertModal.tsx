import React, { useState } from 'react';
import { Icon } from './Icon';

interface DigitalCertModalProps {
  onSubmit: (p12File: File, password: string) => void;
  onClose: () => void;
}

const DigitalCertModal: React.FC<DigitalCertModalProps> = ({ onSubmit, onClose }) => {
  const [p12File, setP12File] = useState<File | null>(null);
  const [password, setPassword] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setP12File(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (p12File) {
      onSubmit(p12File, password);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Apply Digital Signature</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
                Select your digital certificate file (e.g., .p12, .pfx) and enter its password to sign the document.
            </p>
            <div>
                <label htmlFor="p12File" className="block text-sm font-medium text-slate-300 mb-1">Certificate File</label>
                <input
                    id="p12File"
                    type="file"
                    accept=".p12,.pfx"
                    onChange={handleFileChange}
                    required
                    className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
            </div>
             <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Certificate Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>
        <footer className="p-4 bg-slate-800/50 border-t border-slate-700 text-right">
             <button
                type="submit"
                disabled={!p12File || !password}
                className="px-5 py-2 text-sm font-semibold bg-green-600 rounded-md hover:bg-green-500 disabled:opacity-50"
            >
                Sign Document
            </button>
        </footer>
      </form>
    </div>
  );
};

export default DigitalCertModal;
