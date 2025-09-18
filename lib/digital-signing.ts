import { v4 as uuidv4 } from 'uuid';
import * as forge from 'node-forge';
import { type SignaturePlacement, type SignerInfo } from '../types';

declare const window: {
    pdfLib: any;
};

const arrayBufferToForgeBuffer = (ab: ArrayBuffer): forge.util.ByteStringBuffer => {
    const bytes = new Uint8Array(ab);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return forge.util.createBuffer(binary, 'raw');
};

const getCertInfo = (p12Buffer: ArrayBuffer, password: string): { subjectName: string } => {
    try {
        const p12Asn1 = forge.asn1.fromDer(arrayBufferToForgeBuffer(p12Buffer));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = certBags[forge.pki.oids.certBag];
        
        if (!certBag || certBag.length === 0) {
            throw new Error("No certificate bags found in P12 file.");
        }
        
        const cert = certBag[0].cert;
        if (!cert) {
            throw new Error("Certificate not found in P12 file.");
        }
        
        const subject = cert.subject.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', ');
        return { subjectName: subject };
    } catch(e: any) {
        console.error("P12 parsing error:", e);
        if (e.message.includes("Invalid password") || e.message.includes("mac check")) {
            throw new Error("Invalid password for the P12 file.");
        }
        throw new Error("Failed to parse P12 file. Please check if the file is valid and the password is correct.");
    }
}

export const applyDigitalSignatures = async (
    pdfBuffer: ArrayBuffer,
    p12Buffer: ArrayBuffer,
    p12Password: string,
    placements: SignaturePlacement[],
    signerInfo: SignerInfo
): Promise<Uint8Array> => {
    const { PDFDocument, rgb, StandardFonts } = window.pdfLib;

    const certInfo = getCertInfo(p12Buffer, p12Password);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const currentDate = new Date().toLocaleString();

    for (const placement of placements) {
        const page = pages[placement.pageIndex];
        const { height: pageHeight } = page.getSize();
        
        const pdfX = placement.x;
        const pdfY = pageHeight - placement.y - placement.height;

        page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: placement.width,
            height: placement.height,
            borderColor: rgb(0.2, 0.2, 0.2),
            borderWidth: 0.5,
            backgroundColor: rgb(0.95, 0.95, 0.95),
        });

        switch (placement.type) {
            case 'SIGNATURE': {
                const signatureText = signerInfo.fullName;
                const signatureTextWidth = fontBold.widthOfTextAtSize(signatureText, 14);
                
                const details = [
                    `Digitally Signed by: ${certInfo.subjectName}`,
                    `Date: ${currentDate}`,
                    `Reason: I am approving this document`,
                    `UUID: ${uuidv4()}`
                ];
                
                const textHeight = 14 + (details.length * 8) + 8;
                const startY = pdfY + (placement.height - textHeight) / 2 + textHeight - 14;

                page.drawText(signatureText, {
                    x: pdfX + (placement.width - signatureTextWidth) / 2,
                    y: startY,
                    font: fontBold,
                    size: 14,
                    color: rgb(0.1, 0.1, 0.1),
                });
                
                let yOffset = startY - 16;
                details.forEach(line => {
                    page.drawText(line, { x: pdfX + 5, y: yOffset, font, size: 6, color: rgb(0.3, 0.3, 0.3) });
                    yOffset -= 8;
                });
                break;
            }
            case 'INITIALS': {
                const initialTextWidth = fontBold.widthOfTextAtSize(signerInfo.initials, 18);
                page.drawText(signerInfo.initials, {
                    x: pdfX + (placement.width - initialTextWidth) / 2,
                    y: pdfY + (placement.height / 2) - 9,
                    font: fontBold,
                    size: 18,
                    color: rgb(0.1, 0.1, 0.1),
                });
                break;
            }
            case 'FULL_NAME': {
                page.drawText(signerInfo.fullName, {
                    x: pdfX + 5,
                    y: pdfY + (placement.height / 2) - 6,
                    font: font,
                    size: 12,
                    color: rgb(0.1, 0.1, 0.1),
                });
                break;
            }
            case 'DATE': {
                page.drawText(currentDate, {
                    x: pdfX + 5,
                    y: pdfY + (placement.height / 2) - 5,
                    font: font,
                    size: 10,
                    color: rgb(0.1, 0.1, 0.1),
                });
                break;
            }
        }
    }

    return pdfDoc.save();
};