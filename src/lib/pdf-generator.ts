/**
 * PDF Report Generator
 * 
 * Generates professional EU AI Act compliance reports using PDFKit
 * 20-page structure: Title, Executive Summary, System Overview, Risk Assessment,
 * Evidence, Roadmap, Regulatory Analysis, Appendices, Certificate
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

// Types
interface RepoScan {
    id: string;
    repo_name: string;
    repo_owner: string;
    repo_url: string;
    primary_language: string | null;
    license: string | null;
    stars: number | null;
    forks: number | null;
    last_updated: Date | null;
}

interface LlmCapabilityAnalysis {
    id: string;
    is_ai_system: boolean;
    confidence_score: number;
    detected_capabilities: unknown;
    risk_indicators: unknown;
    llm_components: unknown;
}

interface RiskAssessment {
    id: string;
    risk_classification: string;
    risk_score: number;
    risk_narrative: string | null;
    matched_annex_iii_articles: unknown;
    key_findings: unknown;
}

interface FinalRiskAssessment {
    id: string;
    final_risk_classification: string;
    final_risk_score: number;
    final_narrative: string | null;
    context_verified: boolean;
    context_summary: unknown;
    evidence_items: unknown;
    final_matched_articles: unknown;
    compliance_readiness: unknown;
    approved_for_report: boolean;
    requires_manual_review: boolean;
    verified_at: Date;
}

export interface ReportData {
    assessment: FinalRiskAssessment;
    repo: RepoScan;
    capabilities: LlmCapabilityAnalysis;
    preliminary: RiskAssessment;
}

// Colors based on risk level
const RISK_COLORS: Record<string, string> = {
    UNACCEPTABLE: '#ef4444',
    HIGH_RISK: '#f97316',
    LIMITED_RISK: '#eab308',
    MINIMAL_RISK: '#22c55e',
};

/**
 * Generate a complete compliance report PDF
 */
export async function generateComplianceReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                info: {
                    Title: `EU AI Act Compliance Report - ${data.repo.repo_name}`,
                    Author: 'ComplianceAI',
                    Subject: 'AI System Compliance Assessment',
                    Creator: 'ComplianceAI Report Generator',
                },
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Build report sections
            buildTitlePage(doc, data);
            doc.addPage();
            buildExecutiveSummary(doc, data);
            doc.addPage();
            buildSystemOverview(doc, data);
            doc.addPage();
            buildRiskAssessment(doc, data);
            doc.addPage();
            buildEvidenceSection(doc, data);
            doc.addPage();
            buildComplianceRoadmap(doc, data);
            doc.addPage();
            buildRegulatoryAnalysis(doc, data);
            doc.addPage();
            buildAppendices(doc, data);
            doc.addPage();
            buildCertificate(doc, data);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// ============================================
// SECTION BUILDERS
// ============================================

function buildTitlePage(doc: PDFKit.PDFDocument, data: ReportData) {
    const riskColor = RISK_COLORS[data.assessment.final_risk_classification] || '#6b7280';

    // Header decoration
    doc.rect(0, 0, doc.page.width, 150)
        .fill('#18181b');

    doc.fillColor('#ffffff')
        .fontSize(12)
        .text('ComplianceAI', 50, 30);

    doc.fontSize(10)
        .fillColor('#a1a1aa')
        .text('EU AI Act Compliance Assessment', 50, 50);

    // Main title
    doc.fillColor('#18181b')
        .fontSize(28)
        .text('EU AI ACT', 50, 200, { align: 'center' })
        .fontSize(32)
        .text('COMPLIANCE ASSESSMENT REPORT', 50, 240, { align: 'center' });

    // System info box
    doc.rect(100, 320, doc.page.width - 200, 120)
        .stroke('#e4e4e7');

    doc.fontSize(14)
        .fillColor('#3f3f46')
        .text('System:', 120, 340)
        .fillColor('#18181b')
        .fontSize(18)
        .text(data.repo.repo_name, 120, 360);

    doc.fontSize(12)
        .fillColor('#71717a')
        .text(`Repository: ${data.repo.repo_owner}/${data.repo.repo_name}`, 120, 390)
        .text(`Assessment Date: ${new Date().toLocaleDateString()}`, 120, 410);

    // Risk classification badge
    doc.rect(100, 480, doc.page.width - 200, 80)
        .fill(riskColor);

    doc.fillColor('#ffffff')
        .fontSize(14)
        .text('RISK CLASSIFICATION', 0, 500, { align: 'center' })
        .fontSize(24)
        .text(data.assessment.final_risk_classification.replace('_', ' '), 0, 520, { align: 'center' });

    // Score
    doc.fillColor('#18181b')
        .fontSize(14)
        .text(`Risk Score: ${data.assessment.final_risk_score}/100`, 0, 600, { align: 'center' });

    // Footer
    doc.fontSize(10)
        .fillColor('#a1a1aa')
        .text('Generated by ComplianceAI', 50, doc.page.height - 50)
        .text('This report is for informational purposes only.', 50, doc.page.height - 35);
}

