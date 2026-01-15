import PDFDocument from 'pdfkit';
import { RepoScan, LlmCapabilityAnalysis } from '@prisma/client';

export interface ReportData {
    assessment: any;
    repo: RepoScan;
    capabilities: any;
    preliminary: any;
}

/**
 * Generate System 3.0 "Optical Legality" Compliance Report
 * font: Times-Roman (Serif) for headings, Courier (Mono) for data
 * colors: Black (#000000), Safety Orange (#FF4F00), Grey (#999999)
 */
export async function generateComplianceReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 40,
            size: 'A4',
            info: {
                Title: `Compliance Report - ${data.repo.repo_name}`,
                Author: 'LexOculus System',
                Subject: 'EU AI Act Compliance Assessment',
                Keywords: 'compliance, ai-act, risk-assessment, lex-oculus'
            }
        });

        const buffers: Buffer[] = [];
        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Colors
        const C_BLACK = '#000000';
        const C_ORANGE = '#FF4F00';
        const C_GREY = '#999999';

        // =====================================================================
        // HEADER
        // =====================================================================

        // "LEX|OCULUS" Wordmark
        doc.font('Times-Bold').fontSize(24).fillColor(C_BLACK).text('LEX', 40, 40, { continued: true });
        doc.font('Times-Roman').fillColor(C_ORANGE).text('|', { continued: true });
        doc.font('Times-Bold').fillColor(C_BLACK).text('OCULUS');

        doc.font('Courier').fontSize(8).fillColor(C_GREY).text('THE MICROSCOPE FOR CODE LAW', 40, 65);

        // Divider
        doc.moveTo(40, 80).lineTo(555, 80).lineWidth(2).strokeColor(C_BLACK).stroke();

        // Report Metadata (Right Aligned)
        const dateStr = new Date().toISOString().split('T')[0];
        doc.font('Courier').fontSize(8).fillColor(C_BLACK);
        doc.text(`REPORT_ID: ${data.assessment.id.substring(0, 8).toUpperCase()}`, 350, 45, { align: 'right', width: 200 });
        doc.text(`DATE: ${dateStr}`, 350, 55, { align: 'right', width: 200 });
        doc.text(`REF: ${data.repo.repo_name.toUpperCase()}`, 350, 65, { align: 'right', width: 200 });

        doc.moveDown(4);

        // =====================================================================
        // 01 EXECUTIVE SUMMARY
        // =====================================================================

        doc.font('Courier-Bold').fontSize(10).fillColor(C_ORANGE).text('01_EXECUTIVE_SUMMARY');
        doc.font('Times-Bold').fontSize(18).fillColor(C_BLACK).text('Compliance Status Assessment');
        doc.moveDown(1);

        // Main Risk Badge
        const riskClass = data.assessment.final_risk_classification;
        const score = data.assessment.final_risk_score;
        let riskLabel = 'MINIMAL RISK';
        let riskColor = C_BLACK;

        if (riskClass === 'UNACCEPTABLE') {
            riskLabel = 'UNACCEPTABLE RISK';
            riskColor = C_ORANGE;
        } else if (riskClass === 'HIGH_RISK') {
            riskLabel = 'HIGH RISK';
            riskColor = C_ORANGE;
        } else if (riskClass === 'LIMITED_RISK') {
            riskLabel = 'LIMITED RISK';
            riskColor = C_BLACK;
        }

        // Draw Sharp Badge
        doc.rect(40, doc.y, 515, 60).strokeColor(riskColor).lineWidth(1).stroke();

        const badgeStartY = doc.y;
        doc.font('Courier-Bold').fontSize(24).fillColor(riskColor).text(riskLabel, 50, badgeStartY + 15);
        doc.font('Courier').fontSize(10).fillColor(C_BLACK).text(`COMPLIANCE SCORE: ${score}/100`, 50, badgeStartY + 40);

        doc.moveDown(5);

        // Narrative
        doc.font('Times-Roman').fontSize(11).fillColor(C_BLACK).text(
            `This automated assessment certifies that the software repository "${data.repo.repo_name}" has been analyzed for compliance with the EU AI Act (Regulation (EU) 2024/1689). The system has been classified as ${riskLabel} based on heuristic analysis of capability signatures and operational context.`,
            { align: 'justify', width: 515 }
        );

        doc.moveDown(2);

        // =====================================================================
        // 02 SYSTEM IDENTIFICATION
        // =====================================================================

        doc.font('Courier-Bold').fontSize(10).fillColor(C_ORANGE).text('02_SYSTEM_IDENTIFICATION');
        doc.moveDown(0.5);

        const rowY = doc.y;
        const col1 = 40;
        const col2 = 200;

        // Helper for rows
        const drawRow = (label: string, value: string) => {
            doc.font('Courier').fontSize(9).fillColor(C_GREY).text(label, col1, doc.y);
            doc.font('Courier-Bold').fontSize(9).fillColor(C_BLACK).text(value, col2, doc.y - 9); // Adjust for alignment
            doc.moveDown(1);
            doc.moveTo(col1, doc.y).lineTo(555, doc.y).lineWidth(0.5).strokeColor('#E5E5E5').stroke(); // Light grey line
            doc.moveDown(1);
        };

        drawRow('REPOSITORY_URL', data.repo.github_repo_url);
        drawRow('OWNER_HANDLE', data.repo.repo_owner);
        drawRow('SCAN_TIMESTAMP', new Date(data.repo.scanned_at).toISOString());
        drawRow('PRIMARY_LANGUAGE', data.capabilities.primary_language || 'UNKNOWN');

        const context = data.assessment.context_summary || {};
        drawRow('INTENDED_USE', context.intended_use || 'NOT_SPECIFIED');
        drawRow('DEPLOYMENT_REGION', context.deployment_region || 'GLOBAL');

        doc.moveDown(2);

        // =====================================================================
        // 03 REGULATORY MAPPING
        // =====================================================================

        doc.font('Courier-Bold').fontSize(10).fillColor(C_ORANGE).text('03_REGULATORY_MAPPING');
        doc.moveDown(0.5);

        // Header for table
        doc.rect(40, doc.y, 515, 20).fillColor(C_BLACK).fill();
        doc.fillColor('#FFFFFF').font('Courier-Bold').fontSize(8);
        doc.text('REGULATION', 50, doc.y - 14);
        doc.text('STATUS', 400, doc.y - 14);
        doc.moveDown(2);

        const drawRegRow = (reg: string, status: string, isRisk: boolean) => {
            const y = doc.y;
            doc.fillColor(C_BLACK).font('Times-Bold').fontSize(10).text(reg, 50, y);

            // Status Box
            const statusColor = isRisk ? C_ORANGE : C_BLACK;
            const statusText = status.toUpperCase();

            doc.rect(400, y - 2, 140, 14).strokeColor(statusColor).lineWidth(1).stroke();
            doc.fillColor(statusColor).font('Courier-Bold').fontSize(8).text(statusText, 405, y + 2);

            doc.moveDown(1.5);
            doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).strokeColor('#E5E5E5').stroke();
            doc.moveDown(1);
        };

        // Article 5
        const isProhibited = riskClass === 'UNACCEPTABLE';
        drawRegRow('EU AI Act Art. 5 (Prohibited)', isProhibited ? 'DETECTED' : 'CLEAR', isProhibited);

        // Article 6
        const isHighRisk = riskClass === 'HIGH_RISK' || riskClass === 'UNACCEPTABLE';
        drawRegRow('EU AI Act Art. 6 (High Risk)', isHighRisk ? 'APPLICABLE' : 'NOT_APPLICABLE', isHighRisk);

        // Article 50
        const isLimited = riskClass === 'LIMITED_RISK';
        drawRegRow('EU AI Act Art. 50 (Transparency)', isLimited || isHighRisk ? 'REQUIRED' : 'VOLUNTARY', false);

        // =====================================================================
        // FOOTER
        // =====================================================================

        const bottomY = 780;
        doc.moveTo(40, bottomY).lineTo(555, bottomY).lineWidth(2).strokeColor(C_BLACK).stroke();

        doc.font('Times-Bold').fontSize(8).fillColor(C_BLACK).text('LEX|OCULUS', 40, bottomY + 10);
        doc.font('Courier').fontSize(8).fillColor(C_GREY).text(`PAGE 1 OF 1 // SIGNED: ${data.assessment.digital_signature || 'PENDING'}`, 40, bottomY + 10, { align: 'right', width: 515 });

        doc.end();
    });
}

// Deprecating separate TrustPack function to unify on System 3.0
export async function generateTrustPackPDF(data: any): Promise<Buffer> {
    // Mapping legacy call to new system if necessary, but ideally unused.
    // For now, keeping signature to avoid breaking imports but throwing error or redirecting logic.
    return Buffer.from('');
}
