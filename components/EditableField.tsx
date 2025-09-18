import React, { useState, useRef } from 'react';
import { type SignatureField, type Recipient } from '../types';
import { Icon } from './Icon';

interface EditableFieldProps {
  field: SignatureField;
  recipient?: Recipient;
  pageDimensions: { width: number; height: number };
  onUpdate?: (id: string, newPosition: Partial<SignatureField>) => void;
  onRemove?: (id: string) => void;
}

const getFieldIcon = (type: SignatureField['type']) => {
    switch (type) {
        case 'SIGNATURE': return 'sign';
        case 'INITIALS': return 'initials';
        case 'FULL_NAME': return 'user';
        case 'DATE': return 'calendar';
        default: return '';
    }
};

const MIN_WIDTH_PERC = 0.05;
const MIN_HEIGHT_PERC = 0.03;

const EditableField: React.FC<EditableFieldProps> = ({ field, recipient, pageDimensions, onUpdate, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const initialField = useRef(field);

  const color = recipient?.color || '#888';
  const isEditable = !!onUpdate && !!onRemove;

  const handleDragStart = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialField.current = field;
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    setIsResizing(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    initialField.current = field;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && onUpdate) {
      const dx = (e.clientX - dragStartPos.current.x) / pageDimensions.width;
      const dy = (e.clientY - dragStartPos.current.y) / pageDimensions.height;
      onUpdate(field.id, {
        x: initialField.current.x + dx,
        y: initialField.current.y + dy,
      });
    }
    if (isResizing && onUpdate) {
      const dx = (e.clientX - resizeStartPos.current.x) / pageDimensions.width;
      const dy = (e.clientY - resizeStartPos.current.y) / pageDimensions.height;
      onUpdate(field.id, {
        width: Math.max(MIN_WIDTH_PERC, initialField.current.width + dx),
        height: Math.max(MIN_HEIGHT_PERC, initialField.current.height + dy),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, pageDimensions]);

  return (
    <div
      className={`absolute group flex items-center justify-center text-white text-xs font-bold rounded-sm ${isEditable ? 'cursor-move' : ''}`}
      style={{
        left: `${field.x * 100}%`,
        top: `${field.y * 100}%`,
        width: `${field.width * 100}%`,
        height: `${field.height * 100}%`,
        backgroundColor: `${color}4D`,
        border: `2px dashed ${color}`,
        boxSizing: 'border-box',
      }}
      onMouseDown={handleDragStart}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 pointer-events-none">
        <Icon name={getFieldIcon(field.type)} className="w-3 h-3" />
        <span>{field.type.replace('_', ' ')}</span>
      </div>

      {isEditable && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(field.id); }}
            className="absolute -top-2.5 -right-2.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Remove field"
          >
            <Icon name="close" className="w-3 h-3" />
          </button>
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-slate-600 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
};

export default EditableField;
