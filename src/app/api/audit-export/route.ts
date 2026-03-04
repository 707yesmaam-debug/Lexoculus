'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import crypto from 'crypto';

/**
 * POST /api/audit-export
 * Generate a complete audit package for an AI System
 * 
 * MRR HOOK: Requires active subscription
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ai_system_id } = await request.json();

        if (!ai_system_id) {
            return NextResponse.json(
                { error: 'ai_system_id required' },
                { status: 400 }
            );
        }

        // Get AI System with all related data
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id: ai_system_id },
            include: {
                user: {
                    include: {
                        subscription: true
                    }
                },
                latest_scan: {
                    include: {
                        llm_analysis: true,
                        risk_assessment: true,
                    }
                },
                documents: true,
                scan_history: {
                    take: 10,
                    orderBy: { scanned_at: 'desc' }
                }
            }
        });

        if (!aiSystem) {
            return NextResponse.json({ error: 'AI System not found' }, { status: 404 });
        }

        if (aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // MRR GATING: Check subscription
        const subscription = aiSystem.user?.subscription;
        const hasActiveSubscription = subscription?.status === 'active' ||
            subscription?.status === 'trialing';

        if (!hasActiveSubscription) {
            return NextResponse.json(
                { error: 'Active subscription required to export audit package' },
                { status: 403 }
            );
        }

        // Get audit logs for this system
        const auditLogs = await prisma.auditLog.findMany({
            where: { ai_system_id },
            orderBy: { created_at: 'desc' },
            take: 100,
        });

        // Get evidence for this system
        const evidence = await prisma.complianceEvidence.findMany({
            where: { ai_system_id },
            orderBy: { collected_at: 'desc' },
        });

        // Build the audit package
        const auditPackage = buildAuditPackage(aiSystem, auditLogs, evidence);

        // Generate integrity hash for the package
        const packageHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(auditPackage))
            .digest('hex');

        console.log(`[CACHE] [AUDIT EXPORT] Generated package for ${aiSystem.name} (hash: ${packageHash.slice(0, 12)}...)`);

        // Return as HTML document for printing/PDF
        const html = generateAuditPackageHtml(auditPackage, packageHash);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="audit-package-${aiSystem.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html"`,
            }
        });

    } catch (error) {
        console.error('Audit export error:', error);
        return NextResponse.json(
            { error: 'Failed to generate audit package' },
            { status: 500 }
        );
    }
}

interface AuditPackage {
    system: {
        id: string;
        name: string;
        description: string | null;
        riskClassification: string | null;
        riskScore: number | null;
        status: string;
        lifecycleStage: string;
        lastScannedAt: Date | null;
    };
    provider: {
        name: string | null;
        email: string;
    };
    documents: Array<{
        type: string;
        title: string;
        status: string;
        completionPercent: number;
        version: number;
        createdAt: Date;
    }>;
    scanHistory: Array<{
        scannedAt: Date;
        riskClassification: string | null;
        riskScore: number | null;
        classificationChanged: boolean;
    }>;
    auditLogs: Array<{
        action: string;
        description: string;
        createdAt: Date;
    }>;
    evidence: Array<{
        type: string;
        title: string;
        collectedAt: Date;
        verified: boolean;
        hash: string;
    }>;
    exportedAt: string;
    exportedBy: string;
}

function buildAuditPackage(
    aiSystem: any,
    auditLogs: any[],
    evidence: any[]
): AuditPackage {
    return {
        system: {
            id: aiSystem.id,
            name: aiSystem.name,
            description: aiSystem.description,
            riskClassification: aiSystem.risk_classification,
            riskScore: aiSystem.risk_score,
            status: aiSystem.status,
            lifecycleStage: aiSystem.lifecycle_stage,
            lastScannedAt: aiSystem.last_scanned_at,
        },
        provider: {
            name: aiSystem.user?.full_name,
            email: aiSystem.user?.email,
        },
        documents: aiSystem.documents.map((doc: any) => ({
            type: doc.document_type,
            title: doc.title,
            status: doc.status,
            completionPercent: doc.completion_percent,
            version: doc.version,
            createdAt: doc.created_at,
        })),
        scanHistory: aiSystem.scan_history.map((scan: any) => ({
            scannedAt: scan.scanned_at,
            riskClassification: scan.risk_classification,
            riskScore: scan.risk_score,
            classificationChanged: scan.classification_changed,
        })),
        auditLogs: auditLogs.map(log => ({
            action: log.action,
            description: log.description,
            createdAt: log.created_at,
        })),
        evidence: evidence.map(e => ({
            type: e.evidence_type,
            title: e.title,
            collectedAt: e.collected_at,
            verified: e.verified,
            hash: e.hash,
        })),
        exportedAt: new Date().toISOString(),
        exportedBy: aiSystem.user?.email,
    };
}

function generateAuditPackageHtml(pkg: AuditPackage, hash: string): string {
    const formatDate = (d: Date | null) => d ? new Date(d).toLocaleDateString() : 'N/A';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>EU AI Act Compliance Audit Package - ${pkg.system.name}</title>
    <style>
        @page { margin: 2cm; }
        body { font-family: 'Times New Roman', serif; line-height: 1.6; max-width: 21cm; margin: 0 auto; padding: 2cm; }
        h1 { font-size: 24pt; border-bottom: 3px solid #000; padding-bottom: 10px; }
        h2 { font-size: 18pt; margin-top: 30pt; border-bottom: 1px solid #333; }
        h3 { font-size: 14pt; margin-top: 20pt; }
        table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
        th, td { border: 1px solid #333; padding: 8pt; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        .header { text-align: center; margin-bottom: 30pt; }
        .risk-high { color: #dc3545; font-weight: bold; }
        .risk-limited { color: #ffc107; font-weight: bold; }
        .risk-minimal { color: #28a745; font-weight: bold; }
        .integrity { background: #f8f9fa; border: 2px solid #333; padding: 15pt; margin: 20pt 0; font-family: monospace; font-size: 10pt; }
        .footer { text-align: center; font-size: 10pt; color: #666; margin-top: 40pt; padding-top: 20pt; border-top: 1px solid #ccc; }
        .badge { display: inline-block; padding: 4pt 8pt; border-radius: 3pt; font-size: 10pt; font-weight: bold; }
        .badge-complete { background: #d4edda; color: #155724; }
        .badge-draft { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="header">
        <h1>EU AI Act Compliance Audit Package</h1>
        <p style="font-size: 14pt;"><strong>${pkg.system.name}</strong></p>
        <p>Export Date: ${new Date(pkg.exportedAt).toLocaleString()}</p>
    </div>

    <h2>1. System Identification</h2>
    <table>
        <tr><th>System ID</th><td>${pkg.system.id}</td></tr>
        <tr><th>Name</th><td>${pkg.system.name}</td></tr>
        <tr><th>Description</th><td>${pkg.system.description || 'N/A'}</td></tr>
        <tr><th>Risk Classification</th><td class="${pkg.system.riskClassification === 'HIGH_RISK' ? 'risk-high' : pkg.system.riskClassification === 'LIMITED_RISK' ? 'risk-limited' : 'risk-minimal'}">${pkg.system.riskClassification || 'Not classified'}</td></tr>
        <tr><th>Risk Score</th><td>${pkg.system.riskScore !== null ? `${pkg.system.riskScore}/100` : 'N/A'}</td></tr>
        <tr><th>Lifecycle Stage</th><td>${pkg.system.lifecycleStage}</td></tr>
        <tr><th>Status</th><td>${pkg.system.status}</td></tr>
        <tr><th>Last Scanned</th><td>${formatDate(pkg.system.lastScannedAt)}</td></tr>
    </table>

    <h2>2. Provider Information</h2>
    <table>
        <tr><th>Name</th><td>${pkg.provider.name || 'Not specified'}</td></tr>
        <tr><th>Email</th><td>${pkg.provider.email}</td></tr>
    </table>

    <h2>3. Compliance Documents</h2>
    ${pkg.documents.length > 0 ? `
    <table>
        <tr><th>Document Type</th><th>Title</th><th>Status</th><th>Completion</th><th>Version</th><th>Created</th></tr>
        ${pkg.documents.map(doc => `
        <tr>
            <td>${doc.type}</td>
            <td>${doc.title}</td>
            <td><span class="badge ${doc.status === 'complete' ? 'badge-complete' : 'badge-draft'}">${doc.status}</span></td>
            <td>${doc.completionPercent}%</td>
            <td>v${doc.version}</td>
            <td>${formatDate(doc.createdAt)}</td>
        </tr>
        `).join('')}
    </table>
    ` : '<p>No documents generated yet.</p>'}

    <h2>4. Scan History</h2>
    ${pkg.scanHistory.length > 0 ? `
    <table>
        <tr><th>Date</th><th>Risk Classification</th><th>Risk Score</th><th>Classification Changed</th></tr>
        ${pkg.scanHistory.map(scan => `
        <tr>
            <td>${formatDate(scan.scannedAt)}</td>
            <td>${scan.riskClassification || 'N/A'}</td>
            <td>${scan.riskScore !== null ? scan.riskScore : 'N/A'}</td>
            <td>${scan.classificationChanged ? 'Yes (Changed)' : 'No'}</td>
        </tr>
        `).join('')}
    </table>
    ` : '<p>No scan history available.</p>'}

    <h2>5. Compliance Evidence</h2>
    ${pkg.evidence.length > 0 ? `
    <table>
        <tr><th>Type</th><th>Title</th><th>Collected</th><th>Verified</th><th>Hash (truncated)</th></tr>
        ${pkg.evidence.map(e => `
        <tr>
            <td>${e.type}</td>
            <td>${e.title}</td>
            <td>${formatDate(e.collectedAt)}</td>
            <td>${e.verified ? 'Yes' : 'No'}</td>
            <td><code>${e.hash.slice(0, 16)}...</code></td>
        </tr>
        `).join('')}
    </table>
    ` : '<p>No evidence collected yet.</p>'}

    <h2>6. Audit Trail (Recent)</h2>
    ${pkg.auditLogs.length > 0 ? `
    <table>
        <tr><th>Date</th><th>Action</th><th>Description</th></tr>
        ${pkg.auditLogs.slice(0, 20).map(log => `
        <tr>
            <td>${formatDate(log.createdAt)}</td>
            <td><code>${log.action}</code></td>
            <td>${log.description}</td>
        </tr>
        `).join('')}
    </table>
    ${pkg.auditLogs.length > 20 ? `<p><em>Showing 20 of ${pkg.auditLogs.length} entries</em></p>` : ''}
    ` : '<p>No audit logs available.</p>'}

    <div class="integrity">
        <h3>[AUDIT] Package Integrity Verification</h3>
        <p><strong>SHA-256 Hash:</strong></p>
        <code>${hash}</code>
        <p style="margin-top: 10pt;"><strong>Exported At:</strong> ${pkg.exportedAt}</p>
        <p><strong>Exported By:</strong> ${pkg.exportedBy}</p>
        <p style="margin-top: 10pt; font-size: 9pt; color: #666;">
            This hash can be used to verify the integrity of this document. Any modifications
            will result in a different hash value, indicating tampering.
        </p>
    </div>

    <div class="footer">
        <p>Generated by LexOculus EU AI Act Compliance Platform</p>
        <p>This document constitutes part of the technical documentation required under Article 11 of Regulation (EU) 2024/1689</p>
        <p>© ${new Date().getFullYear()} LexOculus. All rights reserved.</p>
    </div>
</body>
</html>`;
}
