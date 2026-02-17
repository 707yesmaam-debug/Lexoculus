import { createServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export async function GET() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                subscription: true,
                _count: {
                    select: {
                        repo_scans: true,
                        compliance_reports: true,
                        risk_assessments: true,
                    }
                }
            }
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            profile: {
                email: dbUser.email,
                full_name: dbUser.full_name,
                created_at: dbUser.created_at,
            },
            subscription: dbUser.subscription ? {
                tier: dbUser.subscription.tier,
                status: dbUser.subscription.status,
                current_period_end: dbUser.subscription.current_period_end,
                limits: {
                    scans: dbUser.subscription.scans_limit,
                    repos: dbUser.subscription.repos_limit,
                },
                usage: {
                    scans: dbUser.subscription.scans_used,
                    repos: dbUser.subscription.repos_used,
                }
            } : null,
            stats: {
                total_scans: dbUser._count.repo_scans,
                total_reports: dbUser._count.compliance_reports,
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validated = updateProfileSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: validated.error.flatten() }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { full_name: validated.data.full_name },
        });

        return NextResponse.json({
            message: 'Profile updated',
            user: {
                full_name: updatedUser.full_name
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
