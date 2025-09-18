

import React, { useState, useRef, useEffect } from 'react';
import { Signature, SignatureTab, Recipient } from '../types';
import { Icon } from './Icon';
import { SignaturePad, type SignaturePadRef } from './SignaturePad';

interface SignaturePanelProps {
  isOpen: boolean;
  onClose: () => void;
  signatures: Signature[];
  setSignatures: React.Dispatch<React.SetStateAction<Signature[]>>;
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  onSignatureSelect: (signature: Signature) => void;
}

const colors = ['#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316'];
const getRandomColor = (existingColors: string[]) => {
    const availableColors = colors.filter(c => !existingColors.includes(c));
    return availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : colors[Math.floor(Math.random() * colors.length)];
}

const TabButton: React.FC<{
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold rounded-t-lg transition-colors ${
      isActive
        ? 'bg-slate-700 text-white'
        : 'bg-slate-800 text-slate-400 hover:bg-slate-700/50'
    }`}
  >
    <Icon name={icon} className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

const SignaturePanel: React.FC<SignaturePanelProps> = ({ isOpen, onClose, signatures, setSignatures, recipients, setRecipients, onSignatureSelect }) => {
  const [activeTab, setActiveTab] = useState<SignatureTab>('draw');
  const [typedText, setTypedText] = useState('');
  const [font, setFont] = useState<'cursive-signature' | 'sans-signature'>('cursive-signature');
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [animationClass, setAnimationClass] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [newRecipientName, setNewRecipientName] = useState('');
  // FIX: Add state for recipient email to match Recipient type
  const [newRecipientEmail, setNewRecipientEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAnimationClass('animate-slide-in');
      if (recipients.length > 0 && !selectedRecipientId) {
        setSelectedRecipientId(recipients[0].id);
      }
    } else if (animationClass) {
      setAnimationClass('animate-slide-out');
    }
  }, [isOpen]);
  
  const handleAddRecipient = (e: React.FormEvent) => {
      e.preventDefault();
      // FIX: Validate both name and email
      if (!newRecipientName.trim() || !newRecipientEmail.trim()) return;
      const newRecipient: Recipient = {
          id: Date.now().toString(),
          name: newRecipientName.trim(),
          // FIX: Add missing 'email' property to conform to Recipient type
          email: newRecipientEmail.trim(),
          color: getRandomColor(recipients.map(r => r.color)),
          // FIX: Add missing 'status' property to conform to Recipient type.
          status: 'Pending',
      };
      setRecipients(prev => [...prev, newRecipient]);
      setSelectedRecipientId(newRecipient.id);
      setNewRecipientName('');
      // FIX: Reset email input after submission
      setNewRecipientEmail('');
  };

  const addSignature = (dataUrl: string | null, type: SignatureTab) => {
    if (dataUrl && selectedRecipientId) {
      const newSignature: Signature = { id: Date.now().toString(), dataUrl, type, recipientId: selectedRecipientId };
      setSignatures(prev => [...prev, newSignature]);
      // Reset inputs
      if (type === 'draw') signaturePadRef.current?.clear();
      if (type === 'type') setTypedText('');
    } else {
        alert("Please select a recipient before saving a signature.");
    }
  };

  const handleSaveDrawing = () => addSignature(signaturePadRef.current?.getSignatureAsDataURL(), 'draw');
  const handleSaveTyped = () => {
    if (!typedText.trim()) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fontStyle = font === 'cursive-signature' ? '48px Cedarville Cursive' : 'bold 36px Inter';
    ctx.font = fontStyle;
    const textMetrics = ctx.measureText(typedText);
    canvas.width = textMetrics.width + 40;
    canvas.height = font === 'cursive-signature' ? 100 : 80;
    ctx.font = fontStyle;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText, 20, canvas.height / 2);
    addSignature(canvas.toDataURL('image/png'), 'type');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => addSignature(event.target?.result as string, 'upload');
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  const deleteSignature = (id: string) => setSignatures(prev => prev.filter(s => s.id !== id));
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen && !animationClass) return null;
  
  const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);
  const recipientSignatures = signatures.filter(s => s.recipientId === selectedRecipientId);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-800 shadow-2xl z-50 flex flex-col text-white ${animationClass}`}>
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Manage Signatures</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700"><Icon name="close" className="w-6 h-6" /></button>
        </header>

        <div className="p-4 border-b border-slate-700">
            <h3 className="font-bold mb-2 text-slate-300">Step 1: Select Recipient</h3>
            <div className="flex flex-wrap gap-2 mb-3">
                {recipients.map(r => (
                    <button key={r.id} onClick={() => setSelectedRecipientId(r.id)} className={`px-3 py-1 text-sm font-semibold rounded-full border-2 transition-all ${selectedRecipientId === r.id ? 'text-white' : 'text-slate-300'}`} style={{ borderColor: r.color, backgroundColor: selectedRecipientId === r.id ? r.color : 'transparent' }}>
                        {r.name}
                    </button>
                ))}
            </div>
            <form onSubmit={handleAddRecipient} className="space-y-2">
                <input type="text" value={newRecipientName} onChange={e => setNewRecipientName(e.target.value)} placeholder="Recipient Name..." className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="email" value={newRecipientEmail} onChange={e => setNewRecipientEmail(e.target.value)} placeholder="Recipient Email..." className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" disabled={!newRecipientName || !newRecipientEmail} className="w-full px-4 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50">Add Recipient</button>
            </form>
        </div>

        <div className={`p-4 transition-opacity ${!selectedRecipientId ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-bold mb-2 text-slate-300">Step 2: Create Signature {selectedRecipient ? `for ${selectedRecipient.name}` : ''}</h3>
           {!selectedRecipientId && <p className="text-sm text-amber-400 mb-2">Please add or select a recipient to create signatures.</p>}
          <div className="flex bg-slate-800 rounded-t-lg"><TabButton label="Draw" icon="draw" isActive={activeTab === 'draw'} onClick={() => setActiveTab('draw')} /><TabButton label="Type" icon="type" isActive={activeTab === 'type'} onClick={() => setActiveTab('type')} /><TabButton label="Upload" icon="upload" isActive={activeTab === 'upload'} onClick={() => setActiveTab('upload')} /></div>
          <div className="bg-slate-700 p-4 rounded-b-lg">
            {activeTab === 'draw' && (<div><SignaturePad ref={signaturePadRef} /><div className="flex justify-end gap-2 mt-2"><button onClick={() => signaturePadRef.current?.clear()} className="px-4 py-2 text-sm font-semibold text-slate-300 rounded-md hover:bg-slate-600">Clear</button><button onClick={handleSaveDrawing} className="px-4 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500">Save Signature</button></div></div>)}
            {activeTab === 'type' && (<div><input type="text" value={typedText} onChange={(e) => setTypedText(e.target.value)} className={`w-full p-3 bg-slate-100 text-black rounded-md text-3xl border-2 border-transparent focus:border-indigo-500 focus:outline-none ${font}`} placeholder="Type your name" /><div className="flex gap-4 mt-2"><button onClick={() => setFont('cursive-signature')} className={`flex-1 py-2 rounded ${font === 'cursive-signature' ? 'bg-indigo-600' : 'bg-slate-600'}`}>Cursive</button><button onClick={() => setFont('sans-signature')} className={`flex-1 py-2 rounded ${font === 'sans-signature' ? 'bg-indigo-600' : 'bg-slate-600'}`}>Sans-Serif</button></div><div className="flex justify-end gap-2 mt-2"><button onClick={handleSaveTyped} className="px-4 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500">Save Signature</button></div></div>)}
            {activeTab === 'upload' && (<label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-500 rounded-lg cursor-pointer hover:bg-slate-600"><Icon name="upload" className="w-8 h-8 text-slate-400" /><span className="mt-2 text-sm text-slate-400">Click to upload image</span><input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileUpload} /></label>)}
          </div>
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto">
            {selectedRecipient && <h3 className="font-bold mb-2">Saved Signatures for {selectedRecipient.name}</h3>}
            {recipientSignatures.length === 0 ? (<p className="text-slate-400 text-sm text-center py-8">{selectedRecipient ? "No signatures saved for this recipient." : "Select a recipient to view their signatures."}</p>) : 
            (<div className="grid grid-cols-2 gap-4">{recipientSignatures.map(sig => (<div key={sig.id} className="relative group bg-white p-2 rounded-md"><img src={sig.dataUrl} alt="Signature" className="w-full h-20 object-contain cursor-pointer" onClick={() => onSignatureSelect(sig)} /><button onClick={() => deleteSignature(sig.id)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="trash" className="w-3 h-3" /></button></div>))}</div>)}
        </div>
      </div>
    </>
  );
};

export default SignaturePanel;