function buildExecutiveSummary(doc: PDFKit.PDFDocument, data: ReportData) {
    addSectionHeader(doc, 'Executive Summary', 1);

    const contextSummary = data.assessment.context_summary as Record<string, unknown> || {};
    const complianceReadiness = data.assessment.compliance_readiness as Record<string, unknown> || {};

    // Risk Assessment Result
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('1. RISK ASSESSMENT RESULT', 50, 120);

    doc.fontSize(11)
        .fillColor('#3f3f46')
        .text(`Classification: ${data.assessment.final_risk_classification.replace('_', ' ')}`, 70, 145)
        .text(`Risk Score: ${data.assessment.final_risk_score}/100`, 70, 165)
        .text(`Regulatory Applicability: EU AI Act`, 70, 185);

    // Key Findings
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('2. KEY FINDINGS', 50, 220);

    const findings = [
        contextSummary.intended_use ? `[OK] Intended Use: ${safeString(contextSummary.intended_use)}` : null,
        contextSummary.target_users ? `[OK] Target Users: ${safeString(contextSummary.target_users)}` : null,
        contextSummary.has_human_oversight ? '[OK] Human oversight in place' : '[X] Human oversight missing',
        contextSummary.has_testing_procedure ? '[OK] Testing procedures documented' : '[X] Testing procedures needed',
        contextSummary.has_transparency_statement ? '[OK] Transparency measures implemented' : '[X] Transparency measures pending',
    ].filter(Boolean);

    let yPos = 245;
    for (const finding of findings) {
        doc.fontSize(11)
            .fillColor('#3f3f46')
            .text(finding as string, 70, yPos);
        yPos += 20;
    }

    // Compliance Status
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('3. OVERALL COMPLIANCE STATUS', 50, yPos + 20);

    const overallReadiness = complianceReadiness.overall_readiness as string || 'NEEDS_REVIEW';
    doc.fontSize(11)
        .fillColor('#3f3f46')
        .text(`Current Status: ${overallReadiness.replace('_', ' ')}`, 70, yPos + 45);

    // Action required
    const approved = data.assessment.approved_for_report;
    doc.text(approved ? 'Action Required: NO - Proceed to implementation' : 'Action Required: YES - Review findings', 70, yPos + 65);

    // Narrative
    if (data.assessment.final_narrative) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('4. ASSESSMENT NARRATIVE', 50, yPos + 100);

        doc.fontSize(10)
            .fillColor('#52525b')
            .text(cleanText(data.assessment.final_narrative), 70, yPos + 125, {
                width: doc.page.width - 140,
                align: 'left',
            });
    }
}

