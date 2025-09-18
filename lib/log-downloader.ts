import { type Template } from '../types';

export const downloadActivityLog = (template: Template): void => {
    if (!template.activityLog || template.activityLog.length === 0) {
        alert("No activity to download.");
        return;
    }

    const logHeader = `Activity Log for: ${template.fileName}\nDocument ID: ${template.id}\n\n`;
    
    const logContent = template.activityLog
        .map(log => `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`)
        .join('\n');

    const fullLog = logHeader + logContent;

    const blob = new Blob([fullLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.fileName.replace('.pdf', '')}-activity-log.txt`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
