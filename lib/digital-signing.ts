import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { type SignaturePlacement, type SignerInfo } from '../types';

export const applyDigitalSignatures = async (
    pdfBuffer: ArrayBuffer,
    placements: SignaturePlacement[],
    signerInfo: SignerInfo
): Promise<Uint8Array> => {

    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const currentDate = new Date().toLocaleDateString();

    const signatureImage = signerInfo.signatureDataUrl ? await pdfDoc.embedPng(signerInfo.signatureDataUrl) : null;
    const initialsImage = signerInfo.initialsDataUrl ? await pdfDoc.embedPng(signerInfo.initialsDataUrl) : null;

    for (const placement of placements) {
        if (placement.pageIndex >= pages.length) continue;

        const page = pages[placement.pageIndex];
        const { height: pageHeight } = page.getSize();
        
        const pdfX = placement.x;
        const pdfY = pageHeight - placement.y - placement.height;

        switch (placement.type) {
            case 'SIGNATURE': {
                if (signatureImage) {
                    page.drawImage(signatureImage, {
                        x: pdfX,
                        y: pdfY,
                        width: placement.width,
                        height: placement.height,
                    });
                }
                break;
            }
            case 'INITIALS': {
                if (initialsImage) {
                    page.drawImage(initialsImage, {
                        x: pdfX,
                        y: pdfY,
                        width: placement.width,
                        height: placement.height,
                    });
                }
                break;
            }
            case 'FULL_NAME': {
                page.drawText(signerInfo.fullName, {
                    x: pdfX + 5,
                    y: pdfY + (placement.height / 2) - 6,
                    font,
                    size: 12,
                    color: rgb(0, 0, 0),
                });
                break;
            }
            case 'DATE': {
                page.drawText(currentDate, {
                    x: pdfX + 5,
                    y: pdfY + (placement.height / 2) - 5,
                    font,
                    size: 10,
                    color: rgb(0, 0, 0),
                });
                break;
            }
        }
    }

    return pdfDoc.save();
};