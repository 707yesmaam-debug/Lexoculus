import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { ensureUserExists } from '@/lib/users';
import prisma from '@/lib/prisma';

const ANONYMOUS_USER_ID = 'anonymous-system-user-0000';

/**
 * POST /api/claim-scan
 * 
 * Transfer ownership of an anonymous scan to an authenticated user.
 * Called after signup when the user has a scan_token in localStorage.
 * 
 * Also increments the user's scan usage since this is now their scan.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please log in to claim your scan' },
                { status: 401 }
            );
        }

        // 1.5 Ensure user exists in Prisma
        await ensureUserExists(user);

        // 2. Get scan_token from request
        const body = await request.json();
        const { scan_token } = body;

        if (!scan_token) {
            return NextResponse.json(
                { error: 'Missing scan_token', message: 'No scan token provided' },
                { status: 400 }
            );
        }

        // 3. Find the anonymous scan
        const repoScan = await prisma.repoScan.findFirst({
            where: {
                scan_token: scan_token,
                user_id: ANONYMOUS_USER_ID,
            },
            include: {
                llm_analysis: true,
                risk_assessment: true,
            },
        });

        if (!repoScan) {
            return NextResponse.json(
                { error: 'Not Found', message: 'Scan not found or already claimed' },
                { status: 404 }
            );
        }

        // 4. Check if expired
        if (repoScan.expires_at && repoScan.expires_at < new Date()) {
            return NextResponse.json(
                { error: 'Expired', message: 'This scan has expired. Please run a new scan.' },
                { status: 410 }
            );
        }

        // 5. Transfer ownership — update all related records
        // 5a. RepoScan
        await prisma.repoScan.update({
            where: { id: repoScan.id },
            data: {
                user_id: user.id,
                scan_token: null, // Clear token — one-time use
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Reset to 30-day standard
            },
        });

        // 5b. LLM Analysis (if exists)
        if (repoScan.llm_analysis) {
            await prisma.llmCapabilityAnalysis.update({
                where: { id: repoScan.llm_analysis.id },
                data: { user_id: user.id },
            });
        }

        // 5c. Risk Assessment (if exists)
        if (repoScan.risk_assessment) {
            await prisma.riskAssessment.update({
                where: { id: repoScan.risk_assessment.id },
                data: { user_id: user.id },
            });
        }

        // 5d. Create AI System entry for the user
        const systemName = repoScan.repo_name;
        const existingSystem = await prisma.aiSystem.findUnique({
            where: {
                user_id_name: {
                    user_id: user.id,
                    name: systemName,
                },
            },
        });

        let aiSystemId: string;
        if (existingSystem) {
            aiSystemId = existingSystem.id;
            await prisma.aiSystem.update({
                where: { id: existingSystem.id },
                data: {
                    latest_scan_id: repoScan.id,
                    source_repo_url: repoScan.github_repo_url,
                    last_scanned_at: new Date(),
                    risk_classification: repoScan.risk_assessment?.risk_classification || null,
                    risk_score: repoScan.risk_assessment?.risk_score || null,
                },
            });
        } else {
            const newSystem = await prisma.aiSystem.create({
                data: {
                    user_id: user.id,
                    name: systemName,
                    description: repoScan.repo_description || null,
                    source_repo_url: repoScan.github_repo_url,
                    latest_scan_id: repoScan.id,
                    last_scanned_at: new Date(),
                    risk_classification: repoScan.risk_assessment?.risk_classification || null,
                    risk_score: repoScan.risk_assessment?.risk_score || null,
                },
            });
            aiSystemId = newSystem.id;
        }

        // 5e. Create scan history entry
        await prisma.aiSystemScan.create({
            data: {
                ai_system_id: aiSystemId,
                repo_scan_id: repoScan.id,
                risk_classification: repoScan.risk_assessment?.risk_classification || null,
                risk_score: repoScan.risk_assessment?.risk_score || null,
            },
        });

        // 5f. Delete the anonymous AI System entry (if it exists)
        try {
            await prisma.aiSystem.deleteMany({
                where: {
                    user_id: ANONYMOUS_USER_ID,
                    name: systemName,
                },
            });
        } catch {
            // Non-fatal
        }

        // 6. Increment the new user's scan usage
        try {
            const { incrementUsage } = await import('@/lib/subscription');
            await incrementUsage(user.id, 'scan');
        } catch {
            // Non-fatal — usage tracking failure shouldn't block claim
        }

        console.log(`✅ [CLAIM] Scan ${repoScan.id} transferred from anonymous to ${user.email}`);

        return NextResponse.json({
            success: true,
            repo_scan_id: repoScan.id,
            repo_name: repoScan.repo_name,
            message: 'Scan claimed successfully',
            has_analysis: !!repoScan.llm_analysis,
            has_risk_assessment: !!repoScan.risk_assessment,
        });

    } catch (error) {
        console.error('❌ [CLAIM] Error:', error);
        return NextResponse.json(
            { error: 'Server Error', message: 'Failed to claim scan' },
            { status: 500 }
        );
    }
}
