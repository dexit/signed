export type SignatureTab = 'draw' | 'type' | 'upload';

export type FieldType = 'SIGNATURE' | 'INITIALS' | 'FULL_NAME' | 'DATE' | 'FILE_UPLOAD';

export type RecipientStatus = 'Pending' | 'Signed';
export type TemplateStatus = 'Draft' | 'Sent' | 'Completed' | 'Approved' | 'Rejected';

export interface Requester {
  name: string;
  email: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  color: string;
  status: RecipientStatus;
  signedAt?: string; // ISO 8601 date string
}

export interface Signature {
  id: string;
  recipientId: string;
  dataUrl: string;
  type: SignatureTab;
}

export interface SignatureField {
  id: string;
  recipientId: string;
  page: number;
  x: number; // as percentage of page width
  y: number; // as percentage of page height
  width: number; // as percentage of page width
  height: number; // as percentage of page height
  type: FieldType;
}

export interface SignaturePlacement {
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: FieldType;
}

export interface Attachment {
  id: string;
  fieldId: string;
  recipientId: string;
  fileName: string;
  dataUrl: string;
  mimeType: string;
}

export interface Template {
    id: string;
    pdf: string; // base64 encoded PDF data
    fileName: string;
    requester: Requester;
    recipients: Recipient[];
    fields: SignatureField[];
    status: TemplateStatus;
    lastSignedPdf?: string; // base64 encoded PDF, updated after each signature
    attachments?: Attachment[];
}

export interface SignerInfo {
    fullName: string;
    initials: string;
}