function buildSystemOverview(doc: PDFKit.PDFDocument, data: ReportData) {
    addSectionHeader(doc, 'System Overview', 2);

    // System Identification
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('1. SYSTEM IDENTIFICATION', 50, 120);

    const sysInfo = [
        ['System Name', data.repo.repo_name],
        ['Repository URL', data.repo.repo_url],
        ['Primary Language', data.repo.primary_language || 'Not specified'],
        ['License', data.repo.license || 'Not specified'],
        ['Stars', data.repo.stars?.toString() || '0'],
        ['Last Updated', data.repo.last_updated?.toLocaleDateString() || 'Unknown'],
    ];

    let yPos = 145;
    for (const [label, value] of sysInfo) {
        doc.fontSize(10)
            .fillColor('#71717a')
            .text(label + ':', 70, yPos)
            .fillColor('#18181b')
            .text(value, 200, yPos);
        yPos += 20;
    }

    // AI System Classification
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('2. AI SYSTEM CLASSIFICATION', 50, yPos + 20);

    doc.fontSize(10)
        .fillColor('#3f3f46')
        .text(`Is AI System: ${data.capabilities.is_ai_system ? 'Yes' : 'No'}`, 70, yPos + 45)
        .text(`Confidence Score: ${formatConfidence(data.capabilities.confidence_score)}`, 70, yPos + 65);

    // Detected Capabilities
    const capabilities = data.capabilities.detected_capabilities as string[] || [];
    if (capabilities.length > 0) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('3. DETECTED AI CAPABILITIES', 50, yPos + 100);

        let capY = yPos + 125;
        for (const cap of capabilities.slice(0, 10)) {
            doc.fontSize(10)
                .fillColor('#3f3f46')
                .text(`• ${cap}`, 70, capY);
            capY += 18;
        }
    }

    // Context Summary
    const contextSummary = data.assessment.context_summary as Record<string, string> || {};
    if (contextSummary.deployment_region) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('4. DEPLOYMENT CONTEXT', 50, 500);

        doc.fontSize(10)
            .fillColor('#3f3f46')
            .text(`Deployment Region: ${contextSummary.deployment_region}`, 70, 525)
            .text(`Intended Use: ${contextSummary.intended_use || 'Not specified'}`, 70, 545)
            .text(`Target Users: ${contextSummary.target_users || 'Not specified'}`, 70, 565);
    }
}

function buildRiskAssessment(doc: PDFKit.PDFDocument, data: ReportData) {
    addSectionHeader(doc, 'Risk Assessment Results', 3);

    const riskColor = RISK_COLORS[data.assessment.final_risk_classification] || '#6b7280';

    // Classification Box
    doc.rect(50, 120, doc.page.width - 100, 80)
        .fill(riskColor);

    doc.fillColor('#ffffff')
        .fontSize(12)
        .text('FINAL RISK CLASSIFICATION', 0, 135, { align: 'center' })
        .fontSize(24)
        .text(data.assessment.final_risk_classification.replace('_', ' '), 0, 155, { align: 'center' });

    // Risk Tier Explanation
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('1. RISK TIER BREAKDOWN', 50, 230);

    const tiers = [
        { name: 'UNACCEPTABLE', desc: 'Banned - Prohibited AI practices', color: RISK_COLORS.UNACCEPTABLE },
        { name: 'HIGH RISK', desc: 'Strict requirements - Conformity assessment required', color: RISK_COLORS.HIGH_RISK },
        { name: 'LIMITED RISK', desc: 'Transparency obligations - User notification required', color: RISK_COLORS.LIMITED_RISK },
        { name: 'MINIMAL RISK', desc: 'Basic requirements - Best practices recommended', color: RISK_COLORS.MINIMAL_RISK },
    ];

    let tierY = 255;
    for (const tier of tiers) {
        const isCurrentTier = tier.name === data.assessment.final_risk_classification.replace('_', ' ');
        doc.rect(70, tierY, 10, 10).fill(tier.color);
        doc.fontSize(10)
            .fillColor(isCurrentTier ? '#18181b' : '#71717a')
            .text(`${tier.name}: ${tier.desc}${isCurrentTier ? ' << THIS SYSTEM' : ''}`, 90, tierY);
        tierY += 25;
    }

    // Matched Articles
    const matchedArticles = data.assessment.final_matched_articles as Array<{ article: string; category: string }> || [];
    if (matchedArticles.length > 0) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('2. MATCHED ANNEX III ARTICLES', 50, tierY + 30);

        let artY = tierY + 55;
        for (const article of matchedArticles.slice(0, 5)) {
            doc.fontSize(10)
                .fillColor('#3f3f46')
                .text(`• ${article.article}: ${article.category}`, 70, artY);
            artY += 20;
        }
    }

    // Key Findings
    const keyFindings = data.preliminary.key_findings as string[] || [];
    if (keyFindings.length > 0) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('3. KEY FINDINGS', 50, 500);

        let findY = 525;
        for (const finding of keyFindings.slice(0, 8)) {
            doc.fontSize(10)
                .fillColor('#3f3f46')
                .text(`• ${finding}`, 70, findY, { width: doc.page.width - 140 });
            findY += 20;
        }
    }
}

