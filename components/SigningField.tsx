import React from 'react';
import { type SignatureField, type Recipient, type Attachment, FieldType } from '../types';
import { Icon } from './Icon';

interface SigningFieldProps {
  field: SignatureField;
  recipient?: Recipient;
  isCurrentUserField: boolean;
  onFileUpload: (fieldId: string, file: File) => void;
  onFileRemove: (fieldId: string) => void;
  attachment?: Attachment;
}

const getFieldIcon = (type: FieldType) => {
    switch (type) {
        case 'SIGNATURE': return 'sign';
        case 'INITIALS': return 'initials';
        case 'FULL_NAME': return 'user';
        case 'DATE': return 'calendar';
        case 'FILE_UPLOAD': return 'paperclip';
        default: return '';
    }
};

const SigningField: React.FC<SigningFieldProps> = ({ field, recipient, isCurrentUserField, onFileUpload, onFileRemove, attachment }) => {
  const color = recipient?.color || '#888';
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(field.id, e.target.files[0]);
    }
  };

  const fieldStyle: React.CSSProperties = {
    left: `${field.x * 100}%`,
    top: `${field.y * 100}%`,
    width: `${field.width * 100}%`,
    height: `${field.height * 100}%`,
    backgroundColor: isCurrentUserField ? `${color}4D` : `${color}20`,
    border: `2px ${isCurrentUserField ? 'dashed' : 'dotted'} ${color}`,
    boxSizing: 'border-box',
  };

  const content = () => {
    if (field.type === 'FILE_UPLOAD' && isCurrentUserField) {
      if (attachment) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 cursor-default">
            <Icon name="approve" className="w-5 h-5 text-green-400" />
            <p className="text-xs font-semibold truncate w-full" title={attachment.fileName}>{attachment.fileName}</p>
            <button
              onClick={() => onFileRemove(field.id)}
              className="text-red-400 hover:text-red-300 text-xs font-bold mt-1"
            >
              Remove
            </button>
          </div>
        );
      }
      return (
        <>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-white/10"
            >
                <Icon name={getFieldIcon(field.type)} className="w-5 h-5" />
                <span className="text-xs font-semibold">Upload File</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </>
      );
    }
    return (
      <div className="flex items-center gap-1 pointer-events-none">
        <Icon name={getFieldIcon(field.type)} className="w-4 h-4" />
        <span className="text-sm">{field.type.replace('_', ' ')}</span>
      </div>
    );
  };

  return (
    <div
      className="absolute flex items-center justify-center text-white font-bold rounded-sm transition-all"
      style={fieldStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {content()}
    </div>
  );
};

export default SigningField;
