import PDFDocument from 'pdfkit';

/**
 * Core function to generate PDF from structured data using PDFKit
 * This replaces Puppeteer/Chromium to avoid serverless compatibility issues
 */
export async function generatePdfBuffer(buildContent: (doc: typeof PDFDocument.prototype) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 72, bottom: 72, left: 72, right: 72 }
            });

            const buffers: Buffer[] = [];

            doc.on('data', (buffer) => buffers.push(buffer));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            // Execute the content builder
            buildContent(doc);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generates the official Compliance Report PDF
 */
export async function generateComplianceReport(data: any): Promise<Buffer> {
    return generatePdfBuffer((doc) => {
        const PRIMARY = '#000000';
        const ACCENT = '#FF4F00';
        const GRAY = '#666666';
        const LIGHT_GRAY = '#999999';

        // Header
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text('LEX', 72, 72, { continued: true })
            .fillColor(ACCENT)
            .text('OCULUS');

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor(GRAY)
            .text(`Generated: ${new Date().toLocaleDateString()}`, 400, 72, { align: 'right' });

        doc.fontSize(9)
            .text(`Repo: ${data.repo?.repo_name || 'N/A'}`, 400, 85, { align: 'right' });

        // Divider
        doc.moveTo(72, 110)
            .lineTo(540, 110)
            .lineWidth(2)
            .stroke(PRIMARY);

        // Title
        doc.moveDown(2);
        doc.fontSize(24)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text('Compliance Report', 72, 140);

        doc.fontSize(11)
            .font('Helvetica')
            .fillColor(GRAY)
            .text('Detailed risk assessment and capabilities analysis for EU AI Act compliance.', 72, 175, { width: 450 });

        // Score Card
        const score = data.assessment?.final_risk_score || 0;
        const classification = data.assessment?.final_risk_classification || 'UNKNOWN';
        const scoreColor = score > 80 ? '#16a34a' : '#d97706';

        doc.rect(72, 210, 450, 120)
            .fillAndStroke('#f8f9fa', '#e9ecef');

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor(LIGHT_GRAY)
            .text('COMPLIANCE SCORE', 72, 230, { width: 450, align: 'center' });

        doc.fontSize(48)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text(`${score}/100`, 72, 250, { width: 450, align: 'center' });

        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor(scoreColor)
            .text(classification, 72, 310, { width: 450, align: 'center' });

        // Capabilities Section
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text('Capabilities Detected', 72, 370);

        doc.moveTo(72, 395)
            .lineTo(540, 395)
            .lineWidth(1)
            .stroke('#eeeeee');

        const capabilities = data.capabilities?.detected_capabilities || [];
        let yPos = 410;

        if (capabilities.length === 0) {
            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(GRAY)
                .text('No specific AI capabilities detected.', 72, yPos);
        } else {
            capabilities.forEach((capability: string, index: number) => {
                // Check if we need a new page
                if (yPos > 700) {
                    doc.addPage();
                    yPos = 72;
                }

                doc.fontSize(11)
                    .font('Helvetica')
                    .fillColor(PRIMARY)
                    .text('•', 82, yPos)
                    .text(capability, 102, yPos, { width: 420 });

                yPos += 20;
            });
        }
    });
}

/**
 * Generates the Trust Pack PDF for vendors
 */
export async function generateTrustPackPDF(data: any): Promise<Buffer> {
    return generatePdfBuffer((doc) => {
        const PRIMARY = '#000000';
        const ACCENT = '#FF4F00';
        const GRAY = '#666666';

        // Logo
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text('LEX', 72, 72, { continued: true })
            .fillColor(ACCENT)
            .text('OCULUS');

        // Trust Seal Box
        doc.rect(120, 200, 350, 280)
            .lineWidth(2)
            .fillAndStroke('#fafafa', PRIMARY);

        doc.fontSize(24)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text('Scan Verified', 120, 240, { width: 350, align: 'center' });

        doc.fontSize(12)
            .font('Helvetica')
            .fillColor(GRAY)
            .text('This software repository has been scanned for', 120, 280, { width: 350, align: 'center' })
            .text('EU AI Act compliance risks.', 120, 297, { width: 350, align: 'center' });

        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text(`Risk Level: ${data.riskClassification || 'UNKNOWN'}`, 120, 340, { width: 350, align: 'center' });

        // Metadata
        doc.fontSize(9)
            .font('Courier')
            .fillColor(GRAY)
            .text(`Repo: ${data.repoScan?.repo_name || 'N/A'}`, 120, 400, { width: 350, align: 'center' })
            .text(`Date: ${new Date(data.generatedAt).toLocaleDateString()}`, 120, 415, { width: 350, align: 'center' })
            .text(`Ref: ${data.repoScan?.id?.slice(0, 8) || 'N/A'}`, 120, 430, { width: 350, align: 'center' });
    });
}

/**
 * Generates a compliance document PDF from HTML content
 * This is used for exporting user-generated compliance documents
 */
export async function generateDocumentPDF(documentData: {
    title: string;
    documentType: string;
    aiSystemName: string;
    bodyHtml: string;
}): Promise<Buffer> {
    return generatePdfBuffer((doc) => {
        const PRIMARY = '#000000';
        const ACCENT = '#FF4F00';
        const GRAY = '#666666';

        // Header
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text('LEX', 72, 72, { continued: true })
            .fillColor(ACCENT)
            .text('OCULUS');

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor(GRAY)
            .text(`AI System: ${documentData.aiSystemName}`, 72, 95);

        doc.fontSize(8)
            .fillColor(GRAY)
            .text(`Document Type: ${documentData.documentType}`, 72, 108);

        // Divider
        doc.moveTo(72, 130)
            .lineTo(540, 130)
            .lineWidth(2)
            .stroke(PRIMARY);

        // Title
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text(documentData.title, 72, 150, { width: 450 });

        // Body Content (simplified HTML rendering)
        // Note: PDFKit doesn't support HTML, so we extract text content
        const plainText = documentData.bodyHtml
            .replace(/<[^>]*>/g, '') // Strip HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();

        doc.fontSize(11)
            .font('Helvetica')
            .fillColor(PRIMARY)
            .text(plainText, 72, 200, {
                width: 450,
                align: 'left',
                lineGap: 5
            });

        // Footer
        const footerY = doc.page.height - 100;
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor(GRAY)
            .text(`Generated by LexOculus EU AI Act Compliance Platform`, 72, footerY, { width: 450, align: 'center' })
            .text(`${new Date().toISOString()}`, 72, footerY + 12, { width: 450, align: 'center' });
    });
}