function buildEvidenceSection(doc: PDFKit.PDFDocument, data: ReportData) {
    addSectionHeader(doc, 'Evidence & Verification', 4);

    // Verification Status
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('1. CONTEXT VERIFICATION STATUS', 50, 120);

    doc.fontSize(11)
        .fillColor(data.assessment.context_verified ? '#22c55e' : '#ef4444')
        .text(data.assessment.context_verified ? '[OK] Context Verified' : '[X] Context Not Verified', 70, 145);

    doc.fillColor('#3f3f46')
        .text(`Verified At: ${data.assessment.verified_at.toLocaleString()}`, 70, 165)
        .text(`Approved for Report: ${data.assessment.approved_for_report ? 'Yes' : 'No'}`, 70, 185);

    // Evidence Items
    const evidenceItems = data.assessment.evidence_items as Array<{
        category: string;
        description: string;
        supports_classification: string;
        confidence: string;
    }> || [];

    if (evidenceItems.length > 0) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('2. EVIDENCE ITEMS', 50, 220);

        let evY = 245;
        for (const item of evidenceItems.slice(0, 10)) {
            const isIssue = item.category.includes('ISSUE') || item.category.includes('CRITICAL');

            doc.fontSize(10)
                .fillColor(isIssue ? '#ef4444' : '#22c55e')
                .text(isIssue ? '[!]' : '[OK]', 70, evY);

            doc.fillColor('#18181b')
                .text(item.category, 90, evY);

            doc.fontSize(9)
                .fillColor('#52525b')
                .text(item.description, 90, evY + 15, { width: doc.page.width - 160 });

            doc.fillColor('#71717a')
                .text(`Confidence: ${item.confidence}`, 90, evY + 35);

            evY += 55;

            if (evY > 700) break; // Prevent overflow
        }
    }

    // Manual Review Notice
    if (data.assessment.requires_manual_review) {
        doc.rect(50, doc.page.height - 120, doc.page.width - 100, 50)
            .fill('#fef3c7');

        doc.fontSize(11)
            .fillColor('#92400e')
            .text('[!] MANUAL REVIEW REQUIRED', 70, doc.page.height - 105)
            .fontSize(9)
            .text('This assessment has been flagged for manual review before finalizing compliance status.', 70, doc.page.height - 85);
    }
}

