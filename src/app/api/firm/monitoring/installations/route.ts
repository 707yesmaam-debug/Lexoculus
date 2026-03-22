import { createServerClient } from '@/lib/infra/supabase-server';
import { prisma } from '@/lib/infra/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const firmMember = await (prisma as any).firmMember.findUnique({
            where: { user_id: user.id },
            include: { firm: true }
        });

        if (!firmMember) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const clients = await (prisma as any).firmClient.findMany({
            where: { firm_id: firmMember.firm_id }
        });

        const clientRepoUrls = clients.map((c: any) => c.github_repo_url).filter(Boolean) as string[];

        // Installations for any of these repos
        const installations = await (prisma as any).gitHubActionInstall.findMany({
            where: {
                repo_full_name: {
                    in: clientRepoUrls.map(url => {
                        const parts = url.split('/');
                        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
                    })
                }
            },
            orderBy: { installed_at: 'desc' }
        });

        return NextResponse.json({
            installations: installations.map((i: any) => ({
                ...i,
                client_name: clients.find((c: any) => c.github_repo_url?.includes(i.repo_full_name))?.client_name || 'Individual'
            })),
            can_enable_integrations: true // Firms always have Pro access
        });

    } catch (error) {
        console.error('Firm installations error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
