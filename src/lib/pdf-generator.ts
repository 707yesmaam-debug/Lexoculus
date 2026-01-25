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
                margins: { top: 60, bottom: 60, left: 60, right: 60 }
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
 * Following LexOculus editorial design: serif headers, monospace data, clean borders
 */
export async function generateComplianceReport(data: any): Promise<Buffer> {
    return generatePdfBuffer((doc) => {
        const PRIMARY = '#000000';
        const ACCENT = '#FF4F00';
        const GRAY = '#555555';
        const LIGHT_GRAY = '#999999';
        const BORDER = '#E5E5E5';

        // === HEADER SECTION ===
        // Logo/Brand (Editorial style)
        doc.fontSize(20)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text('LEX', 60, 60, { continued: true })
            .fillColor(ACCENT)
            .text('OCULUS');

        // Metadata (Monospace style)
        doc.fontSize(8)
            .font('Courier')
            .fillColor(GRAY)
            .text(`GENERATED: ${new Date().toLocaleDateString('en-US').toUpperCase()}`, 400, 60, { align: 'right' });

        doc.fontSize(8)
            .text(`REPOSITORY: ${(data.repo?.repo_name || 'N/A').toUpperCase()}`, 400, 72, { align: 'right' });

        // Top border (editorial divider)
        doc.moveTo(60, 95)
            .lineTo(535, 95)
            .lineWidth(2)
            .stroke(PRIMARY);

        // === TITLE SECTION ===
        doc.fontSize(32)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text('Compliance Report', 60, 115);

        doc.fontSize(11)
            .font('Helvetica')
            .fillColor(GRAY)
            .text('EU AI Act Risk Assessment & Capabilities Analysis', 60, 155, { width: 475 });

        // === SCORE CARD (Bordered Box) ===
        const score = data.assessment?.final_risk_score || 0;
        const classification = data.assessment?.final_risk_classification || 'UNKNOWN';

        // Risk color mapping
        let riskColor = PRIMARY;
        let riskBg = '#F5F5F5';
        if (classification === 'MINIMAL_RISK') {
            riskColor = '#10B981';
            riskBg = '#ECFDF5';
        } else if (classification === 'LIMITED_RISK') {
            riskColor = '#F59E0B';
            riskBg = '#FFFBEB';
        } else if (classification === 'HIGH_RISK') {
            riskColor = ACCENT;
            riskBg = '#FFF7ED';
        } else if (classification === 'UNACCEPTABLE') {
            riskColor = '#EF4444';
            riskBg = '#FEF2F2';
        }

        // Score box with editorial border
        doc.rect(60, 185, 475, 140)
            .fillAndStroke(riskBg, PRIMARY)
            .lineWidth(2);

        // Label (Monospace uppercase)
        doc.fontSize(9)
            .font('Courier-Bold')
            .fillColor(LIGHT_GRAY)
            .text('COMPLIANCE SCORE', 60, 205, { width: 475, align: 'center' });

        // Score (Large serif)
        doc.fontSize(56)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text(`${score}`, 60, 230, { width: 475, align: 'center' });

        // Out of 100
        doc.fontSize(16)
            .font('Helvetica')
            .fillColor(GRAY)
            .text('/100', 60, 290, { width: 475, align: 'center' });

        // Risk classification badge
        doc.fontSize(12)
            .font('Courier-Bold')
            .fillColor(riskColor)
            .text(classification.replace(/_/g, ' '), 60, 308, { width: 475, align: 'center' });

        // === CAPABILITIES SECTION ===
        doc.fontSize(18)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text('Capabilities Detected', 60, 360);

        // Section divider
        doc.moveTo(60, 385)
            .lineTo(535, 385)
            .lineWidth(1)
            .stroke(BORDER);

        const capabilities = data.capabilities?.detected_capabilities || [];
        let yPos = 405;

        if (capabilities.length === 0) {
            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(GRAY)
                .text('No specific AI capabilities detected.', 60, yPos);
        } else {
            capabilities.forEach((capability: string, index: number) => {
                // Check if we need a new page
                if (yPos > 720) {
                    doc.addPage();
                    yPos = 60;

                    // Repeat header on new page
                    doc.fontSize(18)
                        .font('Times-Bold')
                        .fillColor(PRIMARY)
                        .text('Capabilities Detected (continued)', 60, yPos);
                    yPos += 35;
                }

                // Bullet point (editorial style)
                doc.fontSize(11)
                    .font('Helvetica')
                    .fillColor(PRIMARY)
                    .text('■', 70, yPos)
                    .text(capability, 90, yPos, { width: 445 });

                yPos += 22;
            });
        }

        // === FOOTER ===
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);

            // Footer divider
            doc.moveTo(60, 780)
                .lineTo(535, 780)
                .lineWidth(1)
                .stroke(BORDER);

            // Footer text
            doc.fontSize(8)
                .font('Courier')
                .fillColor(LIGHT_GRAY)
                .text('Generated by LexOculus Compliance Platform', 60, 790, { width: 235 });

            doc.text(`Page ${i + 1} of ${pageCount}`, 300, 790, { width: 235, align: 'right' });
        }
    });
}

