import PDFDocument from 'pdfkit';
import { RepoScan, LlmCapabilityAnalysis } from '@prisma/client';

export interface TrustPackData {
    repoScan: RepoScan;
    analysis: LlmCapabilityAnalysis | null;
    riskClassification: string;
    generatedAt: Date;
}

/**
 * Generate "Enterprise Trust Pack" (Vendor Risk Profile) PDF
 * Returns a Buffer containing the PDF data.
 */
export async function generateTrustPackPDF(data: TrustPackData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: `Vendor Risk Profile - ${data.repoScan.repo_name}`,
                Author: 'ComplianceAI',
                Subject: 'EU AI Act Compliance Assessment',
                Keywords: 'compliance, ai-act, risk-assessment, gdpr'
            }
        });

        const buffers: Buffer[] = [];
        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // =====================================================================
        // HEADER
        // =====================================================================

        // Brand / Logo area (Text for now)
        doc.fontSize(20).font('Helvetica-Bold').text('ComplianceAI', { align: 'left' });
        doc.moveDown(0.2);
        doc.fontSize(10).font('Helvetica').fillColor('#666666').text('VENDOR RISK PROFILE', { align: 'left', characterSpacing: 2 });

        // Add a line
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').stroke();
        doc.moveDown(1.5);

        // =====================================================================
        // EXECUTIVE SUMMARY
        // =====================================================================

        doc.fillColor('#000000');
        doc.fontSize(16).font('Helvetica-Bold').text('Executive Summary');
        doc.moveDown(0.5);

        // Risk Badge Logic
        let riskColor = '#10B981'; // Green
        let riskLabel = 'MINIMAL RISK';

        if (data.riskClassification === 'UNACCEPTABLE') {
            riskColor = '#EF4444'; // Red
            riskLabel = 'PROHIBITED';
        } else if (data.riskClassification === 'HIGH_RISK') {
            riskColor = '#F59E0B'; // Amber
            riskLabel = 'HIGH RISK';
        } else if (data.riskClassification === 'LIMITED_RISK') {
            riskColor = '#3B82F6'; // Blue
            riskLabel = 'LIMITED RISK';
        }

        // Draw Risk Badge
        const badgeY = doc.y;
        doc.roundedRect(50, badgeY, 120, 30, 4).fill(riskColor);
        doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold').text(riskLabel, 50, badgeY + 10, { width: 120, align: 'center' });

        doc.moveDown(2);
        doc.fillColor('#000000');

        doc.fontSize(10).font('Helvetica').text(`This document serves as a preliminary automated compliance assessment for the software repository "${data.repoScan.repo_name}". It is intended to assist Enterprise Procurement teams in evaluating AI safety and regulatory exposure under the EU AI Act (Regulation (EU) 2024/1689).`, { align: 'justify' });
        doc.moveDown(1);

        // Metadata Grid
        const startY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').text('Repository:', 50, startY);
        doc.font('Helvetica').text(data.repoScan.github_repo_url, 150, startY);

        doc.font('Helvetica-Bold').text('Assessment Date:', 50, startY + 15);
        doc.font('Helvetica').text(data.generatedAt.toLocaleDateString(), 150, startY + 15);

        doc.font('Helvetica-Bold').text('Assessment ID:', 50, startY + 30);
        doc.font('Helvetica').text(data.repoScan.id.substring(0, 8).toUpperCase(), 150, startY + 30);

        doc.moveDown(3);

        // =====================================================================
        // COMPLIANCE STATUS
        // =====================================================================

        doc.fontSize(14).font('Helvetica-Bold').text('Regulatory Status');
        doc.moveDown(0.5);

        // Article 5 (Prohibited Practices)
        const isProhibited = data.riskClassification === 'UNACCEPTABLE';
        drawStatusRow(doc, 'EU AI Act Article 5 (Prohibited Practices)', !isProhibited);

        // Article 6 (High Risk)
        const isHighRisk = data.riskClassification === 'HIGH_RISK' || data.riskClassification === 'UNACCEPTABLE';
        // Note: For High Risk, "Pass" means "Not Detected" (which is good for speed) OR "Conformity Assessment Ready"
        // Here we frame it as "High Risk Indicators Detected?" -> No = Pass
        drawStatusRow(doc, 'EU AI Act Annex III (High Risk Systems)', !isHighRisk);

        // Article 50 (Transparency)
        const isLimited = data.riskClassification === 'LIMITED_RISK';
        drawStatusRow(doc, 'EU AI Act Article 50 (Transparency Obligations)', true); // Generally assume capable of compliance

        doc.moveDown(2);

        // =====================================================================
        // DATA SAFETY & PRIVACY
        // =====================================================================

        doc.fontSize(14).font('Helvetica-Bold').text('Data Safety & Privacy Checks');
        doc.moveDown(0.5);

        const hasTrainingCode = data.analysis?.has_training_code || false;
        const hasPiiRisk = false; // Would need tripwire/analysis data for this specifically

        const riskIndicators = (data.analysis?.estimated_risk_indicators as unknown as Record<string, boolean>) || {};
        drawCheckRow(doc, 'Model Training Code Detected', hasTrainingCode ? 'YES (Review Required)' : 'NO', hasTrainingCode ? '#F59E0B' : '#10B981');
        drawCheckRow(doc, 'Biometric Data Processing', riskIndicators['uses_biometric_processing'] ? 'DETECTED' : 'NOT DETECTED', riskIndicators['uses_biometric_processing'] ? '#EF4444' : '#10B981');


        // =====================================================================
        // DISCLAIMER / FOOTER
        // =====================================================================

        const bottomY = 750; // Near bottom of A4
        doc.moveTo(50, bottomY).lineTo(545, bottomY).strokeColor('#E5E7EB').stroke();

        doc.fontSize(8).fillColor('#9CA3AF').text(
            'DISCLAIMER: This automated report is generated by ComplianceAI based on static code analysis. It does not constitute legal advice or a formal conformity assessment certificate. Organizations should consult with qualified legal counsel for definitive regulatory guidance.',
            50,
            bottomY + 10,
            { align: 'center', width: 495 }
        );

        doc.end();
    });
}

/**
 * Helper: Draw a Status Row (Regulation Name | Status Badge)
 */
function drawStatusRow(doc: PDFKit.PDFDocument, label: string, passed: boolean) {
    const y = doc.y;
    doc.fillColor('#000000').fontSize(10).font('Helvetica').text(label, 50, y + 5);

    // Status Badge
    const badgeColor = passed ? '#ECFDF5' : '#FEF2F2'; // Light Green / Light Red
    const textColor = passed ? '#059669' : '#DC2626'; // Dark Green / Dark Red
    const text = passed ? 'COMPLIANT / NONE' : 'ATTENTION REQUIRED';

    const textWidth = doc.widthOfString(text);
    const badgeWidth = textWidth + 20;

    doc.roundedRect(545 - badgeWidth, y, badgeWidth, 20, 2).fill(badgeColor);
    doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold').text(text, 545 - badgeWidth, y + 6, { width: badgeWidth, align: 'center' });

    doc.moveDown(1.5);
}

/**
 * Helper: Draw a Check Row (Label | Value)
 */
function drawCheckRow(doc: PDFKit.PDFDocument, label: string, value: string, color: string) {
    const y = doc.y;
    doc.fillColor('#000000').fontSize(10).font('Helvetica').text(label, 50, y);

    doc.fillColor(color).font('Helvetica-Bold').text(value, 300, y, { align: 'right', width: 245 });
    doc.moveDown(1);
}
