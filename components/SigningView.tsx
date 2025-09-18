import React, { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { type PDFDocumentProxy } from 'pdfjs-dist';
import { type Template, type SignerInfo, type SignaturePlacement } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import PdfViewer from './PdfViewer';
import SignerInfoModal from './SignerInfoModal';
import DigitalCertModal from './DigitalCertModal';
import { applyDigitalSignatures } from '../lib/digital-signing';

interface SigningViewProps {
    templateId: string;
    recipientId: string;
}

const SigningView: React.FC<SigningViewProps> = ({ templateId, recipientId }) => {
    const [template, setTemplate] = useState<Template | null>(null);
    const [recipientName, setRecipientName] = useState<string>('');
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isSignerInfoModalOpen, setIsSignerInfoModalOpen] = useState(false);
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [signerInfo, setSignerInfo] = useState<SignerInfo | null>(null);

    useEffect(() => {
        const loadTemplate = async () => {
            setIsProcessing(true);
            try {
                const templateString = localStorage.getItem(templateId);
                if (!templateString) {
                    throw new Error("Signing session not found. The link may be invalid or expired.");
                }
                const parsedTemplate: Template = JSON.parse(templateString);
                setTemplate(parsedTemplate);

                const currentRecipient = parsedTemplate.recipients.find(r => r.id === recipientId);
                if (!currentRecipient) {
                    throw new Error("You are not a valid recipient for this document.");
                }
                setRecipientName(currentRecipient.name);

                const pdfData = atob(parsedTemplate.pdf);
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

    const handleSignerInfoSubmit = (info: SignerInfo) => {
        setSignerInfo(info);
        setIsSignerInfoModalOpen(false);
        setIsCertModalOpen(true);
    };

    const handleDigitalCertSubmit = async (p12File: File, password: string) => {
        setIsCertModalOpen(false);
        setIsProcessing(true);
        if (!template || !signerInfo || !pdfDoc) {
            alert("Something went wrong, required information is missing.");
            setIsProcessing(false);
            return;
        }

        try {
            const p12Buffer = await p12File.arrayBuffer();
            const originalPdfBytes = atob(template.pdf);
            const originalPdfBuffer = new Uint8Array(originalPdfBytes.length).map((_, i) => originalPdfBytes.charCodeAt(i));
            
            const recipientFields = template.fields.filter(f => f.recipientId === recipientId);
            
            const placements: SignaturePlacement[] = [];
            for (const field of recipientFields) {
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

            const signedPdf = await applyDigitalSignatures(originalPdfBuffer.buffer, p12Buffer, password, placements, signerInfo);
            
            const blob = new Blob([signedPdf], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `signed-${template.fileName}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert("Document signed successfully and download has started.");
            
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
            </div>
        );
    }
    
    if (!template || !pdfDoc) return null;

    const fieldsForRecipient = template.fields.filter(f => f.recipientId === recipientId);

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {isSignerInfoModalOpen && <SignerInfoModal onSubmit={handleSignerInfoSubmit} onClose={() => setIsSignerInfoModalOpen(false)} />}
            {isCertModalOpen && <DigitalCertModal onSubmit={handleDigitalCertSubmit} onClose={() => setIsCertModalOpen(false)} />}
            <header className="bg-slate-900 p-3 flex items-center justify-between shadow-md border-b border-slate-700/50">
                <div>
                    <h1 className="text-xl font-bold">{template.fileName}</h1>
                    <p className="text-sm text-slate-400">Signing as: {recipientName}</p>
                </div>
                <button
                    onClick={() => setIsSignerInfoModalOpen(true)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Finalize & Sign Document
                </button>
            </header>
            <main className="flex-grow flex items-start justify-center p-4 overflow-auto bg-slate-800/50">
                <PdfViewer
                    pdfDoc={pdfDoc}
                    pageNumber={currentPage}
                    pageRotations={{}}
                    fields={fieldsForRecipient.filter(f => f.page === currentPage)}
                    recipients={template.recipients}
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
