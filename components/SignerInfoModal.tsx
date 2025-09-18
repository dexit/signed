import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type SignerInfo, type SignatureTab, PreviewInfo } from '../types';
import { Icon } from './Icon';
import { SignaturePad, SignaturePadRef } from './SignaturePad';

interface SignerInfoModalProps {
  onSubmit: (info: SignerInfo) => void;
  onClose: () => void;
  onInfoChange: (info: PreviewInfo) => void;
  recipientName: string;
}

const TabButton: React.FC<{
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 p-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors ${
      isActive
        ? 'bg-slate-700 text-white'
        : 'bg-slate-800 text-slate-400 hover:bg-slate-700/50'
    }`}
  >
    <Icon name={icon} className="w-4 h-4" />
    <span>{label}</span>
  </button>
);


const SignerInfoModal: React.FC<SignerInfoModalProps> = ({ onSubmit, onClose, onInfoChange, recipientName }) => {
    const [fullName, setFullName] = useState(recipientName);
    const [initials, setInitials] = useState('');

    const [sigTab, setSigTab] = useState<SignatureTab>('draw');
    const [sigTypedText, setSigTypedText] = useState('');
    const [sigFont, setSigFont] = useState<'cursive-signature' | 'sans-signature'>('cursive-signature');
    const sigPadRef = useRef<SignaturePadRef>(null);
    const [sigUploadedUrl, setSigUploadedUrl] = useState<string | null>(null);

    const [initialsTab, setInitialsTab] = useState<SignatureTab>('draw');
    const [initialsTypedText, setInitialsTypedText] = useState('');
    const [initialsFont, setInitialsFont] = useState<'cursive-signature' | 'sans-signature'>('cursive-signature');
    const initialsPadRef = useRef<SignaturePadRef>(null);

    // Auto-generate initials from full name
    useEffect(() => {
        const nameParts = fullName.trim().split(' ');
        const first = nameParts[0]?.charAt(0) || '';
        const last = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.charAt(0) : '';
        const newInitials = `${first}${last}`.toUpperCase();
        setInitials(newInitials);
        setInitialsTypedText(newInitials);
    }, [fullName]);
    
    // Generate data URL from typed text
    const generateImageUrlFromText = (text: string, font: 'cursive' | 'sans', isInitials: boolean): string => {
        if (!text.trim()) return '';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        
        const fontStyle = font === 'cursive' 
            ? `${isInitials ? '60px' : '48px'} Cedarville Cursive` 
            : `bold ${isInitials ? '48px' : '36px'} Inter`;
        
        ctx.font = fontStyle;
        const textMetrics = ctx.measureText(text);
        canvas.width = textMetrics.width + 40;
        canvas.height = isInitials ? 100 : 100;
        ctx.font = fontStyle;
        ctx.fillStyle = 'black';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 20, canvas.height / 2);
        return canvas.toDataURL('image/png');
    };

    // This effect handles the live preview
    useEffect(() => {
        let sigUrl = '';
        if (sigTab === 'draw') sigUrl = sigPadRef.current?.getSignatureAsDataURL() || '';
        else if (sigTab === 'type') sigUrl = generateImageUrlFromText(sigTypedText, sigFont === 'cursive-signature' ? 'cursive' : 'sans', false);
        else if (sigTab === 'upload') sigUrl = sigUploadedUrl || '';

        let initialsUrl = '';
        if (initialsTab === 'draw') initialsUrl = initialsPadRef.current?.getSignatureAsDataURL() || '';
        else if (initialsTab === 'type') initialsUrl = generateImageUrlFromText(initialsTypedText, initialsFont === 'cursive-signature' ? 'cursive' : 'sans', true);
        
        onInfoChange({
            fullName,
            initials,
            signatureDataUrl: sigUrl,
            initialsDataUrl: initialsUrl,
            date: new Date().toLocaleDateString()
        });
    }, [
        fullName, initials, sigTab, sigTypedText, sigFont, sigUploadedUrl, 
        initialsTab, initialsTypedText, initialsFont, onInfoChange
    ]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => setSigUploadedUrl(event.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const isReadyToSign = (): boolean => {
        if (!fullName.trim() || !initials.trim()) return false;
        const isSigReady = (sigTab === 'draw' && !sigPadRef.current?.isEmpty()) || (sigTab === 'type' && !!sigTypedText.trim()) || (sigTab === 'upload' && !!sigUploadedUrl);
        const isInitialsReady = (initialsTab === 'draw' && !initialsPadRef.current?.isEmpty()) || (initialsTab === 'type' && !!initialsTypedText.trim());
        return isSigReady && isInitialsReady;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isReadyToSign()) {
            alert("Please provide your full name, initials, and create both a signature and initial representation.");
            return;
        }

        let signatureDataUrl = '';
        if (sigTab === 'draw') signatureDataUrl = sigPadRef.current!.getSignatureAsDataURL()!;
        else if (sigTab === 'type') signatureDataUrl = generateImageUrlFromText(sigTypedText, sigFont === 'cursive-signature' ? 'cursive' : 'sans', false);
        else if (sigTab === 'upload') signatureDataUrl = sigUploadedUrl!;
        
        let initialsDataUrl = '';
        if (initialsTab === 'draw') initialsDataUrl = initialsPadRef.current!.getSignatureAsDataURL()!;
        else if (initialsTab === 'type') initialsDataUrl = generateImageUrlFromText(initialsTypedText, initialsFont === 'cursive-signature' ? 'cursive' : 'sans', true);

        onSubmit({ fullName, initials, signatureDataUrl, initialsDataUrl });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-2 sm:p-4">
            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold">Adopt Your Signature</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
                        <Icon name="close" className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                    <p className="text-sm text-slate-400">
                        Confirm your name and create your signature. This will be securely applied to the document.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                            <input
                                id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                                className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="initials" className="block text-sm font-medium text-slate-300 mb-1">Initials</label>
                            <input
                                id="initials" type="text" value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} required maxLength={4}
                                className="w-full bg-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Signature Section */}
                        <div>
                            <h3 className="font-semibold mb-2">Create Your Signature</h3>
                            <div className="flex bg-slate-800 rounded-t-lg"><TabButton label="Draw" icon="draw" isActive={sigTab === 'draw'} onClick={() => setSigTab('draw')} /><TabButton label="Type" icon="type" isActive={sigTab === 'type'} onClick={() => setSigTab('type')} /><TabButton label="Upload" icon="upload" isActive={sigTab === 'upload'} onClick={() => setSigTab('upload')} /></div>
                            <div className="bg-slate-700 p-2 rounded-b-lg">
                                {sigTab === 'draw' && <SignaturePad ref={sigPadRef} />}
                                {sigTab === 'type' && (
                                    <div className="space-y-2">
                                        <input type="text" value={sigTypedText} onChange={(e) => setSigTypedText(e.target.value)} className={`w-full p-3 bg-slate-100 text-black rounded-md text-3xl border-2 border-transparent focus:border-indigo-500 focus:outline-none ${sigFont}`} placeholder="Type signature..." />
                                        <div className="flex gap-2"><button type="button" onClick={() => setSigFont('cursive-signature')} className={`flex-1 py-1 text-sm rounded ${sigFont === 'cursive-signature' ? 'bg-indigo-600' : 'bg-slate-600'}`}>Cursive</button><button type="button" onClick={() => setSigFont('sans-signature')} className={`flex-1 py-1 text-sm rounded ${sigFont === 'sans-signature' ? 'bg-indigo-600' : 'bg-slate-600'}`}>Sans-Serif</button></div>
                                    </div>
                                )}
                                {sigTab === 'upload' && <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-500 rounded-lg cursor-pointer hover:bg-slate-600"><Icon name="upload" className="w-8 h-8 text-slate-400" /><span className="mt-2 text-sm text-slate-400">Upload signature</span><input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileUpload} /></label>}
                            </div>
                        </div>

                        {/* Initials Section */}
                        <div>
                            <h3 className="font-semibold mb-2">Create Your Initials</h3>
                            <div className="flex bg-slate-800 rounded-t-lg"><TabButton label="Draw" icon="draw" isActive={initialsTab === 'draw'} onClick={() => setInitialsTab('draw')} /><TabButton label="Type" icon="type" isActive={initialsTab === 'type'} onClick={() => setInitialsTab('type')} /></div>
                             <div className="bg-slate-700 p-2 rounded-b-lg">
                                {initialsTab === 'draw' && <SignaturePad ref={initialsPadRef} />}
                                {initialsTab === 'type' && (
                                    <div className="space-y-2">
                                        <input type="text" value={initialsTypedText} onChange={(e) => setInitialsTypedText(e.target.value)} className={`w-full p-3 bg-slate-100 text-black rounded-md text-3xl text-center border-2 border-transparent focus:border-indigo-500 focus:outline-none ${initialsFont}`} placeholder="Type initials..." />
                                        <div className="flex gap-2"><button type="button" onClick={() => setInitialsFont('cursive-signature')} className={`flex-1 py-1 text-sm rounded ${initialsFont === 'cursive-signature' ? 'bg-indigo-600' : 'bg-slate-600'}`}>Cursive</button><button type="button" onClick={() => setInitialsFont('sans-signature')} className={`flex-1 py-1 text-sm rounded ${initialsFont === 'sans-signature' ? 'bg-indigo-600' : 'bg-slate-600'}`}>Sans-Serif</button></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="p-4 bg-slate-800/50 border-t border-slate-700 text-right flex-shrink-0">
                    <button
                        type="submit"
                        disabled={!isReadyToSign()}
                        className="px-5 py-2 text-sm font-semibold bg-green-600 rounded-md hover:bg-green-500 disabled:opacity-50"
                    >
                        Adopt and Sign
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default SignerInfoModal;