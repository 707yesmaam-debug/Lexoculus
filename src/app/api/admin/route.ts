/**
 * Admin API
 * 
 * Protected endpoints for platform administration.
 * Only accessible by ADMIN_EMAIL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin';
import prisma from '@/lib/prisma';
import { grantProSubscription, revokeProSubscription, TIER_LIMITS } from '@/lib/subscription';

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
            ] = await Promise.all([
                prisma.user.count(),
                prisma.repoScan.count(),
                prisma.pRScan.count(),
                prisma.complianceReport.count(),
                prisma.subscription.count({ where: { tier: 'pro' } }),
                prisma.gitHubActionInstall.count({ where: { status: 'active' } }),
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
                    mrr: proUsers * 49, // €49/month per Pro user
                },
                recent_scans: recentScans,
            });
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
        console.error('Admin API error:', error);
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
            console.log(`🟢 [ADMIN AUDIT] Pro granted by ${adminUser?.email} to ${user_email || targetUserId} for ${duration_days || 30} days. Reason: ${reason || 'None provided'}`);

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
            console.log(`🟠 [ADMIN AUDIT] Pro revoked by ${adminUser?.email} from ${user_email || targetUserId}`);

            await revokeProSubscription(targetUserId);

            return NextResponse.json({
                success: true,
                message: `Pro revoked from ${user_email || targetUserId}`,
            });
        }

        // Delete user (DANGEROUS - requires confirmation token)
        if (action === 'delete_user') {
            const { confirm_deletion } = body;

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
            console.warn(`🔴 [ADMIN AUDIT] User deletion initiated by admin for user: ${user_email || targetUserId}`);

            await prisma.user.delete({
                where: { id: targetUserId },
            });

            console.warn(`🔴 [ADMIN AUDIT] User ${user_email || targetUserId} permanently deleted`);

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
        console.error('Admin action error:', error);
        return NextResponse.json(
            { error: 'Admin action failed' },
            { status: 500 }
        );
    }
}
