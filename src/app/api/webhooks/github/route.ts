/**
 * GitHub Webhook Handler for PR Events
 * 
 * Receives webhook events from GitHub and triggers PR scanning.
 * This enables the "Compliance Guardian" - continuous monitoring of PRs.
 * 
 * TRIWIRE UPDATE:
 * Now uses "Guerrilla Compliance" strategy:
 * 1. Fetch PR Diff
 * 2. Parse filenames and content
 * 3. Run Tripwire Engine (short-circuit if irrelevant)
 * 4. Post results
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { scanDiffs, TripwireResult } from '@/lib/tripwire';

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
 * Parse a unified diff string into individual file changes
 */
interface FileChange {
    filename: string;
    diff: string;
}

function parseDiff(diffText: string): FileChange[] {
    const changes: FileChange[] = [];
    // Split by "diff --git" to separate files
    const rawFiles = diffText.split('diff --git ');

    for (const rawFile of rawFiles) {
        if (!rawFile.trim()) continue;

        // Extract filename (e.g., a/package.json b/package.json)
        // We want the 'b/' version (the new version)
        const lines = rawFile.split('\n');
        const headerLine = lines[0]; // a/foo.ts b/foo.ts

        let filename = 'unknown';
        const parts = headerLine.split(' ');
        if (parts.length >= 2) {
            // usually the last part is b/path/to/file
            const bPath = parts[parts.length - 1];
            if (bPath.startsWith('b/')) {
                filename = bPath.substring(2);
            } else {
                filename = bPath; // fallback
            }
        }

        changes.push({
            filename: filename,
            diff: rawFile
        });
    }

    return changes;
}

/**
 * Build GitHub PR comment based on Tripwire results
 */
