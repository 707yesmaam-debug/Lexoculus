/**
 * GitHub Webhook Handler for PR Events
 * 
 * Receives webhook events from GitHub and triggers PR scanning.
 * This enables the "Compliance Guardian" - continuous monitoring of PRs.
 * 
 * Setup:
 * 1. User enables GitHub Action in their repo
 * 2. GitHub sends PR events to this endpoint
 * 3. We scan the PR diff for risky patterns
 * 4. We post a comment on the PR with results
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { quickPatternMatch, getConstraintEngine } from '@/lib/constraint-engine';

// Types for GitHub webhook payloads
interface GitHubPRPayload {
    action: string;
    number: number;
    pull_request: {
        id: number;
        number: number;
        title: string;
        head: {
            sha: string;
            ref: string;
        };
        base: {
            sha: string;
            ref: string;
        };
        user: {
            login: string;
        };
        html_url: string;
        diff_url: string;
    };
    repository: {
        id: number;
        name: string;
        full_name: string;
        owner: {
            login: string;
        };
    };
    installation?: {
        id: number;
    };
}

interface ScanResult {
    risk_level: 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK' | null;
    matched_patterns: string[];
    matched_constraints: string[];
    should_block: boolean;
    comment_body: string;
}

/**
 * Verify GitHub webhook signature
 */
function verifyWebhookSignature(
    payload: string,
    signature: string | null,
    secret: string
): boolean {
    if (!signature) return false;

    const sig = Buffer.from(signature);
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from('sha256=' + hmac.update(payload).digest('hex'));

    if (sig.length !== digest.length) return false;
    return crypto.timingSafeEqual(sig, digest);
}

/**
 * Fetch PR diff from GitHub
 */