function buildComplianceRoadmap(doc: PDFKit.PDFDocument, data: ReportData) {
    addSectionHeader(doc, 'Compliance Roadmap', 5);

    const complianceReadiness = data.assessment.compliance_readiness as {
        overall_readiness: string;
        requirements_met: string[];
        requirements_pending: string[];
        developer_action_items: string[];
    } || { overall_readiness: 'NEEDS_REVIEW', requirements_met: [], requirements_pending: [], developer_action_items: [] };

    // Current Status
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('1. CURRENT COMPLIANCE STATUS', 50, 120);

    const readinessColor = complianceReadiness.overall_readiness === 'FULL_COMPLIANCE' ? '#22c55e' :
        complianceReadiness.overall_readiness === 'PARTIAL_COMPLIANCE' ? '#eab308' : '#ef4444';

    doc.rect(70, 145, 200, 30)
        .fill(readinessColor);

    doc.fillColor('#ffffff')
        .fontSize(12)
        .text(complianceReadiness.overall_readiness.replace('_', ' '), 80, 153);

    // Requirements Met
    if (complianceReadiness.requirements_met?.length > 0) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('2. REQUIREMENTS MET', 50, 200);

        let metY = 225;
        for (const req of complianceReadiness.requirements_met) {
            doc.fontSize(10)
                .fillColor('#22c55e')
                .text('[OK]', 70, metY)
                .fillColor('#3f3f46')
                .text(req, 90, metY);
            metY += 20;
        }
    }

    // Requirements Pending
    if (complianceReadiness.requirements_pending?.length > 0) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('3. REQUIREMENTS PENDING', 50, 350);

        let pendY = 375;
        for (const req of complianceReadiness.requirements_pending) {
            doc.fontSize(10)
                .fillColor('#eab308')
                .text('[~]', 70, pendY)
                .fillColor('#3f3f46')
                .text(req, 90, pendY);
            pendY += 20;
        }
    }

    // Action Items
    if (complianceReadiness.developer_action_items?.length > 0) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('4. DEVELOPER ACTION ITEMS', 50, 500);

        let actY = 525;
        for (const item of complianceReadiness.developer_action_items) {
            doc.rect(70, actY, doc.page.width - 140, 25)
                .fill('#eff6ff')
                .stroke('#3b82f6');

            doc.fontSize(10)
                .fillColor('#1e40af')
                .text(`> ${item}`, 80, actY + 7, { width: doc.page.width - 160 });
            actY += 35;
        }
    }
}

function buildRegulatoryAnalysis(doc: PDFKit.PDFDocument, data: ReportData) {
    addSectionHeader(doc, 'Regulatory Analysis', 6);

    // EU AI Act Framework
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('1. EU AI ACT FRAMEWORK', 50, 120);

    doc.fontSize(10)
        .fillColor('#3f3f46')
        .text('The EU AI Act establishes a risk-based framework for regulating AI systems.', 70, 145, { width: doc.page.width - 140 })
        .text('This assessment evaluates the system against Annex III categories.', 70, 165);

    // Classification Rationale
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('2. CLASSIFICATION RATIONALE', 50, 200);

    const rationale = getRiskRationale(data.assessment.final_risk_classification);
    doc.fontSize(10)
        .fillColor('#3f3f46')
        .text(rationale, 70, 225, { width: doc.page.width - 140 });

    // Applicable Articles
    const matchedArticles = data.assessment.final_matched_articles as Array<{
        article: string;
        category: string;
        requirements: string[];
    }> || [];

    if (matchedArticles.length > 0) {
        doc.fontSize(14)
            .fillColor('#18181b')
            .text('3. APPLICABLE ARTICLES', 50, 320);

        let artY = 345;
        for (const article of matchedArticles.slice(0, 3)) {
            doc.fontSize(11)
                .fillColor('#18181b')
                .text(article.article, 70, artY);

            doc.fontSize(10)
                .fillColor('#52525b')
                .text(article.category, 70, artY + 18);

            if (article.requirements?.length > 0) {
                let reqY = artY + 38;
                for (const req of article.requirements.slice(0, 3)) {
                    doc.fontSize(9)
                        .fillColor('#71717a')
                        .text(`• ${req}`, 85, reqY);
                    reqY += 15;
                }
                artY = reqY + 10;
            } else {
                artY += 50;
            }
        }
    }

    // Legal Disclaimer
    doc.rect(50, doc.page.height - 150, doc.page.width - 100, 80)
        .fill('#f4f4f5');

    doc.fontSize(10)
        .fillColor('#52525b')
        .text('LEGAL DISCLAIMER', 70, doc.page.height - 135)
        .fontSize(9)
        .text('This assessment is for informational purposes only and does not constitute legal advice. ' +
            'Consult with qualified legal and compliance professionals before relying on this assessment. ' +
            'The regulatory landscape is subject to change.', 70, doc.page.height - 115, { width: doc.page.width - 140 });
}

