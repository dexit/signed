import React from 'react';
import { Icon } from './Icon';

interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNewFileClick: () => void;
  onRotatePage: () => void;
  onGenerateLinksClick: () => void;
  isSetupComplete: boolean;
  saveButtonText?: string;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
}> = ({ onClick, disabled, children, className, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`px-3 py-2 flex items-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onNewFileClick,
  onRotatePage,
  onGenerateLinksClick,
  isSetupComplete,
  saveButtonText = "Generate Links"
}) => {
  return (
    <header className="bg-slate-900 p-2 flex items-center justify-between sticky top-0 z-10 shadow-md border-b border-slate-700/50">
      <div className="flex items-center gap-2">
        <ToolbarButton onClick={onNewFileClick} className="bg-slate-700 hover:bg-slate-600" title="Load New PDF">
          <Icon name="newFile" className="w-5 h-5" />
          New File
        </ToolbarButton>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous Page"
            >
            &lt;
            </button>
            <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
            </span>
            <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next Page"
            >
            &gt;
            </button>
        </div>
        <ToolbarButton onClick={onRotatePage} className="bg-slate-700 hover:bg-slate-600 p-2" title="Rotate Page Clockwise">
          <Icon name="rotate" className="w-5 h-5" />
        </ToolbarButton>
      </div>

      <div className="flex items-center gap-2">
        <ToolbarButton
          onClick={onGenerateLinksClick}
          disabled={!isSetupComplete}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-slate-400"
          title={isSetupComplete ? `${saveButtonText} for recipients` : "Add recipients and place fields to enable saving"}
        >
          <Icon name="link" className="w-5 h-5" />
          {saveButtonText}
        </ToolbarButton>
      </div>
    </header>
  );
};

export default Toolbar;