async function fetchPRDiff(diffUrl: string, accessToken: string): Promise<string> {
    const response = await fetch(diffUrl, {
        headers: {
            'Accept': 'application/vnd.github.v3.diff',
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch PR diff: ${response.status}`);
    }

    return response.text();
}

/**
 * Extract added lines from diff
 */
function extractAddedLines(diff: string): string {
    const lines = diff.split('\n');
    const addedLines: string[] = [];

    for (const line of lines) {
        // Lines starting with + (but not +++) are additions
        if (line.startsWith('+') && !line.startsWith('+++')) {
            addedLines.push(line.substring(1)); // Remove the + prefix
        }
    }

    return addedLines.join('\n');
}

/**
 * Scan PR content for risky patterns
 */
function scanPRContent(addedCode: string): ScanResult {
    // Step 1: Quick pattern match (fast, no LLM)
    const quickResult = quickPatternMatch(addedCode);

    // Step 2: If risky patterns found, get detailed constraint info
    let matchedConstraints: string[] = [];
    let comment_body = '';
    let should_block = false;

    if (quickResult.risk_level) {
        const engine = getConstraintEngine();
        const constraintResult = engine.matchConstraints(
            quickResult.matched_patterns,
            [],
        );

        matchedConstraints = constraintResult.matches.map(m => m.constraint.constraint_id);

        // Determine if should block
        should_block = quickResult.risk_level === 'UNACCEPTABLE';

        // Build comment body
        comment_body = buildCommentBody(
            quickResult.risk_level,
            quickResult.matched_patterns,
            constraintResult.matches,
            should_block
        );
    }

    return {
        risk_level: quickResult.risk_level,
        matched_patterns: quickResult.matched_patterns,
        matched_constraints: matchedConstraints,
        should_block,
        comment_body,
    };
}

/**
 * Build GitHub PR comment
 */
function buildCommentBody(
    riskLevel: string,
    patterns: string[],
    matches: { constraint: { constraint_id: string; regulation_source: string; category: string; official_text: string } }[],
    shouldBlock: boolean
): string {
    const lines: string[] = [];

    // Header with icon
    if (riskLevel === 'UNACCEPTABLE') {
        lines.push('## 🚫 ComplianceAI: UNACCEPTABLE Risk Detected');
        lines.push('');
        lines.push('> **This PR contains code that is BANNED under EU AI Act Article 5.**');
        lines.push('> This PR cannot be merged until these issues are resolved.');
    } else if (riskLevel === 'HIGH_RISK') {
        lines.push('## ⚠️ ComplianceAI: HIGH Risk Detected');
        lines.push('');
        lines.push('> This PR contains code requiring EU AI Act conformity assessment before deployment.');
    } else if (riskLevel === 'LIMITED_RISK') {
        lines.push('## ℹ️ ComplianceAI: LIMITED Risk Detected');
        lines.push('');
        lines.push('> This PR contains code requiring transparency measures under EU AI Act Article 50.');
    } else {
        lines.push('## ✅ ComplianceAI: MINIMAL Risk');
        lines.push('');
        lines.push('> No significant EU AI Act compliance concerns detected.');
        return lines.join('\n');
    }

    // Detected patterns
    lines.push('');
    lines.push('### Detected Patterns');
    lines.push('');
    for (const pattern of patterns) {
        lines.push(`- \`${pattern}\``);
    }

    // Matched regulations
    if (matches.length > 0) {
        lines.push('');
        lines.push('### Applicable Regulations');
        lines.push('');
        for (const match of matches.slice(0, 3)) { // Limit to 3 for readability
            lines.push(`#### ${match.constraint.regulation_source}: ${match.constraint.category}`);
            lines.push('');
            lines.push(`> ${match.constraint.official_text.slice(0, 300)}...`);
            lines.push('');
        }
    }

    // Action required
    lines.push('');
    lines.push('### What to do');
    lines.push('');
    if (shouldBlock) {
        lines.push('1. **Remove or refactor** the flagged code patterns');
        lines.push('2. Run this PR again to re-scan');
        lines.push('3. Contact your compliance officer if you believe this is a false positive');
    } else {
        lines.push('1. **Review** the flagged patterns with your compliance team');
        lines.push('2. Ensure proper documentation and conformity assessment before deployment');
        lines.push('3. Add transparency disclosures where required');
    }

    // Footer
    lines.push('');
    lines.push('---');
    lines.push('*Powered by [ComplianceAI](https://complianceai.eu) | [Learn more about EU AI Act](https://artificialintelligenceact.eu)*');

    return lines.join('\n');
}

/**
 * Post comment on GitHub PR
 */
async function postPRComment(
    repoFullName: string,
    prNumber: number,
    comment: string,
    accessToken: string
): Promise<void> {
    const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ body: comment }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to post PR comment: ${JSON.stringify(error)}`);
    }
}

/**
 * POST /api/webhooks/github
 * 
 * Handle GitHub webhook events
 */
export async function POST(request: NextRequest) {
    try {
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

        // Get raw body for signature verification
        const rawBody = await request.text();

        // Verify webhook signature (if secret is configured)
        if (webhookSecret) {
            const signature = request.headers.get('x-hub-signature-256');
            if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
                console.error('❌ [WEBHOOK] Invalid signature');
                return NextResponse.json(
                    { error: 'Invalid webhook signature' },
                    { status: 401 }
                );
            }
        }

        // Parse payload
        const payload = JSON.parse(rawBody);
        const event = request.headers.get('x-github-event');

        console.log(`📥 [WEBHOOK] Received event: ${event}`);

        // Only handle pull_request events
        if (event !== 'pull_request') {
            return NextResponse.json({ message: 'Event ignored' });
        }

        const prPayload = payload as GitHubPRPayload;

        // Only handle opened, synchronize (new commits), reopened
        if (!['opened', 'synchronize', 'reopened'].includes(prPayload.action)) {
            console.log(`📥 [WEBHOOK] Ignoring action: ${prPayload.action}`);
            return NextResponse.json({ message: 'Action ignored' });
        }

        console.log(`🔍 [PR-SCAN] Scanning PR #${prPayload.number} in ${prPayload.repository.full_name}`);

        // Find the user who installed this for this repo
        const installation = await prisma.gitHubActionInstall.findFirst({
            where: {
                repo_full_name: prPayload.repository.full_name,
                status: 'active',
            },
            include: {
                user: true,
            },
        });

        if (!installation) {
            console.log(`⚠️ [PR-SCAN] No active installation found for ${prPayload.repository.full_name}`);
            return NextResponse.json({ message: 'No installation found' });
        }

        // Get user's GitHub access token
        const githubConnection = await prisma.githubConnection.findFirst({
            where: { user_id: installation.user_id },
        });

        if (!githubConnection?.github_oauth_token) {
            console.error(`❌ [PR-SCAN] No GitHub token for user ${installation.user_id}`);
            return NextResponse.json(
                { error: 'GitHub token not found' },
                { status: 500 }
            );
        }

        // Fetch PR diff
        const diff = await fetchPRDiff(
            prPayload.pull_request.diff_url,
            githubConnection.github_oauth_token
        );

        // Extract added code
        const addedCode = extractAddedLines(diff);

        // Scan for risky patterns
        const scanResult = scanPRContent(addedCode);

        console.log(`✅ [PR-SCAN] Result: ${scanResult.risk_level || 'MINIMAL_RISK'}`);
        console.log(`   Patterns: ${scanResult.matched_patterns.join(', ') || 'none'}`);

        // Store scan result
        await prisma.pRScan.create({
            data: {
                user_id: installation.user_id,
                repo_full_name: prPayload.repository.full_name,
                pr_number: prPayload.number,
                pr_title: prPayload.pull_request.title,
                pr_url: prPayload.pull_request.html_url,
                head_sha: prPayload.pull_request.head.sha,
                risk_level: scanResult.risk_level || 'MINIMAL_RISK',
                matched_patterns: scanResult.matched_patterns,
                matched_constraints: scanResult.matched_constraints,
                blocked: scanResult.should_block,
            },
        });

        // Post comment if risky patterns found
        if (scanResult.risk_level && scanResult.comment_body) {
            await postPRComment(
                prPayload.repository.full_name,
                prPayload.number,
                scanResult.comment_body,
                githubConnection.github_oauth_token
            );
            console.log(`💬 [PR-SCAN] Posted comment on PR #${prPayload.number}`);
        }

        return NextResponse.json({
            success: true,
            pr_number: prPayload.number,
            risk_level: scanResult.risk_level || 'MINIMAL_RISK',
            blocked: scanResult.should_block,
            patterns_found: scanResult.matched_patterns.length,
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/webhooks/github
 * 
 * Health check for webhook endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        endpoint: '/api/webhooks/github',
        description: 'GitHub webhook endpoint for PR scanning',
        events_supported: ['pull_request'],
    });
}
