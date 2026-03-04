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
import { prisma } from '@/lib/infra/prisma';

// Allow Vercel functions to run for up to 60 seconds (Hobby limit) to accommodate LLM analysis
export const maxDuration = 60;

import { deriveRepoSecret } from '@/lib/github/github-security';
import crypto from 'crypto'; // Needed for local verifyWebhookSignature
import { scanDiffs, TripwireResult } from '@/lib/security/tripwire';
import { decrypt } from '@/lib/security/encryption';
import { analyzeDiffWithLLM } from '@/lib/security/guardian-agent';
import { RiskTier } from '@/lib/compliance/eu-ai-act/annex-iii-articles';

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
        url: string; // API URL
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

    // Normalization: Ensure signature starts with 'sha256='
    const normalizedSignature = signature.startsWith('sha256=')
        ? signature
        : `sha256=${signature}`;

    const sig = Buffer.from(normalizedSignature);
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from('sha256=' + hmac.update(payload).digest('hex'));

    if (sig.length !== digest.length) return false;
    return crypto.timingSafeEqual(sig, digest);
}

/**
 * Fetch PR diff from GitHub
 */
async function fetchPRDiff(diffUrl: string, accessToken: string): Promise<string> {
    console.log(`[TRIPWIRE] Fetching Diff from: ${diffUrl}`);
    console.log(`[TRIPWIRE] Using Token: ${accessToken ? 'PRESENT (' + accessToken.substring(0, 4) + '...)' : 'MISSING'}`);

    const response = await fetch(diffUrl, {
        headers: {
            'Accept': 'application/vnd.github.v3.diff',
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        console.error(`[TRIPWIRE] Fetch failed: ${response.status} ${response.statusText}`);
        const body = await response.text();
        console.error(`[TRIPWIRE] Error Body: ${body}`);
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
            lines.push('## [PROHIBITED] ComplianceAI: Risk Detected');
            lines.push('> **Critical Alert**: This PR introduces capabilities banned under EU AI Act Article 5.');
        } else if (highestRisk === 'HIGH_RISK') {
            lines.push('## [HIGH RISK] ComplianceAI: Risk Detected');
            lines.push('> **Warning**: This PR introduces High-Risk AI capabilities (Annex III).');
        } else if (highestRisk === 'LIMITED_RISK') {
            lines.push('## [NOTICE] ComplianceAI: Transparency Requirements');
            lines.push('> **Notice**: This PR introduces Limited Risk AI capabilities.');
        } else {
            // Should technically not happen if match found, but fallback
            lines.push('## [RISK] ComplianceAI: Risk Detected');
        }
    } else {
        lines.push('## [PASSED] ComplianceAI: Passed');
        lines.push('> No specific EU AI Act risks detected in this PR.');
        // If it was just irrelevant files, we might not even post this default message 
        // to reduce noise, but for now we'll be explicit.
        return lines.join('\n');
    }

    lines.push('');

    // Tripwire Findings
    lines.push('### [TRIPWIRE] Findings');
    lines.push('The following risk patterns were detected in your changes:');
    lines.push('');
    lines.push('| Risk Level | Category | File | Pattern |');
    lines.push('| :--- | :--- | :--- | :--- |');

    for (const detection of result.detections) {
        // Format risk level for table
        const riskEmoji = {
            'UNACCEPTABLE': '[PROHIBITED]',
            'HIGH_RISK': '[HIGH]',
            'LIMITED_RISK': '[LIMITED]',
            'MINIMAL_RISK': '[LOW]'
        }[detection.risk] || detection.risk;

        lines.push(`| ${riskEmoji} | ${detection.category} | \`${detection.file}\` | \`${detection.heuristic_match}\` |`);
    }

    // Action Items
    lines.push('');
    lines.push('### [ACTION] Recommended Actions');
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
        // SECURITY: Webhook signature verification is MANDATORY
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('[ERROR] [WEBHOOK] GITHUB_WEBHOOK_SECRET not configured - rejecting request');
            return NextResponse.json(
                { error: 'Webhook endpoint not properly configured' },
                { status: 500 }
            );
        }

        // Get raw body for signature verification
        const rawBody = await request.text();

        // Parse payload FIRST to identify repository (needed for per-repo secret derivation)
        const payload = JSON.parse(rawBody);
        const event = request.headers.get('x-github-event');
        const repoFullName = payload.repository?.full_name;

        // SECURITY: Derive the correct secret for this specific repository
        // This prevents one leaked repo secret from compromising the entire system
        let secretToVerify = webhookSecret; // Default to global secret (legacy)

        if (repoFullName) {
            console.log(`[WEBHOOK] Repo found: ${repoFullName}, deriving secret...`);
            secretToVerify = deriveRepoSecret(repoFullName);
        } else {
            console.log(`[WEBHOOK] No repo name in payload, using global secret.`);
        }

        // Verify webhook signature (REQUIRED)
        const signature = request.headers.get('x-hub-signature-256');

        // Debug: Log normalization and calculated hashes
        const sigReceived = signature ? (signature.startsWith('sha256=') ? signature : `sha256=${signature}`) : 'MISSING';

        let sigDerived = 'ERROR';
        try {
            const hmacDerived = crypto.createHmac('sha256', secretToVerify);
            sigDerived = 'sha256=' + hmacDerived.update(JSON.stringify(payload)).digest('hex');
            // Wait! The payload passed to update() MUST be the RAW BODY, not the JSON object!
            // JSON.stringify reorders keys differently than the original string.
            // This was the issue potentially? No, logic uses rawBody below. Let's fix logging.
            const hmacRaw = crypto.createHmac('sha256', secretToVerify);
            sigDerived = 'sha256=' + hmacRaw.update(rawBody).digest('hex');
        } catch (e) { sigDerived = `ERROR: ${e}`; }

        let sigMaster = 'ERROR';
        try {
            const hmacMaster = crypto.createHmac('sha256', webhookSecret);
            sigMaster = 'sha256=' + hmacMaster.update(rawBody).digest('hex');
        } catch (e) { sigMaster = `ERROR: ${e}`; }

        console.log(`[WEBHOOK] Signature Debug:`);
        console.log(`   - Received Normalized: ${sigReceived}`);
        console.log(`   - Calculated (Derived): ${sigDerived}`);
        console.log(`   - Calculated (Master) : ${sigMaster}`);

        // Robust Verification Loop: Try variations of payload (trim, newline, etc)
        // This handles curl/shell newline inconsistencies
        const payloadVariations = [
            rawBody, // As received
            rawBody.trim(), // No whitespace
            rawBody + '\n', // With newline
            rawBody.replace(/\n$/, ''), // Without trailing newline
            JSON.stringify(JSON.parse(rawBody)) // Canonicalized (Desperate fallback)
        ];

        let verified = false;
        let method = 'none';

        for (const [i, variation] of payloadVariations.entries()) {
            if (verifyWebhookSignature(variation, signature, secretToVerify)) {
                console.log(`[WEBHOOK] [SUCCESS] Verified with Derived Secret (Variation ${i})`);
                verified = true; method = 'derived'; break;
            }
            if (verifyWebhookSignature(variation, signature, webhookSecret)) {
                console.log(`[WEBHOOK] [SUCCESS] Verified with Master Secret (Variation ${i})`);
                verified = true; method = 'master'; break;
            }
        }

        if (!verified) {
            console.log(`[WEBHOOK] Primary secret verification failed.`);
            // ... error handling
            console.error('[ERROR] [WEBHOOK] Invalid signature - Secret mismatch');
            console.log(`[WEBHOOK] Payload start: ${rawBody.substring(0, 50)}...`);
            return NextResponse.json(
                { error: 'Invalid webhook signature', debug: { received: sigReceived, expected_derived: sigDerived } },
                { status: 401 }
            );
        } else {
            console.log(`[WEBHOOK] Signature verified successfully (${method}).`);
        }

        // Handle 'ping' events (sent when creating a webhook)
        if (event === 'ping') {
            console.log('[SUCCESS] [WEBHOOK] Ping received!');
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

        console.log(`[SCAN] [TRIPWIRE] Scanning PR #${prPayload.number} in ${prPayload.repository.full_name}`);

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
            console.log(`[WARN] [TRIPWIRE] No active installation found for ${prPayload.repository.full_name}`);
            return NextResponse.json({ message: 'No installation found' });
        }

        // Get user's GitHub access token
        const githubConnection = await prisma.githubConnection.findFirst({
            where: { user_id: installation.user_id },
            include: { user: true }
        });

        if (!githubConnection?.github_oauth_token) {
            console.error(`[ERROR] [TRIPWIRE] No GitHub token for user ${installation.user_id} (${installation.user.email})`);
            return NextResponse.json(
                { error: 'GitHub token not found' },
                { status: 500 }
            );
        }

        console.log(`[TRIPWIRE] Using credentials for user: ${installation.user.email}`);

        // SECURITY: Decrypt the stored GitHub token before use
        let decryptedToken: string;
        try {
            decryptedToken = decrypt(githubConnection.github_oauth_token);
        } catch (decryptError) {
            console.error(`[ERROR] [TRIPWIRE] Failed to decrypt GitHub token for user ${installation.user_id}`);
            return NextResponse.json(
                { error: 'Failed to access GitHub credentials' },
                { status: 500 }
            );
        }

        // 1. Fetch PR Diff using the API URL (not the web diff_url)
        // The web diff_url (https://github.com/...) often fails with Bearer auth for private repos
        // The API URL (https://api.github.com/...) reliably accepts the token
        const apiUrl = prPayload.pull_request.url || `https://api.github.com/repos/${prPayload.repository.full_name}/pulls/${prPayload.number}`;

        const diffText = await fetchPRDiff(
            apiUrl,
            decryptedToken
        );

        // 2. Parse Diff into files
        const fileChanges = parseDiff(diffText);

        // 3. Run Tripwire Engine (Deterministic / Keyword)
        let tripwireResult = scanDiffs(fileChanges);

        console.log(`[FAST] [TRIPWIRE] Fast Scan Result: Run=${tripwireResult.triggered}, Risks=${tripwireResult.detections.length}, Highest=${tripwireResult.highest_risk}`);

        // 3.5 Intelligent Guardian (LLM Analysis)
        // Run if:
        // A) Tripwire was triggered (files are relevant)
        // B) Tripwire did NOT find UNACCEPTABLE risk (if it did, we are blocking anyway, no need to waste tokens)
        if (tripwireResult.triggered && tripwireResult.highest_risk !== 'UNACCEPTABLE') {
            console.log(`[LLM] [GUARDIAN] Running Intelligent Analysis on Diff...`);

            const fileNames = fileChanges.map(f => f.filename);
            const llmResult = await analyzeDiffWithLLM(diffText, fileNames);

            if (llmResult.risk_found && llmResult.risk_tier !== 'NONE' && llmResult.risk_tier !== 'MINIMAL_RISK') {
                console.log(`[ALERT] [GUARDIAN] LLM Detected Hidden Risk: ${llmResult.risk_tier}`);
                console.log(`   Reason: ${llmResult.reasoning}`);

                // Upgrade the result!
                tripwireResult.risk_found = true;

                // Only upgrade if LLM risk is higher (severity check)
                const severity: Record<string, number> = { 'UNACCEPTABLE': 3, 'HIGH_RISK': 2, 'LIMITED_RISK': 1, 'MINIMAL_RISK': 0, 'NONE': -1 };
                const currentSeverity = severity[tripwireResult.highest_risk || 'MINIMAL_RISK'] || 0;
                const newSeverity = severity[llmResult.risk_tier] || 0;

                if (newSeverity > currentSeverity) {
                    tripwireResult.highest_risk = llmResult.risk_tier as any;
                }

                // Add LLM detection to the list so it shows largely in the comment
                tripwireResult.detections.push({
                    file: 'GUARDIAN_AI_ANALYSIS',
                    risk: llmResult.risk_tier as any,
                    category: 'Intelligent Risk Detection',
                    heuristic_match: 'LLM_ANALYSIS',
                    constraint_id: 'guardian_override',
                    snippet: `${llmResult.reasoning}\n\nFlagged: ${llmResult.flagged_snippets.join(', ')}`
                });
            } else {
                console.log(`[SUCCESS] [GUARDIAN] LLM confirmed no additional risks.`);
            }
        }

        console.log(`[SUCCESS] [FINAL RESULT] Risk=${tripwireResult.highest_risk}, Blocked=${tripwireResult.highest_risk === 'UNACCEPTABLE'}`);

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
                decryptedToken
            );
            console.log(`[MSG] [TRIPWIRE] Posted comment on PR #${prPayload.number}`);
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
