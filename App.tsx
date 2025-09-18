import React, { useState, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { type PDFDocumentProxy } from 'pdfjs-dist';

import { type SignatureField, type Recipient, type FieldType, type Template } from './types';
import PdfViewer from './components/PdfViewer';
import Toolbar from './components/Toolbar';
import SetupPanel from './components/SetupPanel';
import LinksModal from './components/LinksModal';
import { FileUploader } from './components/FileUploader';
import { LoadingSpinner } from './components/LoadingSpinner';
import Dashboard from './components/Dashboard';
import SigningView from './components/SigningView';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

type AppMode = 'DASHBOARD' | 'FILE_UPLOAD' | 'TEMPLATE_SETUP' | 'SIGNING';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('DASHBOARD');
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(null);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pageRotations, setPageRotations] = useState<{ [key: number]: number }>({});
  const [showLinksModal, setShowLinksModal] = useState<boolean>(false);

  // --- Signing Mode State ---
  const [signingTemplateId, setSigningTemplateId] = useState<string | null>(null);
  const [signingRecipientId, setSigningRecipientId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('templateId');
    const recipientId = params.get('recipientId');

    if (templateId && recipientId) {
      setSigningTemplateId(templateId);
      setSigningRecipientId(recipientId);
      setAppMode('SIGNING');
    } else {
      setAppMode('DASHBOARD');
    }
  }, []);


  const loadPdf = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      if (e.target?.result) {
        const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
        try {
          const doc = await pdfjsLib.getDocument(typedArray).promise;
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setFields([]);
          setPageRotations({});
          setRecipients([]);
          setSelectedRecipientId(null);
          setSelectedFieldType(null);
          setAppMode('TEMPLATE_SETUP');
        } catch (error) {
          console.error("Error loading PDF:", error);
          alert("Failed to load PDF. Please ensure it is a valid file.");
          setFile(null);
          setAppMode('FILE_UPLOAD');
        } finally {
          setIsProcessing(false);
        }
      }
    };
    fileReader.readAsArrayBuffer(selectedFile);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPdf(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type === "application/pdf") {
        loadPdf(e.dataTransfer.files[0]);
      } else {
        alert("Please drop a PDF file.");
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRotatePage = () => {
    setPageRotations(prev => {
        const currentRotation = prev[currentPage] || 0;
        const nextRotation = (currentRotation + 90) % 360;
        return { ...prev, [currentPage]: nextRotation };
    });
  };

  const handlePlaceField = (x: number, y: number, width: number, height: number) => {
    if (selectedFieldType && selectedRecipientId) {
      const newField: SignatureField = {
        id: `${Date.now()}-${Math.random()}`,
        recipientId: selectedRecipientId,
        page: currentPage,
        type: selectedFieldType,
        x, y, width, height,
      };
      setFields(prev => [...prev, newField]);
    } else {
      alert("Please select a recipient and a field type from the left panel.");
    }
  };
  
  const handleRemoveField = (idToRemove: string) => {
      setFields(prev => prev.filter(p => p.id !== idToRemove));
  };

  const handleGenerateLinks = async () => {
    if (!file) return;
    if (recipients.length === 0) {
      alert("Please add at least one recipient.");
      return;
    }
    if (fields.length === 0) {
      alert("Please place at least one field on the document.");
      return;
    }

    setIsProcessing(true);
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onloadend = () => {
        const base64Pdf = (fileReader.result as string).split(',')[1];
        const templateId = `template-${Date.now()}`;
        
        const template: Template = {
          id: templateId,
          pdf: base64Pdf,
          fileName: file.name,
          recipients,
          fields,
        };
        
        localStorage.setItem(templateId, JSON.stringify(template));
        
        setShowLinksModal(true);
        setIsProcessing(false);
    };
    fileReader.onerror = () => {
        console.error("Error reading file for template generation.");
        alert("Could not read the file to generate links.");
        setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFieldType(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetToDashboard = () => {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.pushState({}, '', url);
    setAppMode('DASHBOARD');
    setFile(null);
    setPdfDoc(null);
  };

  const renderContent = () => {
      switch (appMode) {
          case 'SIGNING':
              return <SigningView templateId={signingTemplateId!} recipientId={signingRecipientId!} />;
          case 'DASHBOARD':
              return <Dashboard onStartSetup={() => setAppMode('FILE_UPLOAD')} />;
          case 'FILE_UPLOAD':
              return <FileUploader onFileChange={handleFileChange} onDrop={handleDrop} />;
          case 'TEMPLATE_SETUP':
              return (
                <div className="flex h-screen overflow-hidden">
                    <SetupPanel
                        recipients={recipients}
                        setRecipients={setRecipients}
                        selectedRecipientId={selectedRecipientId}
                        setSelectedRecipientId={setSelectedRecipientId}
                        selectedFieldType={selectedFieldType}
                        setSelectedFieldType={setSelectedFieldType}
                        fields={fields}
                    />
                    <div className="flex-grow flex flex-col">
                      <Toolbar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        onNewFileClick={resetToDashboard}
                        onRotatePage={handleRotatePage}
                        onGenerateLinksClick={handleGenerateLinks}
                        isSetupComplete={recipients.length > 0 && fields.length > 0}
                      />
                      <main className="flex-grow flex items-start justify-center p-4 overflow-auto bg-slate-800/50">
                        <PdfViewer
                          pdfDoc={pdfDoc!}
                          pageNumber={currentPage}
                          pageRotations={pageRotations}
                          fields={fields.filter(f => f.page === currentPage)}
                          recipients={recipients}
                          selectedFieldType={selectedFieldType}
                          onPlaceField={handlePlaceField}
                          onRemoveField={handleRemoveField}
                        />
                      </main>
                    </div>
                </div>
              );
          default:
              return null;
      }
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col font-sans-signature">
      {isProcessing && <LoadingSpinner />}
      {showLinksModal && <LinksModal onClose={() => {
          setShowLinksModal(false);
          resetToDashboard();
      }} />}
      {renderContent()}
    </div>
  );
}