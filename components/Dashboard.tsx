import React, { useState, useEffect, useRef } from 'react';
import { type Template, type TemplateStatus } from '../types';
import { Icon } from './Icon';
import ActionsModal from './ActionsModal';
import { downloadActivityLog } from '../lib/log-downloader';

interface DashboardProps {
    onStartSetup: () => void;
    onSignRequest: (templateId: string, recipientId: string) => void;
    onEditTemplate: (templateId: string) => void;
    onUseTemplate: (templateId: string) => void;
}

const StatusBadge: React.FC<{ status: TemplateStatus }> = ({ status }) => {
    const statusStyles: Record<TemplateStatus, string> = {
        Draft: 'bg-slate-500 text-slate-100',
        Sent: 'bg-blue-500 text-white',
        Completed: 'bg-green-500 text-white',
        Approved: 'bg-emerald-500 text-white',
        Rejected: 'bg-red-500 text-white',
    };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>{status}</span>;
}

const RecipientStatusIcon: React.FC<{ status: 'Pending' | 'Signed' }> = ({ status }) => {
    if (status === 'Signed') {
        return <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
    return <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

const AdminActionsMenu: React.FC<{
    template: Template,
    onEdit: () => void,
    onSetToDraft: () => void,
    onApprove: () => void,
    onReject: () => void,
}> = ({ template, onEdit, onSetToDraft, onApprove, onReject }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const actions = [];
    if (template.status === 'Draft') {
        actions.push({ label: 'Edit', icon: 'edit', action: onEdit });
    }
    if (template.status === 'Sent') {
        actions.push({ label: 'Set to Draft', icon: 'draft', action: onSetToDraft });
    }
    if (template.status === 'Completed') {
        actions.push({ label: 'Approve', icon: 'approve', action: onApprove, className: 'text-green-400' });
        actions.push({ label: 'Reject', icon: 'reject', action: onReject, className: 'text-red-400' });
    }
    if(actions.length === 0) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-slate-600" title="Admin Actions"><Icon name="more" className="w-5 h-5"/></button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg z-20">
                    <ul className="py-1">
                        {actions.map(action => (
                             <li key={action.label}>
                                <a href="#" onClick={(e) => { e.preventDefault(); action.action(); setIsOpen(false); }} className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-600 ${action.className || ''}`}>
                                   <Icon name={action.icon} className="w-4 h-4"/>
                                   <span>{action.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ onStartSetup, onSignRequest, onEditTemplate, onUseTemplate }) => {
    const [activeDocuments, setActiveDocuments] = useState<Template[]>([]);
    const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [actionsModalTemplate, setActionsModalTemplate] = useState<Template | null>(null);

    const loadData = () => {
        const keys = Object.keys(localStorage);
        const templateKeys = keys.filter(k => k.startsWith('template-'));
        try {
            const allItems = templateKeys.map(k => JSON.parse(localStorage.getItem(k)!))
                .sort((a,b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
            
            setActiveDocuments(allItems.filter(item => !item.isTemplate));
            setSavedTemplates(allItems.filter(item => item.isTemplate));

        } catch (error) {
            console.error("Failed to parse templates from local storage:", error);
        }
    };

    useEffect(() => {
        loadData();
        window.addEventListener('storage', loadData); // Real-time updates
        return () => window.removeEventListener('storage', loadData);
    }, []);
    
    const updateTemplate = (id: string, updates: Partial<Template>) => {
        const templateString = localStorage.getItem(id);
        if (templateString) {
            const template = JSON.parse(templateString);
            const updatedTemplate = { ...template, ...updates };
            localStorage.setItem(id, JSON.stringify(updatedTemplate));
            loadData();
        }
    };
    
    const handleSetToDraft = (template: Template) => {
        if (window.confirm("Are you sure? This will revert the document to a draft, and any collected signatures will be removed.")) {
            updateTemplate(template.id, {
                status: 'Draft',
                recipients: template.recipients.map(r => ({ ...r, status: 'Pending', signedAt: undefined })),
                lastSignedPdf: undefined,
                activityLog: [...(template.activityLog || []), { timestamp: new Date().toISOString(), message: 'Document reverted to Draft status.' }]
            });
        }
    };

    const deleteItem = (id: string) => {
        if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
            localStorage.removeItem(id);
            loadData();
        }
    }
    
    const downloadSignedPdf = (template: Template) => {
        if (!template.lastSignedPdf && template.status !== 'Completed') {
             alert("The document is not yet completed.");
             return;
        }
        const pdfData = atob(template.lastSignedPdf || template.pdf);
        const bytes = new Uint8Array(pdfData.length);
        for(let i = 0; i < pdfData.length; i++) {
            bytes[i] = pdfData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `[SIGNED] ${template.fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const renderDocumentList = (documents: Template[]) => (
        <ul className="space-y-3">
            {documents.map(template => (
                <li key={template.id} className="bg-slate-700/50 p-4 rounded-lg flex flex-col gap-3 transition-all">
                    <div className="flex justify-between items-center w-full">
                        <div 
                            className="flex items-center gap-4 flex-grow cursor-pointer" 
                            onClick={() => setExpandedItemId(expandedItemId === template.id ? null : template.id)}
                        >
                            <StatusBadge status={template.status} />
                            <div>
                                <p className="font-semibold text-white flex items-center gap-2">
                                    {template.fileName}
                                    {template.attachments && template.attachments.length > 0 && 
                                        <span title={`${template.attachments.length} attachment(s)`}><Icon name="paperclip" className="w-4 h-4 text-slate-400" /></span>}
                                </p>
                                <p className="text-sm text-slate-400">
                                    {template.recipients.length} recipient role(s) - Created {new Date(parseInt(template.id.split('-')[1])).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {template.status === 'Completed' && (
                                <button onClick={(e) => { e.stopPropagation(); downloadSignedPdf(template); }} className="p-2 rounded-md hover:bg-slate-600" title="Download Signed PDF"><Icon name="download" className="w-5 h-5"/></button>
                            )}
                             {template.status !== 'Draft' && template.status !== 'Approved' && template.status !== 'Rejected' && (
                                <button onClick={(e) => { e.stopPropagation(); setActionsModalTemplate(template); }} className="p-2 rounded-md hover:bg-slate-600" title="Recipient Actions"><Icon name="link" className="w-5 h-5"/></button>
                            )}
                            <AdminActionsMenu
                                template={template}
                                onEdit={() => onEditTemplate(template.id)}
                                onSetToDraft={() => handleSetToDraft(template)}
                                onApprove={() => updateTemplate(template.id, { status: 'Approved', activityLog: [...(template.activityLog || []), { timestamp: new Date().toISOString(), message: 'Document Approved.' }] })}
                                onReject={() => updateTemplate(template.id, { status: 'Rejected', activityLog: [...(template.activityLog || []), { timestamp: new Date().toISOString(), message: 'Document Rejected.' }] })}
                            />
                            <button onClick={(e) => { e.stopPropagation(); deleteItem(template.id); }} className="p-2 rounded-md hover:bg-slate-600 text-red-400" title="Delete Document"><Icon name="trash" className="w-5 h-5"/></button>
                        </div>
                    </div>
                     {expandedItemId === template.id && (
                        <div className="pl-8 pt-3 border-t border-slate-600/50 space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Recipients</h4>
                                <ul className="space-y-2">
                                    {template.recipients.map(r => (
                                        <li key={r.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <RecipientStatusIcon status={r.status} />
                                                <span>{r.name} ({r.email})</span>
                                            </div>
                                            <span className="text-slate-400">{r.signedAt ? `Signed on ${new Date(r.signedAt).toLocaleString()}` : 'Awaiting signature'}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             {template.activityLog && template.activityLog.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold">Activity Log</h4>
                                        <button onClick={() => downloadActivityLog(template)} className="text-xs text-indigo-400 hover:underline">Download Log</button>
                                    </div>
                                    <ul className="space-y-1 text-xs text-slate-400 max-h-32 overflow-y-auto">
                                        {template.activityLog.map(log => (
                                            <li key={log.timestamp}>
                                                <span className="font-mono text-slate-500 mr-2">{new Date(log.timestamp).toLocaleString()}</span>
                                                <span>{log.message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );

     const renderTemplateList = (templates: Template[]) => (
        <ul className="space-y-3">
            {templates.map(template => (
                 <li key={template.id} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between gap-3 transition-all">
                    <div>
                        <p className="font-semibold text-white">{template.fileName}</p>
                        <p className="text-sm text-slate-400">{template.recipients.length} recipient role(s)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onUseTemplate(template.id)} className="px-4 py-2 text-sm font-semibold bg-indigo-600 rounded-md hover:bg-indigo-500">Use</button>
                        <button onClick={() => deleteItem(template.id)} className="p-2 rounded-md hover:bg-slate-600 text-red-400" title="Delete Template"><Icon name="trash" className="w-5 h-5"/></button>
                    </div>
                 </li>
            ))}
        </ul>
     );

    return (
        <div className="w-full min-h-screen flex flex-col items-center bg-slate-900 p-4 sm:p-8">
            {actionsModalTemplate && <ActionsModal template={actionsModalTemplate} onClose={() => setActionsModalTemplate(null)} onSignRequest={onSignRequest}/>}

            <header className="w-full max-w-5xl text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">Document Signing Dashboard</h1>
                <p className="text-lg text-slate-400">Manage your documents and start new signing sessions.</p>
            </header>

            <main className="w-full max-w-5xl">
                 <div className="flex flex-col sm:flex-row justify-end items-center mb-6 gap-4">
                    <button 
                        onClick={onStartSetup}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105"
                    >
                        <Icon name="newFile" className="w-5 h-5"/>
                        <span>Prepare New Document</span>
                    </button>
                </div>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Active Documents</h2>
                        <div className="bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 min-h-[150px]">
                            {activeDocuments.length > 0 ? renderDocumentList(activeDocuments) : (
                                <div className="text-center py-10">
                                    <h3 className="text-xl font-semibold text-slate-300">No active documents.</h3>
                                    <p className="text-slate-500 mt-2">Prepare a new document or use a template to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Saved Templates</h2>
                        <div className="bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 min-h-[100px]">
                            {savedTemplates.length > 0 ? renderTemplateList(savedTemplates) : (
                                 <div className="text-center py-10">
                                    <h3 className="text-xl font-semibold text-slate-300">No saved templates.</h3>
                                    <p className="text-slate-500 mt-2">Save a document configuration as a template for easy reuse.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
             <footer className="mt-12 text-center text-slate-500">
                <p>&copy; {new Date().getFullYear()} - Document Workflow Demo</p>
            </footer>
        </div>
    );
};

export default Dashboard;