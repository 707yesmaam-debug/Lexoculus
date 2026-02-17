'use server';

import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

export interface PRScanResult {
    id: string;
    repo_full_name: string;
    pr_number: number;
    pr_title: string;
    pr_url: string;
    risk_level: string;
    scanned_at: Date | null;
    blocked: boolean | null;
    comment_posted: boolean | null;
}

export async function getRecentPRScans(limit: number = 20): Promise<{ scans: PRScanResult[], error?: string }> {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { scans: [], error: 'Unauthorized' };
        }

        const scans = await prisma.pRScan.findMany({
            where: {
                user_id: user.id
            },
            take: limit,
            orderBy: {
                scanned_at: 'desc'
            },
            select: {
                id: true,
                repo_full_name: true,
                pr_number: true,
                pr_title: true,
                pr_url: true,
                risk_level: true,
                scanned_at: true,
                blocked: true,
                comment_posted: true
            }
        });

        return { scans };
    } catch (error) {
        console.error('Failed to fetch PR scans:', error);
        return { scans: [], error: 'Failed to fetch PR scans' };
    }
}
