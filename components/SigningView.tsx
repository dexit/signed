import React, { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { type PDFDocumentProxy } from 'pdfjs-dist';
import { type Template, type SignerInfo, type SignaturePlacement, type Attachment, type PreviewInfo } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import PdfViewer from './PdfViewer';
import SignerInfoModal from './SignerInfoModal';
import { applyDigitalSignatures } from '../lib/digital-signing';
import SuccessView from './SuccessView';

interface SigningViewProps {
    templateId: string;
    recipientId: string;
    onSigningComplete: () => void;
}

const SigningView: React.FC<SigningViewProps> = ({ templateId, recipientId, onSigningComplete }) => {
    const [template, setTemplate] = useState<Template | null>(null);
    const [recipientName, setRecipientName] = useState<string>('');
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'SIGNING' | 'SUCCESS'>('SIGNING');
    
    const [isSignerInfoModalOpen, setIsSignerInfoModalOpen] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);

    useEffect(() => {
        const loadTemplate = async () => {
            setIsProcessing(true);
            try {
                const templateString = localStorage.getItem(templateId);
                if (!templateString) {
                    throw new Error("Signing session not found. The link may be invalid or expired.");
                }
                const parsedTemplate: Template = JSON.parse(templateString);
                
                const currentRecipient = parsedTemplate.recipients.find(r => r.id === recipientId);
                if (!currentRecipient) {
                    throw new Error("You are not a valid recipient for this document.");
                }
                if (currentRecipient.status === 'Signed') {
                    throw new Error("You have already signed this document.");
                }
                setTemplate(parsedTemplate);
                setAttachments(parsedTemplate.attachments || []);
                setRecipientName(currentRecipient.name);

                const pdfData = atob(parsedTemplate.lastSignedPdf || parsedTemplate.pdf);
                const typedArray = new Uint8Array(pdfData.length).map((_, i) => pdfData.charCodeAt(i));
                const doc = await pdfjsLib.getDocument(typedArray).promise;
                setPdfDoc(doc);
                setTotalPages(doc.numPages);
            } catch (e: any) {
                setError(e.message || "An unknown error occurred.");
            } finally {
                setIsProcessing(false);
            }
        };
        loadTemplate();
    }, [templateId, recipientId]);

    const handleFileUpload = (fieldId: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const newAttachment: Attachment = {
                    id: `${fieldId}-${Date.now()}`,
                    fieldId,
                    recipientId,
                    fileName: file.name,
                    dataUrl: event.target.result as string,
                    mimeType: file.type,
                };
                setAttachments(prev => [...prev.filter(a => a.fieldId !== fieldId), newAttachment]);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFileRemove = (fieldId: string) => {
        setAttachments(prev => prev.filter(a => a.fieldId !== fieldId));
    };


    const handleSignerInfoSubmit = async (signerInfo: SignerInfo) => {
        setIsSignerInfoModalOpen(false);
        setPreviewInfo(null);
        setIsProcessing(true);

        if (!template || !signerInfo || !pdfDoc) {
            alert("Something went wrong, required information is missing.");
            setIsProcessing(false);
            return;
        }

        try {
            const pdfToSignB64 = template.lastSignedPdf || template.pdf;
            const originalPdfBytes = atob(pdfToSignB64);
            const originalPdfBuffer = new Uint8Array(originalPdfBytes.length).map((_, i) => originalPdfBytes.charCodeAt(i));
            
            const recipientFields = template.fields.filter(f => f.recipientId === recipientId);
            
            const placements: SignaturePlacement[] = [];
            for (const field of recipientFields) {
                if (field.type === 'FILE_UPLOAD') continue;
                const page = await pdfDoc.getPage(field.page);
                const viewport = page.getViewport({ scale: 1 });
                placements.push({
                    pageIndex: field.page - 1,
                    x: field.x * viewport.width,
                    y: field.y * viewport.height,
                    width: field.width * viewport.width,
                    height: field.height * viewport.height,
                    type: field.type,
                });
            }
            
            const signedPdfBytes = await applyDigitalSignatures(originalPdfBuffer.buffer, placements, signerInfo);
            
            const updatedTemplate = { ...template };
            let binary = '';
            for (let i = 0; i < signedPdfBytes.length; i++) {
                binary += String.fromCharCode(signedPdfBytes[i]);
            }
            updatedTemplate.lastSignedPdf = btoa(binary);

            updatedTemplate.attachments = attachments;
            
            const currentRecipient = updatedTemplate.recipients.find(r => r.id === recipientId);

            updatedTemplate.recipients = updatedTemplate.recipients.map(r => 
                r.id === recipientId ? { ...r, status: 'Signed', signedAt: new Date().toISOString(), signerInfo } : r
            );

            // Add to activity log
            updatedTemplate.activityLog = updatedTemplate.activityLog || [];
            updatedTemplate.activityLog.push({
                timestamp: new Date().toISOString(),
                message: `Document signed by ${currentRecipient?.name || 'recipient'}.`
            });


            const allSigned = updatedTemplate.recipients.every(r => r.status === 'Signed');
            if (allSigned) {
                updatedTemplate.status = 'Completed';
                updatedTemplate.activityLog.push({
                    timestamp: new Date().toISOString(),
                    message: `Document fully signed and completed.`
                });
            }

            localStorage.setItem(templateId, JSON.stringify(updatedTemplate));
            
            setViewMode('SUCCESS');
            
        } catch (error: any) {
            console.error("Signing failed:", error);
            alert(`Signing failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (isProcessing) return <LoadingSpinner />;
    
    if (error) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h1>
                <p className="text-slate-300 max-w-md">{error}</p>
                 <button onClick={onSigningComplete} className="mt-6 px-5 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500">Return to Dashboard</button>
            </div>
        );
    }
    
    if(viewMode === 'SUCCESS') {
        return <SuccessView onReturn={onSigningComplete} />;
    }
    
    if (!template || !pdfDoc) return null;

    const requiredUploadFields = template.fields.filter(f => f.recipientId === recipientId && f.type === 'FILE_UPLOAD');
    const uploadedFieldIds = new Set(attachments.filter(a => a.recipientId === recipientId).map(a => a.fieldId));
    const allFilesUploaded = requiredUploadFields.every(f => uploadedFieldIds.has(f.id));

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {isSignerInfoModalOpen && (
                <SignerInfoModal 
                    onSubmit={handleSignerInfoSubmit} 
                    onClose={() => {
                        setIsSignerInfoModalOpen(false);
                        setPreviewInfo(null);
                    }}
                    onInfoChange={setPreviewInfo}
                    recipientName={recipientName}
                />
            )}
            <header className="bg-slate-900 p-3 flex items-center justify-between shadow-md border-b border-slate-700/50">
                <div>
                    <h1 className="text-xl font-bold">{template.fileName}</h1>
                    <p className="text-sm text-slate-400">Signing as: {recipientName}</p>
                </div>
                <button
                    onClick={() => setIsSignerInfoModalOpen(true)}
                    disabled={!allFilesUploaded}
                    title={!allFilesUploaded ? "Please upload all required files to continue." : "Finalize and sign the document"}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Finalize & Sign Document
                </button>
            </header>
            <main className="flex-grow flex items-start justify-center p-4 overflow-auto bg-slate-800/50">
                <PdfViewer
                    pdfDoc={pdfDoc}
                    pageNumber={currentPage}
                    pageRotations={{}}
                    fields={template.fields.filter(f => f.page === currentPage)}
                    recipients={template.recipients}
                    signingRecipientId={recipientId}
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    attachments={attachments}
                    previewInfo={previewInfo}
                />
            </main>
             <footer className="bg-slate-900 p-2 flex items-center justify-center border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage <= 1}
                        className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50"
                    >
                    &lt;
                    </button>
                    <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50"
                    >
                    &gt;
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default SigningView;