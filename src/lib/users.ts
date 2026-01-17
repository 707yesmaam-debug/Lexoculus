import prisma from './prisma';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Ensures a user exists in the public schema (Prisma) to satisfy foreign key constraints.
 * Syncs basic data from Supabase Auth.
 */
export async function ensureUserExists(supabaseUser: SupabaseUser) {
    if (!supabaseUser.email) return;

    try {
        await prisma.user.upsert({
            where: { id: supabaseUser.id },
            create: {
                id: supabaseUser.id,
                email: supabaseUser.email,
                full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
            },
            update: {
                // Keep email in sync if it changes in Auth
                email: supabaseUser.email,
                updated_at: new Date(),
            }
        });
    } catch (error) {
        console.error('Failed to ensure user exists:', error);
        // Don't throw - maybe it exists and this was a race condition, or DB issue.
        // If it really failed, the subsequent FK operations will fail anyway and get caught there.
    }
}
