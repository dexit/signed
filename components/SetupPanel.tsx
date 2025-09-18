import React, { useState, useEffect } from 'react';
import { Recipient, FieldType, SignatureField, Requester } from '../types';
import { Icon } from './Icon';

interface SetupPanelProps {
  requester: Requester;
  setRequester: React.Dispatch<React.SetStateAction<Requester>>;
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  selectedRecipientId: string | null;
  setSelectedRecipientId: (id: string | null) => void;
  fields: SignatureField[];
}

const colors = ['#f97316', '#22c55e', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e', '#eab308'];
const getRandomColor = (existingColors: string[]) => {
    const availableColors = colors.filter(c => !existingColors.includes(c));
    return availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : colors[Math.floor(Math.random() * colors.length)];
};

const FieldButton: React.FC<{
    type: FieldType;
    icon: string;
    label: string;
    disabled?: boolean;
}> = ({ type, icon, label, disabled = false }) => (
    <button
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(e) => {
            if (!disabled) {
                e.dataTransfer.setData('field-type', type);
                e.dataTransfer.effectAllowed = 'copy';
            }
        }}
        className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors bg-slate-700 hover:bg-slate-600 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab'
        }`}
        title={disabled ? `Only one ${label} field is allowed per recipient.` : `Drag to place a ${label} field.`}
    >
        <Icon name={icon} className="w-5 h-5" />
        <span className="font-semibold">{label}</span>
    </button>
);


const SetupPanel: React.FC<SetupPanelProps> = ({
    requester,
    setRequester,
    recipients,
    setRecipients,
    selectedRecipientId,
    setSelectedRecipientId,
    fields,
}) => {
    const [newRecipientName, setNewRecipientName] = useState('');
    const [newRecipientEmail, setNewRecipientEmail] = useState('');
    const [newRecipientPhone, setNewRecipientPhone] = useState('');

    useEffect(() => {
        if (!selectedRecipientId && recipients.length > 0) {
            setSelectedRecipientId(recipients[0].id);
        }
    }, [recipients, selectedRecipientId, setSelectedRecipientId]);

    const handleAddRecipient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRecipientName.trim() || !newRecipientEmail.trim()) return;

        const newRecipient: Recipient = {
            id: Date.now().toString(),
            name: newRecipientName.trim(),
            email: newRecipientEmail.trim(),
            phone: newRecipientPhone.trim() || undefined,
            color: getRandomColor(recipients.map(r => r.color)),
            status: 'Pending',
        };
        setRecipients(prev => [...prev, newRecipient]);
        setNewRecipientName('');
        setNewRecipientEmail('');
        setNewRecipientPhone('');
    };
    
    const handleRemoveRecipient = (id: string) => {
        setRecipients(recipients.filter(r => r.id !== id));
        if (selectedRecipientId === id) {
            setSelectedRecipientId(null);
        }
    }
    
    const existingFieldsForRecipient = fields.filter(f => f.recipientId === selectedRecipientId);
    const hasSignatureField = existingFieldsForRecipient.some(f => f.type === 'SIGNATURE');
    const hasInitialsField = existingFieldsForRecipient.some(f => f.type === 'INITIALS');
    const hasFullNameField = existingFieldsForRecipient.some(f => f.type === 'FULL_NAME');

    return (
        <aside className="w-80 bg-slate-900 flex flex-col p-4 border-r border-slate-700/50 h-full overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white mb-3">Requester</h2>
                <div className="bg-slate-800 p-3 rounded-lg space-y-2">
                    <input
                        type="text"
                        value={requester.name}
                        onChange={e => setRequester(r => ({ ...r, name: e.target.value }))}
                        placeholder="Your Name"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                     <input
                        type="email"
                        value={requester.email}
                        onChange={e => setRequester(r => ({ ...r, email: e.target.value }))}
                        placeholder="Your Email"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

             <div className="border-t border-slate-700 pt-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-3">Signees</h2>
                <div className="space-y-2 mb-4">
                    {recipients.map(r => (
                        <div
                            key={r.id}
                            onClick={() => setSelectedRecipientId(r.id)}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-all ${selectedRecipientId === r.id ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700/50'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                                <div className="text-sm">
                                    <p className="font-semibold">{r.name}</p>
                                    <p className="text-xs text-slate-400">{r.email}</p>
                                    {r.phone && <p className="text-xs text-slate-400">{r.phone}</p>}
                                </div>
                            </div>
                             <button onClick={(e) => { e.stopPropagation(); handleRemoveRecipient(r.id); }} className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-600">
                                <Icon name="close" className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAddRecipient} className="bg-slate-800 p-3 rounded-lg space-y-2">
                    <input
                        type="text"
                        value={newRecipientName}
                        onChange={e => setNewRecipientName(e.target.value)}
                        placeholder="Signee Name"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                     <input
                        type="email"
                        value={newRecipientEmail}
                        onChange={e => setNewRecipientEmail(e.target.value)}
                        placeholder="Signee Email"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                     <input
                        type="tel"
                        value={newRecipientPhone}
                        onChange={e => setNewRecipientPhone(e.target.value)}
                        placeholder="Phone (Optional)"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" className="w-full px-4 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50" disabled={!newRecipientName || !newRecipientEmail}>
                        Add Signee
                    </button>
                </form>
            </div>

            <div className="border-t border-slate-700 pt-6">
                <h2 className="text-lg font-bold text-white mb-3">Fields</h2>
                <div className={`space-y-2 ${!selectedRecipientId ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FieldButton type="SIGNATURE" icon="sign" label="Signature" disabled={hasSignatureField}/>
                    <FieldButton type="INITIALS" icon="initials" label="Initials" disabled={hasInitialsField} />
                    <FieldButton type="FULL_NAME" icon="user" label="Full Name" disabled={hasFullNameField} />
                    <FieldButton type="DATE" icon="calendar" label="Date" />
                    <FieldButton type="FILE_UPLOAD" icon="paperclip" label="File Upload" />
                </div>
                 {!selectedRecipientId && <p className="text-xs text-amber-400 mt-2">Please add and select a signee to place fields.</p>}
            </div>
        </aside>
    );
};

export default SetupPanel;