function buildTripwireComment(result: TripwireResult): string {
    const lines: string[] = [];

    // Header with status
    if (result.risk_found) {
        const highestRisk = result.highest_risk;

        if (highestRisk === 'UNACCEPTABLE') {
            lines.push('## 🚫 ComplianceAI: PROHIBITED Risk Detected');
            lines.push('> **Critical Alert**: This PR introduces capabilities banned under EU AI Act Article 5.');
        } else if (highestRisk === 'HIGH_RISK') {
            lines.push('## ⚠️ ComplianceAI: HIGH Risk Detected');
            lines.push('> **Warning**: This PR introduces High-Risk AI capabilities (Annex III).');
        } else if (highestRisk === 'LIMITED_RISK') {
            lines.push('## ℹ️ ComplianceAI: Transparency Requirements');
            lines.push('> **Notice**: This PR introduces Limited Risk AI capabilities.');
        } else {
            // Should technically not happen if match found, but fallback
            lines.push('## 🔍 ComplianceAI: Risk Detected');
        }
    } else {
        lines.push('## ✅ ComplianceAI: Passed');
        lines.push('> No specific EU AI Act risks detected in this PR.');
        // If it was just irrelevant files, we might not even post this default message 
        // to reduce noise, but for now we'll be explicit.
        return lines.join('\n');
    }

    lines.push('');

    // Tripwire Findings
    lines.push('### 🕸️ Tripwire Findings');
    lines.push('The following risk patterns were detected in your changes:');
    lines.push('');
    lines.push('| Risk Level | Category | File | Pattern |');
    lines.push('| :--- | :--- | :--- | :--- |');

    for (const detection of result.detections) {
        // Format risk level for table
        const riskEmoji = {
            'UNACCEPTABLE': '🚫 PROHIBITED',
            'HIGH_RISK': '⚠️ HIGH',
            'LIMITED_RISK': 'ℹ️ LIMITED',
            'MINIMAL_RISK': '✅ LOW'
        }[detection.risk] || detection.risk;

        lines.push(`| ${riskEmoji} | ${detection.category} | \`${detection.file}\` | \`${detection.heuristic_match}\` |`);
    }

    // Action Items
    lines.push('');
    lines.push('### 🛡️ Recommended Actions');
    lines.push('');
    if (result.highest_risk === 'UNACCEPTABLE') {
        lines.push('1. **BLOCKED**: You cannot merge this PR.');
        lines.push('2. Remove the prohibited capability immediately.');
    } else if (result.highest_risk === 'HIGH_RISK') {
        lines.push('1. **Assessment Required**: This feature requires a Conformity Assessment.');
        lines.push('2. Ensure you have technical documentation prepared.');
        lines.push('3. Verify if this system is intended for a High-Risk use case (e.g. Hiring, Biometrics).');
    } else if (result.highest_risk === 'LIMITED_RISK') {
        lines.push('1. **Transparency**: Update your UI to inform users they are interacting with AI.');
        lines.push('2. If generating content, ensure it is machine-readable as artificially generated.');
    }

    // Footer
    lines.push('');
    lines.push('---');
    lines.push('*Powered by ComplianceAI Tripwire Engine*');

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

        // Handle 'ping' events (sent when creating a webhook)
        if (event === 'ping') {
            console.log('✅ [WEBHOOK] Ping received!');
            return NextResponse.json({ message: 'Pong!' });
        }

        // Only handle pull_request events
        if (event !== 'pull_request') {
            return NextResponse.json({ message: 'Event ignored' });
        }

        const prPayload = payload as GitHubPRPayload;

        // Only handle opened, synchronize (new commits), reopened
        if (!['opened', 'synchronize', 'reopened'].includes(prPayload.action)) {
            return NextResponse.json({ message: 'Action ignored' });
        }

        console.log(`🔍 [TRIPWIRE] Scanning PR #${prPayload.number} in ${prPayload.repository.full_name}`);

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
            console.log(`⚠️ [TRIPWIRE] No active installation found for ${prPayload.repository.full_name}`);
            return NextResponse.json({ message: 'No installation found' });
        }

        // Get user's GitHub access token
        const githubConnection = await prisma.githubConnection.findFirst({
            where: { user_id: installation.user_id },
        });

        if (!githubConnection?.github_oauth_token) {
            console.error(`❌ [TRIPWIRE] No GitHub token for user ${installation.user_id}`);
            return NextResponse.json(
                { error: 'GitHub token not found' },
                { status: 500 }
            );
        }

        // 1. Fetch PR diff
        const diffText = await fetchPRDiff(
            prPayload.pull_request.diff_url,
            githubConnection.github_oauth_token
        );

        // 2. Parse Diff into files
        const fileChanges = parseDiff(diffText);

        // 3. Run Tripwire Engine
        const tripwireResult = scanDiffs(fileChanges);

        console.log(`✅ [TRIPWIRE] Result: Run=${tripwireResult.triggered}, Risks=${tripwireResult.detections.length}`);

        // 4. Store Scan Result (Legacy table adaptation)
        await prisma.pRScan.create({
            data: {
                user_id: installation.user_id,
                repo_full_name: prPayload.repository.full_name,
                pr_number: prPayload.number,
                pr_title: prPayload.pull_request.title,
                pr_url: prPayload.pull_request.html_url,
                head_sha: prPayload.pull_request.head.sha,
                risk_level: tripwireResult.highest_risk || 'MINIMAL_RISK',
                // Flatten heuristics for storage
                matched_patterns: tripwireResult.detections.map(d => `${d.heuristic_match} (${d.file})`),
                matched_constraints: tripwireResult.detections.map(d => d.category),
                blocked: tripwireResult.highest_risk === 'UNACCEPTABLE',
            },
        });

        // 5. Post Comment (Only if triggered and risk found)
        // Optimization: If NOT triggered (all files ignored), don't post anything to reduce noise.
        // If triggered but NO risk, maybe post "Pass" emoji if configured (omitted for now for silence).
        if (tripwireResult.triggered && tripwireResult.risk_found) {
            const commentBody = buildTripwireComment(tripwireResult);
            await postPRComment(
                prPayload.repository.full_name,
                prPayload.number,
                commentBody,
                githubConnection.github_oauth_token
            );
            console.log(`💬 [TRIPWIRE] Posted comment on PR #${prPayload.number}`);
        } else {
            console.log(`zzz [TRIPWIRE] No risks found or irrelevant files. Sleeping.`);
        }

        return NextResponse.json({
            success: true,
            risk_found: tripwireResult.risk_found,
            triggered: tripwireResult.triggered
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
        description: 'GitHub webhook endpoint for PR scanning (Tripwire Engine)',
        events_supported: ['pull_request'],
    });
}
