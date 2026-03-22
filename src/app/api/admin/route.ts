/**
 * Admin API
 * 
 * Protected endpoints for platform administration.
 * Only accessible by ADMIN_EMAIL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/platform/admin';
import prisma from '@/lib/infra/prisma';
import { grantProSubscription, revokeElevatedSubscription, TIER_LIMITS, createFirmCheckoutSession } from '@/lib/platform/subscription';
import logger from '@/lib/infra/logger';

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
                totalFirms,
                totalFirmClients,
            ] = await Promise.all([
                prisma.user.count(),
                prisma.repoScan.count(),
                prisma.pRScan.count(),
                prisma.complianceReport.count(),
                prisma.subscription.count({ where: { tier: 'pro' } }),
                prisma.gitHubActionInstall.count({ where: { status: 'active' } }),
                prisma.feedback.count(),
                prisma.firm.count(),
                prisma.firmClient.count(),
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
                    total_firms: totalFirms,
                    total_firm_clients: totalFirmClients,
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

        // Leads (Unified Enterprise Inquiries & Demo Requests)
        if (section === 'leads') {
            const [enterpriseLeads, demoRequests] = await Promise.all([
                prisma.enterpriseInquiry.findMany({
                    orderBy: { created_at: 'desc' },
                    take: 50
                }),
                prisma.demoRequest.findMany({
                    orderBy: { created_at: 'desc' },
                    take: 50
                })
            ]);

            // Normalize and merge
            const unifiedLeads = [
                ...enterpriseLeads.map((l) => ({
                    id: l.id,
                    type: 'enterprise' as const,
                    full_name: l.full_name,
                    work_email: l.work_email,
                    company: l.company,
                    team_size: l.team_size,
                    role: l.role,
                    message: l.message,
                    status: l.status,
                    created_at: l.created_at
                })),
                ...demoRequests.map((r) => ({
                    id: r.id,
                    type: 'demo' as const,
                    full_name: r.full_name,
                    work_email: r.work_email,
                    company: r.company_name,
                    team_size: r.company_size,
                    role: r.role,
                    message: r.use_case,
                    status: r.status,
                    created_at: r.created_at
                }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            return NextResponse.json({
                leads: unifiedLeads.slice(0, 100), // Cap internal list
                count: unifiedLeads.length,
            });
        }

        // GitHub Action Installs
        if (section === 'github_installs') {
            const installs = await prisma.gitHubActionInstall.findMany({
                orderBy: { installed_at: 'desc' },
                include: {
                    user: { select: { email: true } },
                },
            });

            // Get PR scan counts for these repos
            const repoNames = installs.map(i => i.repo_full_name);
            const prCounts = await prisma.pRScan.groupBy({
                by: ['repo_full_name'],
                where: {
                    repo_full_name: { in: repoNames }
                },
                _count: {
                    _all: true
                }
            });

            const countMap = new Map(prCounts.map(c => [c.repo_full_name, c._count._all]));

            return NextResponse.json({
                installs: installs.map(i => ({
                    ...i,
                    _count: { pr_scans: countMap.get(i.repo_full_name) || 0 }
                })),
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

        // Firms section
        if (section === 'firms') {
            const firms = await prisma.firm.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    members: {
                        include: {
                            user: {
                                select: { email: true, full_name: true },
                                
                            },
                        },
                    },
                    clients: {
                        select: {
                            id: true,
                            client_name: true,
                            status: true,
                        },
                    },
                },
            });

            // Get subscriptions for all firm users
            const firmUserIds = firms.flatMap((f: any) => f.members.map((m: any) => m.user_id));
            const firmSubscriptions = await prisma.subscription.findMany({
                where: { user_id: { in: firmUserIds } },
                select: { user_id: true, status: true, tier: true, client_limit: true },
            });
            const subMap = new Map(firmSubscriptions.map((s: any) => [s.user_id, s]));

            return NextResponse.json({
                firms: firms.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    created_at: f.created_at,
                    members: f.members.map((m: any) => ({
                        user_id: m.user_id,
                        email: m.user.email,
                        full_name: m.user.full_name,
                        role: m.role,
                        subscription: subMap.get(m.user_id) || null,
                    })),
                    clients: f.clients,
                    client_count: f.clients.length,
                })),
                count: firms.length,
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

        // Generate Firm Payment Link
        if (action === 'generate_firm_link') {
            const { seats } = body;
            const firmEmail = user_email;
            const seatCount = parseInt(seats) || 1;

            if (!firmEmail) {
                return NextResponse.json({ error: 'user_email is required' }, { status: 400 });
            }

            const firmUser = await prisma.user.findUnique({ where: { email: firmEmail } });
            if (!firmUser) {
                return NextResponse.json({ error: `No user found with email: ${firmEmail}` }, { status: 404 });
            }

            const { user: adminUser } = await checkAdminAccess();
            logger.info({
                event: 'admin_generate_firm_link',
                admin: adminUser?.email,
                target: firmEmail,
                seats: seatCount
            }, `🟢 [ADMIN AUDIT] Firm payment link generated by ${adminUser?.email}`);

            const { url, error: checkoutError } = await createFirmCheckoutSession(
                firmUser.id,
                firmUser.email,
                seatCount,
                firmUser.full_name || undefined
            );

            if (checkoutError || !url) {
                return NextResponse.json({ error: checkoutError || 'Failed to create checkout link' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                payment_url: url,
                message: `Payment link generated for ${firmEmail} (${seatCount} seats)`,
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
