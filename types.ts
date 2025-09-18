export type SignatureTab = 'draw' | 'type' | 'upload';

export type FieldType = 'SIGNATURE' | 'INITIALS' | 'FULL_NAME' | 'DATE';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  color: string;
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

export interface Template {
    id: string;
    pdf: string; // base64 encoded PDF data
    fileName: string;
    recipients: Recipient[];
    fields: SignatureField[];
}

export interface SignerInfo {
    fullName: string;
    initials: string;
}