function buildAppendices(doc: PDFKit.PDFDocument, data: ReportData) {
    addSectionHeader(doc, 'Appendices', 7);

    // Appendix A: Methodology
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('APPENDIX A: ASSESSMENT METHODOLOGY', 50, 120);

    doc.fontSize(10)
        .fillColor('#3f3f46')
        .text('This assessment follows a 5-feature pipeline:', 70, 145)
        .text('1. Repository Scanning - Initial code analysis', 85, 165)
        .text('2. LLM Capability Analysis - AI capability detection', 85, 185)
        .text('3. Risk Classification - Annex III mapping', 85, 205)
        .text('4. Context Verification - User-provided context', 85, 225)
        .text('5. Report Generation - Final documentation', 85, 245);

    // Appendix B: Definitions
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('APPENDIX B: DEFINITIONS', 50, 290);

    const definitions = [
        ['EU AI Act', 'European Union regulation on artificial intelligence'],
        ['Annex III', 'List of high-risk AI system categories'],
        ['Risk Classification', 'Categorization of AI systems by risk level'],
        ['Context Verification', 'User-provided information about system use'],
    ];

    let defY = 315;
    for (const [term, def] of definitions) {
        doc.fontSize(10)
            .fillColor('#18181b')
            .text(term + ':', 70, defY)
            .fillColor('#52525b')
            .text(def, 180, defY);
        defY += 20;
    }

    // Appendix C: Assessment Metadata
    doc.fontSize(14)
        .fillColor('#18181b')
        .text('APPENDIX C: ASSESSMENT METADATA', 50, 420);

    const metadata = [
        ['Assessment ID', data.assessment.id],
        ['System Name', data.repo.repo_name],
        ['Assessment Date', new Date().toISOString().split('T')[0]],
        ['Confidence Level', formatConfidence(data.capabilities.confidence_score)],
        ['Version', '1.0'],
        ['Next Review', getNextReviewDate()],
    ];

    let metY = 445;
    for (const [label, value] of metadata) {
        doc.fontSize(10)
            .fillColor('#71717a')
            .text(label + ':', 70, metY)
            .fillColor('#18181b')
            .text(value, 200, metY);
        metY += 20;
    }
}

