import { v4 as uuidv4 } from 'uuid';
import * as forge from 'node-forge';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { type SignaturePlacement, type SignerInfo } from '../types';

const generateSelfSignedCertificate = (signerName: string) => {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(19)); // 20 bytes
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [{
        name: 'commonName',
        value: signerName
    }, {
        name: 'countryName',
        value: 'US'
    }, {
        shortName: 'ST',
        value: 'California'
    }, {
        name: 'localityName',
        value: 'San Francisco'
    }, {
        name: 'organizationName',
        value: 'Self-Signed'
    }, {
        shortName: 'OU',
        value: 'Document Signing'
    }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    }, {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
    }, {
        name: 'subjectKeyIdentifier'
    }]);

    // self-sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    return {
        cert,
        keys
    };
};


export const applyDigitalSignatures = async (
    pdfBuffer: ArrayBuffer,
    placements: SignaturePlacement[],
    signerInfo: SignerInfo
): Promise<Uint8Array> => {
    // Generate certificate on the fly
    const { cert } = generateSelfSignedCertificate(signerInfo.fullName);
    const subjectName = cert.subject.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', ');

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
            // FIX: 'backgroundColor' is not a valid property for PDFPageDrawRectangleOptions. It has been changed to 'color' which is the correct property for setting the fill color.
            color: rgb(0.95, 0.95, 0.95),
        });

        switch (placement.type) {
            case 'SIGNATURE': {
                const signatureText = signerInfo.fullName;
                const signatureTextWidth = fontBold.widthOfTextAtSize(signatureText, 14);
                
                const details = [
                    `Digitally Signed by: ${subjectName}`,
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