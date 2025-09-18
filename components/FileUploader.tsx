
import React, { useState } from 'react';
import { Icon } from './Icon';

interface FileUploaderProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // FIX: Changed event type from HTMLDivElement to HTMLElement to support drop events on non-div elements like <label>.
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange, onDrop }) => {
  const [isDragging, setIsDragging] = useState(false);

  // FIX: Changed event type from HTMLDivElement to HTMLElement to match the drop target element type (<label>).
  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // FIX: Changed event type from HTMLDivElement to HTMLElement to match the drop target element type (<label>).
  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // FIX: Changed event type from HTMLDivElement to HTMLElement to match the drop target element type (<label>).
  const handleDropInternal = (e: React.DragEvent<HTMLElement>) => {
    handleDragLeave(e);
    onDrop(e);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">React PDF Signature Tool</h1>
        <p className="text-lg text-slate-400">View, Sign, and Download PDFs with Ease</p>
      </div>
      <label
        htmlFor="pdf-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropInternal}
        className={`w-full max-w-2xl h-80 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-slate-800 scale-105' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800'}`}
      >
        <div className="text-center pointer-events-none">
          <Icon name="uploadCloud" className="w-20 h-20 mx-auto text-slate-500 mb-4" />
          <p className="text-2xl font-semibold text-white">
            <span className="text-indigo-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-slate-400 mt-2">PDF files only (max 50MB)</p>
        </div>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={onFileChange}
          className="hidden"
        />
      </label>
       <footer className="mt-12 text-center text-slate-500">
        <p>&copy; {new Date().getFullYear()} - Built for Demonstration</p>
      </footer>
    </div>
  );
};
