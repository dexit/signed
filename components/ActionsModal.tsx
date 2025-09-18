import React from 'react';
import { type Template } from '../types';
import { Icon } from './Icon';

interface ActionsModalProps {
  template: Template;
  onClose: () => void;
  onSignRequest: (templateId: string, recipientId: string) => void;
}

const ActionsModal: React.FC<ActionsModalProps> = ({ template, onClose, onSignRequest }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Signing link copied to clipboard!");
        }, (err) => {
            alert("Failed to copy link.");
            console.error('Could not copy text: ', err);
        });
    }

    const resendInvitation = (recipientName: string) => {
        alert(`A new signing invitation has been sent to ${recipientName}.`);
    }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Recipient Actions</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-1">{template.fileName}</h3>
            <p className="text-slate-400 mb-4">Choose an action for a recipient.</p>
            <ul className="space-y-3">
                {template.recipients.map(recipient => {
                    const signingLink = `${window.location.origin}${window.location.pathname}?templateId=${template.id}&recipientId=${recipient.id}`;
                    return (
                        <li key={recipient.id} className="bg-slate-700 p-3 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <p className="font-semibold">{recipient.name}</p>
                                <p className="text-sm text-slate-400">{recipient.email}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                {recipient.status === 'Pending' ? (
                                    <>
                                    <button onClick={() => resendInvitation(recipient.name)} className="px-3 py-1.5 text-sm font-semibold bg-slate-600 rounded-md hover:bg-slate-500">
                                        Resend
                                    </button>
                                    <button onClick={() => onSignRequest(template.id, recipient.id)} className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500">
                                        Sign in Person
                                    </button>
                                    <button onClick={() => copyToClipboard(signingLink)} className="px-3 py-1.5 text-sm font-semibold bg-slate-600 rounded-md hover:bg-slate-500">
                                        Copy Link
                                    </button>
                                    </>
                                ) : (
                                    <span className="text-sm text-green-400 font-semibold flex items-center gap-2">
                                        <Icon name="approve" className="w-4 h-4"/>
                                        Signed
                                    </span>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
        <footer className="p-4 mt-auto border-t border-slate-700 text-right">
             <button onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-slate-600 rounded-md hover:bg-slate-500">
                Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ActionsModal;