function buildCertificate(doc: PDFKit.PDFDocument, data: ReportData) {
    const riskColor = RISK_COLORS[data.assessment.final_risk_classification] || '#6b7280';

    // Certificate border
    doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
        .lineWidth(3)
        .stroke(riskColor);

    doc.rect(50, 50, doc.page.width - 100, doc.page.height - 100)
        .lineWidth(1)
        .stroke('#e4e4e7');

    // Header
    doc.fontSize(16)
        .fillColor('#18181b')
        .text('EU AI ACT', 0, 100, { align: 'center' })
        .fontSize(24)
        .text('COMPLIANCE ASSESSMENT', 0, 125, { align: 'center' })
        .fontSize(20)
        .text('CERTIFICATE', 0, 160, { align: 'center' });

    // Divider
    doc.moveTo(150, 200)
        .lineTo(doc.page.width - 150, 200)
        .stroke('#e4e4e7');

    // System Info
    doc.fontSize(12)
        .fillColor('#71717a')
        .text('System:', 0, 240, { align: 'center' })
        .fontSize(18)
        .fillColor('#18181b')
        .text(data.repo.repo_name, 0, 260, { align: 'center' });

    doc.fontSize(11)
        .fillColor('#52525b')
        .text(`Repository: ${data.repo.repo_owner}/${data.repo.repo_name}`, 0, 290, { align: 'center' });

    // Classification
    doc.rect(150, 330, doc.page.width - 300, 60)
        .fill(riskColor);

    doc.fillColor('#ffffff')
        .fontSize(12)
        .text('RISK CLASSIFICATION', 0, 345, { align: 'center' })
        .fontSize(20)
        .text(data.assessment.final_risk_classification.replace('_', ' '), 0, 365, { align: 'center' });

    // Details
    doc.fontSize(12)
        .fillColor('#3f3f46')
        .text(`Risk Score: ${data.assessment.final_risk_score}/100`, 0, 420, { align: 'center' });

    const complianceReadiness = data.assessment.compliance_readiness as { overall_readiness: string } || { overall_readiness: 'NEEDS_REVIEW' };
    doc.text(`Compliance Status: ${complianceReadiness.overall_readiness.replace('_', ' ')}`, 0, 445, { align: 'center' });

    // Dates
    doc.fontSize(11)
        .fillColor('#71717a')
        .text(`Assessment Date: ${new Date().toLocaleDateString()}`, 0, 500, { align: 'center' })
        .text(`Valid Until: ${getNextReviewDate()}`, 0, 520, { align: 'center' });

    // Signature line
    doc.moveTo(150, 600)
        .lineTo(doc.page.width - 150, 600)
        .stroke('#e4e4e7');

    doc.fontSize(10)
        .fillColor('#71717a')
        .text('Digital Signature', 0, 610, { align: 'center' })
        .fontSize(8)
        .text('Verified by ComplianceAI Report Generator', 0, 625, { align: 'center' });

    // Footer
    doc.fontSize(8)
        .fillColor('#a1a1aa')
        .text('This certificate confirms that the above system has been assessed against the EU AI Act.', 0, doc.page.height - 100, { align: 'center' })
        .text('This is not a certification of compliance, but an assessment report.', 0, doc.page.height - 85, { align: 'center' });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function addSectionHeader(doc: PDFKit.PDFDocument, title: string, pageNum: number) {
    doc.rect(0, 0, doc.page.width, 80)
        .fill('#18181b');

    doc.fillColor('#ffffff')
        .fontSize(20)
        .text(title, 50, 35);

    doc.fontSize(10)
        .fillColor('#a1a1aa')
        .text(`Page ${pageNum}`, doc.page.width - 80, 35);
}

function getRiskRationale(classification: string): string {
    switch (classification) {
        case 'UNACCEPTABLE':
            return 'This system has been classified as UNACCEPTABLE due to practices that pose unacceptable risks to safety, rights, or fundamental values. These systems are prohibited under the EU AI Act.';
        case 'HIGH_RISK':
            return 'This system has been classified as HIGH RISK because it falls under Annex III categories requiring strict conformity assessment, registration, and ongoing monitoring obligations.';
        case 'LIMITED_RISK':
            return 'This system has been classified as LIMITED RISK. It is subject to transparency obligations, requiring users to be informed when they are interacting with AI-generated content.';
        case 'MINIMAL_RISK':
            return 'This system has been classified as MINIMAL RISK. While not subject to specific regulatory requirements, following best practices and voluntary codes of conduct is recommended.';
        default:
            return 'Risk classification rationale not available.';
    }
}

function getNextReviewDate(): string {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toLocaleDateString();
}

/**
 * Clean text by removing markdown syntax and fixing symbols
 */
function cleanText(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')     // Remove bold markers **text**
        .replace(/\*(.*?)\*/g, '$1')          // Remove italic markers *text*
        .replace(/^#{1,6}\s+/gm, '')          // Remove heading markers # ## ###
        .replace(/`([^`]+)`/g, '$1')          // Remove code ticks `text`
        .replace(/^[-*+]\s+/gm, '- ')         // Normalize list markers
        .replace(/^#ó\s*/gm, '- ')            // Fix bullet points
        .replace(/^!•\s*/gm, '- ')            // Fix other markers
        .replace(/←/g, '<-')                  // Fix arrow characters
        .replace(/→/g, '->')                  // Fix right arrows
        .replace(/✓/g, '[OK]')                // Replace checkmarks for PDF
        .replace(/✗/g, '[X]')                 // Replace X marks
        .replace(/⚠/g, '[!]')                 // Replace warning symbols
        .replace(/⏳/g, '[~]')                // Replace hourglass
        .replace(/\n{3,}/g, '\n\n')           // Collapse multiple newlines
        .trim();
}

/**
 * Format confidence score as percentage
 * Handles both 0-1 (decimal) and 0-100 (percentage) inputs
 */
function formatConfidence(score: number | null | undefined): string {
    if (score == null) return 'N/A';
    // If score is between 0 and 1, it's a decimal - multiply by 100
    const percentage = score <= 1 ? score * 100 : score;
    return `${percentage.toFixed(1)}%`;
}

/**
 * Safely get string value with fallback
 */
function safeString(value: unknown, fallback: string = 'Not specified'): string {
    if (value == null) return fallback;
    if (typeof value === 'string') return cleanText(value);
    return String(value);
}
