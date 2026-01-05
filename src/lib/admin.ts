/**
 * Admin Middleware
 * 
 * Protects admin routes - only allows access to ADMIN_EMAIL
 */

import { createServerClient } from './supabase-server';

// Admin email is set in environment variable for security
// Add ADMIN_EMAIL=your@email.com to .env.local
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export interface AdminCheckResult {
    isAdmin: boolean;
    user: {
        id: string;
        email: string;
    } | null;
    error?: string;
}

/**
 * Check if the current user is an admin
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
    if (!ADMIN_EMAIL) {
        console.error('❌ [ADMIN] ADMIN_EMAIL not configured');
        return {
            isAdmin: false,
            user: null,
            error: 'Admin access not configured',
        };
    }

    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                isAdmin: false,
                user: null,
                error: 'Not authenticated',
            };
        }

        const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        if (!isAdmin) {
            console.warn(`⚠️ [ADMIN] Access denied for ${user.email}`);
        }

        return {
            isAdmin,
            user: {
                id: user.id,
                email: user.email || '',
            },
            error: isAdmin ? undefined : 'Access denied - not an admin',
        };
    } catch (error) {
        console.error('Admin check error:', error);
        return {
            isAdmin: false,
            user: null,
            error: 'Authentication error',
        };
    }
}

/**
 * Get admin email (for display purposes only)
 */
export function getAdminEmail(): string | undefined {
    return ADMIN_EMAIL;
}
