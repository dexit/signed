import React, { useRef, useEffect, useState } from 'react';
import { type PDFDocumentProxy, type PDFPageProxy, type RenderTask } from 'pdfjs-dist';
import { type SignatureField, type FieldType, Recipient } from '../types';
import EditableField from './EditableField';

interface PdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  fields: SignatureField[];
  recipients: Recipient[];
  pageRotations: { [key: number]: number };
  selectedFieldType?: FieldType | null;
  onPlaceField?: (x: number, y: number, width: number, height: number) => void;
  onRemoveField?: (id: string) => void;
  onUpdateField?: (id: string, newPosition: Partial<SignatureField>) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfDoc,
  pageNumber,
  fields,
  recipients,
  selectedFieldType,
  onPlaceField,
  onRemoveField,
  onUpdateField,
  pageRotations
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

        // FIX: The compiler error indicates that the RenderParameters type for this project's environment requires a 'canvas' property.
        // This is non-standard for pdfjs-dist, but is necessary to satisfy the type checker in this specific environment.
        const task = pageProxy.render({
            canvasContext: canvas.getContext('2d')!,
            viewport: scaledViewport,
            canvas: canvas,
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFieldType || !onPlaceField) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const fieldWidth = selectedFieldType === 'SIGNATURE' ? 0.20 : 0.15; 
    const fieldHeight = 0.05;

    onPlaceField(
      x / pageDimensions.width - fieldWidth / 2,
      y / pageDimensions.height - fieldHeight / 2,
      fieldWidth,
      fieldHeight
    );
  };
  
  const cursorStyle = selectedFieldType ? 'copy' : 'default';
  const recipientMap = new Map(recipients.map(r => [r.id, r]));

  return (
    <div ref={containerRef} className="w-full max-w-5xl h-full flex justify-center items-center">
      <div
        className="relative shadow-2xl"
        style={{ width: pageDimensions.width, height: pageDimensions.height, cursor: cursorStyle }}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} />
        <div className="absolute inset-0">
          {fields.map((field) => (
            <EditableField
              key={field.id}
              field={field}
              recipient={recipientMap.get(field.recipientId)}
              pageDimensions={pageDimensions}
              onUpdate={onUpdateField}
              onRemove={onRemoveField}
            />
          ))}
          {selectedFieldType && <p className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg pointer-events-none">Click to place field. Press ESC to cancel.</p>}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;