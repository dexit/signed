import React, { useState, useEffect } from 'react';
import { type Template } from '../types';
import { Icon } from './Icon';

interface DashboardProps {
    onStartSetup: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartSetup }) => {
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        const keys = Object.keys(localStorage);
        const templateKeys = keys.filter(k => k.startsWith('template-'));
        try {
            const loadedTemplates = templateKeys.map(k => JSON.parse(localStorage.getItem(k)!));
            setTemplates(loadedTemplates.sort((a,b) => b.id.localeCompare(a.id)));
        } catch (error) {
            console.error("Failed to parse templates from local storage:", error);
        }
    }, []);

    const clearAllDocuments = () => {
        if (window.confirm("Are you sure you want to delete all documents? This action cannot be undone.")) {
            const keys = Object.keys(localStorage);
            const templateKeys = keys.filter(k => k.startsWith('template-'));
            templateKeys.forEach(k => localStorage.removeItem(k));
            setTemplates([]);
        }
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center bg-slate-900 p-4 sm:p-8">
            <header className="w-full max-w-5xl text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">Document Signing Dashboard</h1>
                <p className="text-lg text-slate-400">Manage your documents and start new signing sessions.</p>
            </header>

            <main className="w-full max-w-5xl">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-semibold">Your Documents</h2>
                    <button 
                        onClick={onStartSetup}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105"
                    >
                        <Icon name="newFile" className="w-5 h-5"/>
                        <span>Prepare a New Document</span>
                    </button>
                </div>
                <div className="bg-slate-800 rounded-xl shadow-2xl">
                    <div className="p-4 sm:p-6 min-h-[400px]">
                        {templates.length > 0 ? (
                            <ul className="space-y-3">
                                {templates.map(template => (
                                    <li key={template.id} className="bg-slate-700/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div>
                                            <p className="font-semibold text-white">{template.fileName}</p>
                                            <p className="text-sm text-slate-400">
                                                {template.recipients.length} recipient(s) - {template.fields.length} field(s)
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                             <span>ID: {template.id}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-20">
                                <Icon name="uploadCloud" className="w-20 h-20 mx-auto text-slate-600 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-300">No documents found.</h3>
                                <p className="text-slate-500 mt-2">Click "Prepare a New Document" to get started.</p>
                            </div>
                        )}
                    </div>
                     {templates.length > 0 && (
                         <div className="border-t border-slate-700 p-4 text-right">
                            <button 
                                onClick={clearAllDocuments}
                                className="text-sm text-red-400 hover:text-red-300 hover:underline"
                            >
                                Clear All Documents
                            </button>
                        </div>
                     )}
                </div>
            </main>
             <footer className="mt-12 text-center text-slate-500">
                <p>&copy; {new Date().getFullYear()} - Document Workflow Demo</p>
            </footer>
        </div>
    );
};

export default Dashboard;
