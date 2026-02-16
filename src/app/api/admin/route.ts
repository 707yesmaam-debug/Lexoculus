/**
 * Admin API
 * 
 * Protected endpoints for platform administration.
 * Only accessible by ADMIN_EMAIL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin';
import prisma from '@/lib/prisma';
import { grantProSubscription, revokeElevatedSubscription, TIER_LIMITS } from '@/lib/subscription';
import logger from '@/lib/logger';

/**
 * GET /api/admin
 * 
 * Get admin dashboard data
 */
export async function GET(request: NextRequest) {
    const { isAdmin, error } = await checkAdminAccess();

    if (!isAdmin) {
        return NextResponse.json(
            { error: error || 'Access denied' },
            { status: 403 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const section = searchParams.get('section') || 'overview';

        // Overview stats
        if (section === 'overview') {
            const [
                totalUsers,
                totalScans,
                totalPRScans,
                totalReports,
                proUsers,
                activeInstalls,
                totalFeedback,
            ] = await Promise.all([
                prisma.user.count(),
                prisma.repoScan.count(),
                prisma.pRScan.count(),
                prisma.complianceReport.count(),
                prisma.subscription.count({ where: { tier: 'pro' } }),
                prisma.gitHubActionInstall.count({ where: { status: 'active' } }),
                prisma.feedback.count(),
            ]);

            // Recent activity
            const recentScans = await prisma.repoScan.findMany({
                take: 10,
                orderBy: { scanned_at: 'desc' },
                select: {
                    id: true,
                    repo_name: true,
                    repo_owner: true,
                    scanned_at: true,
                    user: { select: { email: true } },
                },
            });

            return NextResponse.json({
                stats: {
                    total_users: totalUsers,
                    total_scans: totalScans,
                    total_pr_scans: totalPRScans,
                    total_reports: totalReports,
                    pro_users: proUsers,
                    active_github_installs: activeInstalls,
                    total_feedback: totalFeedback,
                    mrr: proUsers * 49, // €49/month per Pro user
                },
                recent_scans: recentScans,
            });
        }

        // Feedback
        if (section === 'feedback') {
            const feedbacks = await prisma.feedback.findMany({
                orderBy: { created_at: 'desc' },
                take: 50,
                include: {
                    user: { select: { email: true } },
                },
            });
            return NextResponse.json({ feedbacks });
        }

        // Users list
        if (section === 'users') {
            const users = await prisma.user.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    subscription: {
                        select: {
                            tier: true,
                            status: true,
                            is_manual_grant: true,
                            current_period_end: true,
                        },
                    },
                    _count: {
                        select: {
                            repo_scans: true,
                            pr_scans: true,
                            compliance_reports: true,
                        },
                    },
                },
            });

            return NextResponse.json({
                users: users.map(u => ({
                    id: u.id,
                    email: u.email,
                    full_name: u.full_name,
                    created_at: u.created_at,
                    subscription: u.subscription,
                    usage: u._count,
                })),
                count: users.length,
            });
        }

        // Subscriptions
        if (section === 'subscriptions') {
            const subscriptions = await prisma.subscription.findMany({
                orderBy: { updated_at: 'desc' },
                include: {
                    user: { select: { email: true, full_name: true } },
                },
            });

            return NextResponse.json({
                subscriptions,
                count: subscriptions.length,
            });
        }

        // GitHub Action Installs
        if (section === 'github_installs') {
            const installs = await prisma.gitHubActionInstall.findMany({
                orderBy: { installed_at: 'desc' },
                include: {
                    user: { select: { email: true } },
                    _count: { select: { pr_scans: true } },
                },
            });

            return NextResponse.json({
                installs,
                count: installs.length,
            });
        }

        // PR Scans
        if (section === 'pr_scans') {
            const prScans = await prisma.pRScan.findMany({
                take: 50,
                orderBy: { scanned_at: 'desc' },
                include: {
                    user: { select: { email: true } },
                },
            });

            return NextResponse.json({
                pr_scans: prScans,
                count: prScans.length,
            });
        }

        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });

    } catch (error) {
        logger.error({ err: error }, 'Admin API error');
        return NextResponse.json(
            { error: 'Failed to fetch admin data' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin
 * 
 * Admin actions: grant/revoke Pro, etc.
 */
export async function POST(request: NextRequest) {
    const { isAdmin, error } = await checkAdminAccess();

    if (!isAdmin) {
        return NextResponse.json(
            { error: error || 'Access denied' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const { action, user_id, user_email, reason, duration_days } = body;

        // Find user by ID or email
        let targetUserId = user_id;
        if (!targetUserId && user_email) {
            const user = await prisma.user.findUnique({
                where: { email: user_email },
            });
            if (!user) {
                return NextResponse.json(
                    { error: `User not found: ${user_email}` },
                    { status: 404 }
                );
            }
            targetUserId = user.id;
        }

        if (!targetUserId) {
            return NextResponse.json(
                { error: 'user_id or user_email required' },
                { status: 400 }
            );
        }

        // Grant Pro
        if (action === 'grant_pro') {
            const { isAdmin: adminCheck, user: adminUser } = await checkAdminAccess();

            // AUDIT: Log subscription changes
            logger.info({
                event: 'admin_grant_pro',
                admin: adminUser?.email,
                target: user_email || targetUserId,
                duration: duration_days || 30,
                reason: reason || 'None provided'
            }, `🟢 [ADMIN AUDIT] Pro granted by ${adminUser?.email}`);

            await grantProSubscription(
                targetUserId,
                reason || 'Granted by admin',
                adminUser?.id || 'admin',
                duration_days || 30
            );

            return NextResponse.json({
                success: true,
                message: `Pro granted to ${user_email || targetUserId} for ${duration_days || 30} days`,
            });
        }

        // Revoke Pro
        if (action === 'revoke_pro') {
            const { user: adminUser } = await checkAdminAccess();

            // AUDIT: Log subscription changes
            logger.info({
                event: 'admin_revoke_pro',
                admin: adminUser?.email,
                target: user_email || targetUserId
            }, `🟠 [ADMIN AUDIT] Pro revoked by ${adminUser?.email}`);

            await revokeElevatedSubscription(targetUserId);

            return NextResponse.json({
                success: true,
                message: `Pro revoked from ${user_email || targetUserId}`,
            });
        }

        // Delete user (DANGEROUS - requires confirmation token)
        if (action === 'delete_user') {
            const { confirm_deletion } = body;
            // Get admin user for audit log
            const { user: adminUser } = await checkAdminAccess();

            // SECURITY: Require explicit confirmation to prevent accidental deletions
            if (confirm_deletion !== 'DELETE_USER_PERMANENTLY') {
                return NextResponse.json(
                    {
                        error: 'Confirmation required',
                        message: 'To delete a user, include confirm_deletion: "DELETE_USER_PERMANENTLY" in your request'
                    },
                    { status: 400 }
                );
            }

            // AUDIT: Log destructive action before execution
            logger.warn({
                event: 'admin_delete_user_init',
                admin: adminUser?.email,
                target: user_email || targetUserId
            }, `🔴 [ADMIN AUDIT] User deletion initiated by admin`);

            await prisma.user.delete({
                where: { id: targetUserId },
            });

            logger.warn({
                event: 'admin_delete_user_complete',
                target: user_email || targetUserId
            }, `🔴 [ADMIN AUDIT] User permanently deleted`);

            return NextResponse.json({
                success: true,
                message: `User ${user_email || targetUserId} permanently deleted`,
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        logger.error({ err: error }, 'Admin action error');
        return NextResponse.json(
            { error: 'Admin action failed' },
            { status: 500 }
        );
    }
}
