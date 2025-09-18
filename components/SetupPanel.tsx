import React, { useState, useEffect } from 'react';
import { Recipient, FieldType, SignatureField } from '../types';
import { Icon } from './Icon';

interface SetupPanelProps {
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  selectedRecipientId: string | null;
  setSelectedRecipientId: (id: string | null) => void;
  selectedFieldType: FieldType | null;
  setSelectedFieldType: (type: FieldType | null) => void;
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
    isSelected: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ type, icon, label, isSelected, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={disabled ? `Only one ${label} field is allowed per recipient.` : `Select to place a ${label} field.`}
    >
        <Icon name={icon} className="w-5 h-5" />
        <span className="font-semibold">{label}</span>
    </button>
);


const SetupPanel: React.FC<SetupPanelProps> = ({
    recipients,
    setRecipients,
    selectedRecipientId,
    setSelectedRecipientId,
    selectedFieldType,
    setSelectedFieldType,
    fields,
}) => {
    const [newRecipientName, setNewRecipientName] = useState('');
    const [newRecipientEmail, setNewRecipientEmail] = useState('');

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
            color: getRandomColor(recipients.map(r => r.color)),
        };
        setRecipients(prev => [...prev, newRecipient]);
        setNewRecipientName('');
        setNewRecipientEmail('');
    };
    
    const handleRemoveRecipient = (id: string) => {
        setRecipients(recipients.filter(r => r.id !== id));
        if (selectedRecipientId === id) {
            setSelectedRecipientId(null);
        }
    }
    
    const handleFieldSelect = (type: FieldType) => {
        setSelectedFieldType(selectedFieldType === type ? null : type);
    }

    const existingFieldsForRecipient = fields.filter(f => f.recipientId === selectedRecipientId);
    const hasSignatureField = existingFieldsForRecipient.some(f => f.type === 'SIGNATURE');
    const hasInitialsField = existingFieldsForRecipient.some(f => f.type === 'INITIALS');
    const hasFullNameField = existingFieldsForRecipient.some(f => f.type === 'FULL_NAME');

    return (
        <aside className="w-80 bg-slate-900 flex flex-col p-4 border-r border-slate-700/50 h-full overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white mb-3">Recipients</h2>
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
                        placeholder="Recipient Name"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                     <input
                        type="email"
                        value={newRecipientEmail}
                        onChange={e => setNewRecipientEmail(e.target.value)}
                        placeholder="Recipient Email"
                        className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" className="w-full px-4 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50" disabled={!newRecipientName || !newRecipientEmail}>
                        Add Recipient
                    </button>
                </form>
            </div>

            <div className="border-t border-slate-700 pt-6">
                <h2 className="text-lg font-bold text-white mb-3">Fields</h2>
                <div className={`space-y-2 ${!selectedRecipientId ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FieldButton type="SIGNATURE" icon="sign" label="Signature" isSelected={selectedFieldType === 'SIGNATURE'} onClick={() => handleFieldSelect('SIGNATURE')} disabled={hasSignatureField}/>
                    <FieldButton type="INITIALS" icon="initials" label="Initials" isSelected={selectedFieldType === 'INITIALS'} onClick={() => handleFieldSelect('INITIALS')} disabled={hasInitialsField} />
                    <FieldButton type="FULL_NAME" icon="user" label="Full Name" isSelected={selectedFieldType === 'FULL_NAME'} onClick={() => handleFieldSelect('FULL_NAME')} disabled={hasFullNameField} />
                    <FieldButton type="DATE" icon="calendar" label="Date" isSelected={selectedFieldType === 'DATE'} onClick={() => handleFieldSelect('DATE')} />
                </div>
                 {!selectedRecipientId && <p className="text-xs text-amber-400 mt-2">Please add and select a recipient to place fields.</p>}
            </div>
        </aside>
    );
};

export default SetupPanel;