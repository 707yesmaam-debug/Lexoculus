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
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                bufferPages: true
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
import { marked } from 'marked';

/**
 * Generates a compliance document PDF from Markdown content
 * Renders Markdown structure directly to PDFKit for precise layout control
 */
export async function generateDocumentPDF(documentData: {
    title: string;
    documentType: string;
    aiSystemName: string;
    markdown: string;
}): Promise<Buffer> {
    return generatePdfBuffer((doc) => {
        const PRIMARY = '#000000';
        const ACCENT = '#FF4F00';
        const GRAY = '#555555';
        const LIGHT_GRAY = '#999999';
        const BORDER = '#E5E5E5';

        // Helper to draw the standard page header
        const drawHeader = (doc: typeof PDFDocument.prototype, title?: string, subtitle?: string) => {
            // Logo
            doc.fontSize(20)
                .font('Times-Bold')
                .fillColor(PRIMARY)
                .text('LEX', 60, 60, { continued: true })
                .fillColor(ACCENT)
                .text('OCULUS');

            // Top Line
            doc.moveTo(60, 85)
                .lineTo(535, 85)
                .lineWidth(2)
                .stroke(PRIMARY);

            // Optional Sub-header for subsequent pages
            if (title) {
                doc.fontSize(8)
                    .font('Courier')
                    .fillColor(GRAY)
                    .text(title.toUpperCase(), 60, 95, { align: 'right', width: 475 });
            }
        };

        // Helper to parse and draw text with simple markdown (bold only for now)
        const drawStyledCell = (text: string, x: number, y: number, width: number) => {
            // Check for bold **text**
            const parts = text.split(/(\*\*.*?\*\*)/g);
            let currentX = x;

            parts.forEach(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    const content = part.slice(2, -2);
                    doc.font('Helvetica-Bold').text(content, currentX, y, { width: width, continued: true });
                } else {
                    doc.font('Helvetica').text(part, currentX, y, { width: width, continued: true });
                }
            });
            doc.text('', currentX, y, { continued: false }); // Reset lines
        };

        // Initial Header (Page 1)
        drawHeader(doc);

        // Metadata on Page 1
        doc.fontSize(8)
            .font('Courier')
            .fillColor(GRAY)
            .text(`AI SYSTEM: ${documentData.aiSystemName.toUpperCase()}`, 60, 100);

        doc.fontSize(8)
            .text(`DOCUMENT TYPE: ${documentData.documentType.toUpperCase()}`, 60, 112);

        // === TITLE ===
        doc.fontSize(28)
            .font('Times-Bold')
            .fillColor(PRIMARY)
            .text(documentData.title, 60, 140, { width: 475 });

        doc.moveDown(1.5);

        // === MARKDOWN RENDERER ===
        const tokens = marked.lexer(documentData.markdown);

        // Handle page headers automatically
        doc.on('pageAdded', () => {
            drawHeader(doc, documentData.title);
            doc.y = 110; // Ensure content starts below header
        });

        tokens.forEach((token) => {
            switch (token.type) {
                case 'heading': {
                    const level = token.depth;
                    const text = token.text;

                    doc.fillColor(PRIMARY).font('Times-Bold');

                    if (level === 1) {
                        doc.fontSize(24).text(text).moveDown(0.5);
                    } else if (level === 2) {
                        doc.fontSize(18).text(text).moveDown(0.5);
                        // Underline H2
                        doc.moveTo(60, doc.y - 5).lineTo(535, doc.y - 5).lineWidth(0.5).stroke(BORDER).moveDown(0.5);
                    } else if (level === 3) {
                        doc.fontSize(14).text(text).moveDown(0.5);
                    } else {
                        doc.fontSize(12).text(text).moveDown(0.5);
                    }
                    doc.font('Helvetica'); // Reset font
                    break;
                }

                case 'paragraph': {
                    const text = token.text.replace(/\*\*(.*?)\*\*/g, '$1');
                    doc.fontSize(11).fillColor(PRIMARY).font('Helvetica')
                        .text(text, { width: 475, align: 'justify' });
                    doc.moveDown(0.8);
                    break;
                }

                case 'list': {
                    token.items.forEach((item: any) => {
                        const text = item.text.replace(/\*\*(.*?)\*\*/g, '$1');
                        doc.fontSize(11).fillColor(PRIMARY).font('Helvetica')
                            .text('• ' + text, { indent: 20, width: 455 });
                    });
                    doc.moveDown(0.8);
                    break;
                }

                case 'blockquote': {
                    const text = token.text.replace(/\*\*(.*?)\*\*/g, '$1');
                    doc.moveDown(0.5);
                    const startY = doc.y;
                    doc.fontSize(11).font('Helvetica-Oblique').fillColor(GRAY)
                        .text(text, 75, doc.y, { width: 460, align: 'left' });
                    const endY = doc.y;

                    doc.moveTo(65, startY).lineTo(65, endY).lineWidth(2).stroke(ACCENT);
                    doc.moveDown(1);
                    doc.font('Helvetica').fillColor(PRIMARY).x = 60; // Reset
                    break;
                }

                case 'table': {
                    // Basic Table Renderer (Simulated List for safety, or kept as is?)
                    // User said "remove tables", but we still have this renderer just in case.
                    // The templates don't use it, but keeping it robust is fine.

                    if (token.header.length === 0) break;

                    const headers = token.header.map((h: any) => h.text);
                    const rows = token.rows.map((r: any) => r.map((c: any) => c.text));
                    const colWidth = 475 / headers.length;
                    const startX = 60;

                    doc.rect(startX, doc.y, 475, 20).fill('#F3F4F6');
                    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10);

                    headers.forEach((header: string, i: number) => {
                        const text = header.replace(/\*\*(.*?)\*\*/g, '$1');
                        doc.text(text, startX + (i * colWidth) + 5, doc.y - 14, { width: colWidth - 10, align: 'left' });
                    });
                    doc.moveDown(0.5);

                    doc.font('Helvetica').fontSize(10).fillColor(PRIMARY);
                    rows.forEach((row: string[], i: number) => {
                        const rowY = doc.y;
                        if (i % 2 !== 0) {
                            doc.rect(startX, rowY, 475, 20).fill('#F9FAFB');
                            doc.fillColor(PRIMARY);
                        }

                        row.forEach((cell: string, j: number) => {
                            const cleanText = cell.replace(/\*\*(.*?)\*\*/g, '$1');
                            doc.text(cleanText, startX + (j * colWidth) + 5, rowY + 5, { width: colWidth - 10, align: 'left' });
                        });
                        doc.y = rowY + 25;
                        doc.moveTo(startX, doc.y - 5).lineTo(535, doc.y - 5).lineWidth(0.5).stroke(BORDER);
                    });
                    doc.moveDown(1);
                    break;
                }

                case 'hr': {
                    doc.moveDown(1);
                    doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).stroke(BORDER);
                    doc.moveDown(1);
                    break;
                }
            }
        });

        // === FOOTER ===
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.moveTo(60, 780).lineTo(535, 780).lineWidth(1).stroke(BORDER);
            doc.fontSize(8).font('Courier').fillColor(LIGHT_GRAY)
                .text('Generated by LexOculus EU AI Act Compliance Platform', 60, 790, { width: 475, align: 'center' })
                .text(new Date().toISOString(), 60, 802, { width: 475, align: 'center' })
                .text(`Page ${i + 1} of ${pageCount}`, 60, 790, { width: 475, align: 'right' }); // Right aligned page num
        }
    });
}