/**
 * Generates the Trust Pack PDF for vendors
 * Editorial certificate design
 */
export async function generateTrustPackPDF(data: any): Promise<Buffer> {
    return generatePdfBuffer((doc) => {
        const PRIMARY = '#000000';
        const ACCENT = '#FF4F00';
        const GRAY = '#555555';

        // === HEADER ===
        doc.fontSize(20)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text('LEX', 60, 60, { continued: true })
            .fillColor(ACCENT)
            .text('OCULUS');

        // === CERTIFICATE SEAL ===
        // Outer border (thick)
        doc.rect(120, 200, 350, 320)
            .lineWidth(3)
            .stroke(PRIMARY);

        // Inner border
        doc.rect(130, 210, 330, 300)
            .lineWidth(1)
            .stroke(PRIMARY);

        // Title
        doc.fontSize(32)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text('Scan Verified', 120, 250, { width: 350, align: 'center' });

        // Subtitle
        doc.fontSize(12)
            .font('Helvetica')
            .fillColor(GRAY)
            .text('This software repository has been scanned', 120, 300, { width: 350, align: 'center' })
            .text('for EU AI Act compliance risks.', 120, 317, { width: 350, align: 'center' });

        // Risk badge
        const riskText = data.riskClassification || 'UNKNOWN';
        let riskColor = PRIMARY;
        if (riskText.includes('MINIMAL')) riskColor = '#10B981';
        else if (riskText.includes('LIMITED')) riskColor = '#F59E0B';
        else if (riskText.includes('HIGH')) riskColor = ACCENT;
        else if (riskText.includes('UNACCEPTABLE')) riskColor = '#EF4444';

        doc.fontSize(16)
            .font('Courier-Bold')
            .fillColor(riskColor)
            .text(`RISK LEVEL: ${riskText.replace(/_/g, ' ')}`, 120, 360, { width: 350, align: 'center' });

        // Metadata
        doc.fontSize(9)
            .font('Courier')
            .fillColor(GRAY)
            .text(`REPOSITORY: ${(data.repoScan?.repo_name || 'N/A').toUpperCase()}`, 120, 420, { width: 350, align: 'center' })
            .text(`SCAN DATE: ${new Date(data.generatedAt).toLocaleDateString('en-US').toUpperCase()}`, 120, 435, { width: 350, align: 'center' })
            .text(`REFERENCE ID: ${(data.repoScan?.id?.slice(0, 8) || 'N/A').toUpperCase()}`, 120, 450, { width: 350, align: 'center' });

        // Footer
        doc.fontSize(8)
            .font('Courier')
            .fillColor(GRAY)
            .text('This certificate is valid only with the accompanying compliance documentation.', 60, 750, {
                width: 475,
                align: 'center'
            });
    });
}

/**
 * Generates a compliance document PDF from HTML content
 * Editorial document style
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
        const GRAY = '#555555';
        const LIGHT_GRAY = '#999999';

        // === HEADER ===
        doc.fontSize(20)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text('LEX', 60, 60, { continued: true })
            .fillColor(ACCENT)
            .text('OCULUS');

        // Metadata
        doc.fontSize(8)
            .font('Courier')
            .fillColor(GRAY)
            .text(`AI SYSTEM: ${documentData.aiSystemName.toUpperCase()}`, 60, 85);

        doc.fontSize(8)
            .text(`DOCUMENT TYPE: ${documentData.documentType.toUpperCase()}`, 60, 97);

        // Top divider
        doc.moveTo(60, 120)
            .lineTo(535, 120)
            .lineWidth(2)
            .stroke(PRIMARY);

        // === TITLE ===
        doc.fontSize(28)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text(documentData.title, 60, 140, { width: 475 });

        // === BODY ===
        // Strip HTML and clean text
        const plainText = documentData.bodyHtml
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();

        doc.fontSize(11)
            .font('Helvetica')
            .fillColor(PRIMARY)
            .text(plainText, 60, 200, {
                width: 475,
                align: 'left',
                lineGap: 6
            });

        // === FOOTER ===
        doc.moveTo(60, 780)
            .lineTo(535, 780)
            .lineWidth(1)
            .stroke('#E5E5E5');

        doc.fontSize(8)
            .font('Courier')
            .fillColor(LIGHT_GRAY)
            .text('Generated by LexOculus EU AI Act Compliance Platform', 60, 790, { width: 475, align: 'center' })
            .text(new Date().toISOString(), 60, 802, { width: 475, align: 'center' });
    });
}
