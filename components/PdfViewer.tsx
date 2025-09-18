
import React, { useRef, useEffect, useState } from 'react';
import { type PDFDocumentProxy, type PDFPageProxy, type RenderTask } from 'pdfjs-dist';
import { type SignatureField, type FieldType, Recipient } from '../types';
import { Icon } from './Icon';

interface PdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  fields: SignatureField[];
  recipients: Recipient[];
  // FIX: Make props for field editing optional for use in read-only scenarios like signing.
  selectedFieldType?: FieldType | null;
  onPlaceField?: (x: number, y: number, width: number, height: number) => void;
  onRemoveField?: (id: string) => void;
  pageRotations: { [key: number]: number };
}

const getFieldIcon = (type: FieldType) => {
    switch (type) {
        case 'SIGNATURE': return 'sign';
        case 'INITIALS': return 'initials';
        case 'FULL_NAME': return 'user';
        case 'DATE': return 'calendar';
        default: return '';
    }
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfDoc,
  pageNumber,
  fields,
  recipients,
  selectedFieldType,
  onPlaceField,
  onRemoveField,
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

        const renderContext = {
            canvas,
            viewport: scaledViewport,
        };
        
        const task = pageProxy.render(renderContext);
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
    // FIX: Ensure onPlaceField is provided before attempting to place a field.
    if (!selectedFieldType || !onPlaceField) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Define field dimensions as percentage of page width
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
          {fields.map((field) => {
            const recipient = recipientMap.get(field.recipientId);
            const color = recipient?.color || '#888';
            return (
              <div
                key={field.id}
                className="absolute group flex items-center justify-center text-white text-xs font-bold rounded-sm"
                style={{
                  left: `${field.x * 100}%`,
                  top: `${field.y * 100}%`,
                  width: `${field.width * 100}%`,
                  height: `${field.height * 100}%`,
                  backgroundColor: `${color}4D`, // semi-transparent background
                  border: `2px dashed ${color}`,
                  boxSizing: 'border-box',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1 pointer-events-none">
                    <Icon name={getFieldIcon(field.type)} className="w-3 h-3"/>
                    <span>{field.type.replace('_', ' ')}</span>
                </div>
                {/* FIX: Conditionally render the remove button only if onRemoveField is provided. */}
                {onRemoveField && (
                  <button
                    onClick={() => onRemoveField(field.id)}
                    className="absolute -top-2.5 -right-2.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Remove field"
                  >
                    <Icon name="close" className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}
          {selectedFieldType && <p className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg pointer-events-none">Click to place field. Press ESC to cancel.</p>}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
