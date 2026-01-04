import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/repo-scans/:id
 * 
 * Fetch raw scan data from Feature 1 for analysis
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Authenticate user
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Fetch repo scan
        const repoScan = await prisma.repoScan.findUnique({
            where: { id },
            include: {
                llm_analysis: true, // Include existing analysis if any
            },
        });

        if (!repoScan) {
            return NextResponse.json(
                { error: 'Repo scan not found' },
                { status: 404 }
            );
        }

        // 3. Verify ownership
        if (repoScan.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - you do not own this scan' },
                { status: 401 }
            );
        }

        // 4. Return scan data
        return NextResponse.json({
            repo_scan_id: repoScan.id,
            repo_name: repoScan.repo_name,
            repo_owner: repoScan.repo_owner,
            repo_description: repoScan.repo_description,
            readme_content: repoScan.readme_content,
            package_json_content: repoScan.package_json_content,
            requirements_txt_content: repoScan.requirements_txt_content,
            pyproject_toml_content: repoScan.pyproject_toml_content,
            file_tree: repoScan.file_tree,
            primary_language: repoScan.primary_language,
            license_type: repoScan.license_type,
            total_files: repoScan.total_files,
            scanned_at: repoScan.scanned_at,
            has_analysis: !!repoScan.llm_analysis,
            analysis_id: repoScan.llm_analysis?.id || null,
        });

    } catch (error) {
        console.error('Fetch repo scan error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch repo scan' },
            { status: 500 }
        );
    }
}
