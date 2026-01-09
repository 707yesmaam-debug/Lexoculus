/**
 * Supabase Storage Utility
 * 
 * Handles file upload/download/delete for compliance reports
 * Files stored in Supabase Storage bucket: compliance-reports
 */

import { createClient } from '@supabase/supabase-js';

// Use service role key for backend operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = 'compliance-reports';

/**
 * Upload report PDF to Supabase Storage
 * Files stored in: userId/reportId.pdf (RLS requires userId in path)
 */
export async function uploadReportToSupabase(
    pdfBuffer: Buffer,
    userId: string,
    reportId: string,
    fileName: string
): Promise<{ url: string; path: string; size: number }> {
    // File path MUST include userId for RLS policies to work
    const filePath = `${userId}/${reportId}.pdf`;

    console.log(`[Storage] Uploading ${fileName} (${pdfBuffer.length} bytes)`);

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600', // Cache for 1 hour
            upsert: false, // Don't overwrite if exists
        });

    if (error) {
        console.error('[Storage] Upload error:', error);
        throw new Error(`Failed to upload report: ${error.message}`);
    }

    console.log(`[Storage] Upload successful: ${filePath}`);

    // Generate signed URL valid for 7 days
    const { data: urlData, error: signError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 604800); // 604800 seconds = 7 days

    if (signError) {
        console.error('[Storage] Signed URL error:', signError);
        throw new Error(`Failed to generate download URL: ${signError.message}`);
    }

    return {
        url: urlData?.signedUrl || '',
        path: filePath,
        size: pdfBuffer.length,
    };
}

/**
 * Upload evidence file to Supabase Storage
 * Files stored in: userId/evidence/assessmentId/filename
 */
export async function uploadEvidenceToSupabase(
    fileBuffer: Buffer,
    userId: string,
    assessmentId: string,
    fileName: string,
    contentType: string
): Promise<{ url: string; path: string }> {
    // Sanitize filename
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/evidence/${assessmentId}/${safeName}`;

    console.log(`[Storage] Uploading Evidence: ${filePath}`);

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
            contentType,
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('[Storage] Canvas Upload error:', error);
        throw new Error(`Failed to upload evidence: ${error.message}`);
    }

    // Generate signed URL (7 days)
    const { data: urlData, error: signError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 604800);

    if (signError) {
        throw new Error(`Failed to generate URL: ${signError.message}`);
    }

    return {
        url: urlData?.signedUrl || '',
        path: filePath,
    };
}

/**
 * Delete report from Supabase Storage
 * Called when user deletes report or cleanup job runs
 */
export async function deleteReportFromSupabase(
    userId: string,
    reportId: string
): Promise<void> {
    const filePath = `${userId}/${reportId}.pdf`;

    console.log(`[Storage] Deleting ${filePath}`);

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (error) {
        console.error('[Storage] Delete error:', error);
        // Don't throw - cleanup failure shouldn't block user action
        return;
    }

    console.log(`[Storage] Delete successful: ${filePath}`);
}

/**
 * Generate fresh signed URL for downloading
 * Used when user clicks download button
 */
export async function getReportDownloadUrl(
    userId: string,
    reportId: string,
    expiresIn: number = 3600 // 1 hour default
): Promise<string> {
    const filePath = `${userId}/${reportId}.pdf`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

    if (error) {
        console.error('[Storage] Download URL error:', error);
        throw new Error(`Failed to get download URL: ${error.message}`);
    }

    return data.signedUrl;
}

/**
 * Check storage usage to stay under 1GB free tier limit
 * Used in monitoring dashboard
 */
export async function checkStorageUsage(): Promise<{
    used: number;
    limit: number;
    percentage: number;
    canStore: boolean;
}> {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list();

        if (error) {
            console.error('[Storage] Usage check error:', error);
            return {
                used: 0,
                limit: 1073741824, // 1 GB in bytes
                percentage: 0,
                canStore: true,
            };
        }

        // Sum file sizes from all user folders
        let totalSize = 0;

        // List is at root level - need to iterate folders
        for (const folder of data || []) {
            if (folder.id) {
                const { data: files } = await supabase.storage
                    .from(BUCKET_NAME)
                    .list(folder.name);

                for (const file of files || []) {
                    totalSize += file.metadata?.size || 0;
                }
            }
        }

        const limit = 1073741824; // 1 GB in bytes
        const percentage = (totalSize / limit) * 100;
        const canStore = percentage < 90; // Warn at 90%

        return {
            used: totalSize,
            limit,
            percentage,
            canStore,
        };
    } catch (error) {
        console.error('[Storage] Unexpected error in usage check:', error);
        return {
            used: 0,
            limit: 1073741824,
            percentage: 0,
            canStore: true,
        };
    }
}

/**
 * List all reports for a user (for ReportHistory)
 */
export async function listUserReports(userId: string): Promise<
    Array<{ name: string; size: number; created: string }>
> {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(userId); // List files in userId folder

    if (error) {
        console.error('[Storage] List error:', error);
        return [];
    }

    return (data || []).map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        created: file.created_at || '',
    }));
}
