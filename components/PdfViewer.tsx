
import React, { useRef, useEffect, useState } from 'react';
import { type PDFDocumentProxy, type PDFPageProxy, type RenderTask } from 'pdfjs-dist';
import { type SignatureField, type Recipient, type Attachment, type PreviewInfo } from '../types';
import EditableField from './EditableField';
import SigningField from './SigningField';

interface PdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  fields: SignatureField[];
  recipients: Recipient[];
  pageRotations: { [key: number]: number };
  onRemoveField?: (id: string) => void;
  onUpdateField?: (id: string, newPosition: Partial<SignatureField>) => void;
  signingRecipientId?: string;
  onFileUpload?: (fieldId: string, file: File) => void;
  onFileRemove?: (fieldId: string) => void;
  attachments?: Attachment[];
  previewInfo?: PreviewInfo | null;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfDoc,
  pageNumber,
  fields,
  recipients,
  onRemoveField,
  onUpdateField,
  pageRotations,
  signingRecipientId,
  onFileUpload,
  onFileRemove,
  attachments,
  previewInfo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderPage = async (pageProxy: PDFPageProxy) => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }

        const rotation = pageRotations[pageNumber] || 0;
        const viewport = pageProxy.getViewport({ scale: 1, rotation });
        const scale = container.clientWidth / viewport.width;
        const scaledViewport = pageProxy.getViewport({ scale, rotation });

        if (isMounted) {
            setPageDimensions({ width: scaledViewport.width, height: scaledViewport.height });
        }
        
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // FIX: Add the `canvas` property to the render parameters to satisfy the project's specific type definitions for `RenderParameters`.
        const task = pageProxy.render({
            canvas: canvas,
            canvasContext: canvas.getContext('2d')!,
            viewport: scaledViewport,
        });
        renderTaskRef.current = task;

        try {
            await task.promise;
        } catch (error: any) {
            if (error.name !== 'RenderingCancelledException') {
                console.error("Render error:", error);
            }
        } finally {
            if (renderTaskRef.current === task) {
               renderTaskRef.current = null;
            }
        }
    };

    pdfDoc.getPage(pageNumber).then(page => {
      if (!isMounted) return;
      renderPage(page);
      const observer = new ResizeObserver(() => {
         pdfDoc.getPage(pageNumber).then(p => renderPage(p));
      });
      if(containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => {
          if(containerRef.current) {
            observer.unobserve(containerRef.current);
          }
      };
    });

    return () => {
        isMounted = false;
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
            renderTaskRef.current = null;
        }
    };
  }, [pdfDoc, pageNumber, pageRotations]);

  const recipientMap = new Map(recipients.map(r => [r.id, r]));

  return (
    <div ref={containerRef} className="w-full max-w-5xl h-full flex justify-center items-center">
      <div
        className="relative shadow-2xl"
        style={{ width: pageDimensions.width, height: pageDimensions.height }}
      >
        <canvas ref={canvasRef} />
        <div className="absolute inset-0">
          {signingRecipientId ? (
            fields.map((field) => {
              const recipient = recipientMap.get(field.recipientId);
              return (
                <SigningField
                  key={field.id}
                  field={field}
                  recipient={recipient}
                  isCurrentUserField={field.recipientId === signingRecipientId}
                  onFileUpload={onFileUpload!}
                  onFileRemove={onFileRemove!}
                  attachment={attachments?.find(a => a.fieldId === field.id)}
                  previewInfo={field.recipientId === signingRecipientId ? previewInfo : null}
                />
              );
            })
          ) : (
            fields.map((field) => (
              <EditableField
                key={field.id}
                field={field}
                recipient={recipientMap.get(field.recipientId)}
                pageDimensions={pageDimensions}
                onUpdate={onUpdateField}
                onRemove={onRemoveField}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
