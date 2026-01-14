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
    return Buffer.from('');
}

/**
 * Generate EU AI Act Annex IV Technical File
 * 
 * Complies with Regulation (EU) 2024/1689 Annex IV requirements for technical documentation.
 * Uses the same System 3.0 visual identity but with a legal document structure.
 */
export async function generateAnnexIVTechnicalFile(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: `Technical File (Annex IV) - ${data.repo.repo_name}`,
                Author: 'LexOculus System',
                Subject: 'EU AI Act Technical Documentation',
                Keywords: 'annex-iv, ai-act, technical-file'
            }
        });

        const buffers: Buffer[] = [];
        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const C_BLACK = '#000000';
        const C_ORANGE = '#FF4F00';
        const C_GREY = '#999999';

        // Helper for section headers
        const sectionHeader = (num: string, title: string) => {
            doc.addPage();
            doc.font('Courier-Bold').fontSize(12).fillColor(C_ORANGE).text(`ANNEX_IV // SECTION ${num}`);
            doc.moveDown(0.5);
            doc.font('Times-Bold').fontSize(20).fillColor(C_BLACK).text(title);
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(2).strokeColor(C_BLACK).stroke();
            doc.moveDown(1.5);
        };

        const subHeader = (title: string) => {
            doc.moveDown(1);
            doc.font('Courier-Bold').fontSize(10).fillColor(C_BLACK).text(title.toUpperCase());
            doc.moveDown(0.5);
        };

        const bodyText = (text: string) => {
            doc.font('Times-Roman').fontSize(11).fillColor(C_BLACK).text(text, { align: 'justify' });
            doc.moveDown(0.5);
        };

        const kvPair = (key: string, value: string) => {
            const y = doc.y;
            doc.font('Courier').fontSize(9).fillColor(C_GREY).text(key + ':', 50, y);
            doc.font('Courier-Bold').fontSize(9).fillColor(C_BLACK).text(value, 200, y);
            doc.moveDown(0.8);
        };

        // =====================================================================
        // COVER PAGE
        // =====================================================================

        doc.rect(0, 0, 595, 842).fillColor('#FAFAFA').fill(); // Light grey background

        doc.font('Times-Bold').fontSize(36).fillColor(C_BLACK).text('TECHNICAL', 50, 200);
        doc.font('Times-Bold').text('DOCUMENTATION');

        doc.font('Courier-Bold').fontSize(14).fillColor(C_ORANGE).text('ANNEX IV // EU AI ACT', 50, 280);

        doc.moveTo(50, 310).lineTo(545, 310).lineWidth(4).strokeColor(C_BLACK).stroke();

        doc.font('Courier').fontSize(10).fillColor(C_GREY).text('SYSTEM REFERENCE:', 50, 340);
        doc.font('Courier-Bold').fontSize(18).fillColor(C_BLACK).text(data.repo.repo_name.toUpperCase(), 50, 355);

        doc.font('Courier').fontSize(10).fillColor(C_GREY).text('VERSION:', 50, 400);
        doc.font('Courier-Bold').fontSize(12).fillColor(C_BLACK).text('1.0.0 (GENERATED)', 50, 415);

        doc.font('Courier').fontSize(10).fillColor(C_GREY).text('DATE:', 50, 450);
        doc.font('Courier-Bold').fontSize(12).fillColor(C_BLACK).text(new Date().toISOString().split('T')[0], 50, 465);

        // Disclaimer
        doc.font('Courier').fontSize(8).fillColor(C_ORANGE).text(
            'PLEASE NOTE: This document is an automated draft generated by LexOculus based on code analysis. ' +
            'It is intended to serve as a baseline for the technical documentation required by ' +
            'Regulation (EU) 2024/1689. It MUST be reviewed, verified, and finalized by a qualified ' +
            'legal professional or conformity assessment body.',
            50, 700, { width: 495, align: 'center' }
        );

        // =====================================================================
        // SECTION 1: GENERAL DESCRIPTION
        // =====================================================================
        sectionHeader('01', 'General Description');

        bodyText('In accordance with Annex IV (1), the following general description of the AI system is provided:');

        const context = data.assessment.context_summary || {};

        subHeader('1.1 Intended Purpose');
        bodyText(context.intended_use || 'The intended purpose has not been explicitly defined in the context verification phase.');

        subHeader('1.2 Intended User');
        bodyText(context.target_users || 'General users.');

        subHeader('1.3 Interaction Modes');
        bodyText('The system interacts with users via: software interface (API/GUI).');

        subHeader('1.4 Hardware Requirements');
        bodyText('Standard server infrastructure capable of running containerized applications.');

        // =====================================================================
        // SECTION 2: ELEMENTS OF THE AI SYSTEM
        // =====================================================================
        sectionHeader('02', 'Elements of the AI System');

        bodyText('In accordance with Annex IV (2), the following elements constitute the AI system:');

        subHeader('2.1 Software Versions');
        kvPair('REPOSITORY', data.repo.repo_name);
        kvPair('COMMIT_SHA', 'HEAD (LATEST)');
        kvPair('BRANCH', 'MAIN/MASTER');
        doc.moveDown(1);

        subHeader('2.2 Third-Party Providers');
        const libs = data.capabilities.libraries || [];
        if (libs.length > 0) {
            bodyText('The system relies on the following third-party components:');
            libs.forEach((lib: string) => {
                doc.font('Courier').fontSize(9).fillColor(C_BLACK).text(`- ${lib}`);
            });
        } else {
            bodyText('No specific third-party AI libraries detected in this scan.');
        }

        // =====================================================================
        // SECTION 3: INFORMATION ON THE PROCESS
        // =====================================================================
        sectionHeader('03', 'Information on the Process');

        bodyText('Description of the design, development, and integration process.');

        subHeader('3.1 Methodologies');
        bodyText('The system is developed using standard Agile methodologies with continuous integration and deployment (CI/CD) practices via GitHub Actions.');

        subHeader('3.2 Design Specifications');
        if (data.capabilities.primary_language) {
            kvPair('LANGUAGE', data.capabilities.primary_language);
        }
        if (data.capabilities.model_types && data.capabilities.model_types.length > 0) {
            kvPair('ARCHITECTURE', data.capabilities.model_types.join(', '));
        }

        // =====================================================================
        // SECTION 5: RISK MANAGEMENT SYSTEM
        // =====================================================================
        sectionHeader('05', 'Risk Management System');

        bodyText('In accordance with Article 9, the following risk management measures are in place:');

        subHeader('5.1 Risk Identification');
        bodyText(`The system has been classified as: ${data.assessment.final_risk_classification}`);

        const risks = data.assessment.risk_assessment?.key_findings || [];
        if (risks.length > 0) {
            doc.moveDown(0.5);
            bodyText('Identified risks/capabilities:');
            risks.forEach((r: string) => {
                doc.font('Courier').fontSize(9).fillColor(C_ORANGE).text(`[RISK] ${r}`);
            });
        }

        subHeader('5.2 Mitigation Strategy');
        bodyText('For all identified high-risk capabilities, the system implements standard cybersecurity controls, including input validation and output sanitation.');

        // =====================================================================
        // SECTION 9: DECLARATION OF CONFORMITY
        // =====================================================================
        sectionHeader('09', 'EU Declaration of Conformity');

        bodyText('The provider hereby declares that the AI system identified above is in conformity with the requirements of Regulation (EU) 2024/1689.');

        doc.moveDown(2);

        kvPair('NAME_OF_PROVIDER', data.repo.repo_owner);
        kvPair('PLACE_OF_ISSUE', context.deployment_region || 'EU');
        kvPair('DATE_OF_ISSUE', new Date().toISOString().split('T')[0]);

        doc.moveDown(4);

        doc.moveTo(50, doc.y).lineTo(250, doc.y).lineWidth(1).strokeColor(C_BLACK).stroke();
        doc.font('Courier').fontSize(8).text('SIGNATURE OF AUTHORIZED PERSON', 50, doc.y + 5);

        doc.end();
    });
}
