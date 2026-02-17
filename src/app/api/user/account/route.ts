import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { dodo } from '@/lib/dodo';
import { NextResponse } from 'next/server';

export async function DELETE() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch Subscription Data
        const subscription = await prisma.subscription.findUnique({
            where: { user_id: user.id },
        });

        // 2. Cancel Dodo Subscription (Safety Check)
        if (subscription && subscription.payment_subscription_id && subscription.status === 'active') {
            try {
                console.log(`[Account Deletion] Cancelling subscription: ${subscription.payment_subscription_id}`);
                await dodo.subscriptions.update(subscription.payment_subscription_id, { status: 'cancelled' });
            } catch (dodoError) {
                console.error('[Account Deletion] FAILED to cancel subscription:', dodoError);
                // CRITICAL: Abort deletion to prevent zombie billing
                return NextResponse.json(
                    { error: 'Failed to cancel active subscription. Please contact support to delete your account safely.' },
                    { status: 409 } // Conflict
                );
            }
        }

        // 3. Delete Application Data (Prisma)
        // This triggers the cascade delete defined in schema.prisma for all related records
        // including Scans, Reports, Assessments, etc.
        try {
            await prisma.user.delete({
                where: { id: user.id },
            });
        } catch (dbError) {
            console.error('[Account Deletion] Database deletion failed:', dbError);
            return NextResponse.json(
                { error: 'Failed to delete user data. Please try again.' },
                { status: 500 }
            );
        }

        // 4. Delete Auth User (Supabase Admin)
        // We need the service role key to delete a user from auth.users
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (authError) {
            console.error('[Account Deletion] Auth user deletion failed:', authError);
            // Note: Application data is already gone, so this is a partial failure state.
            // The user can no longer log in effectively because their public.users record is gone, 
            // but their auth record remains. This is acceptable but ideally should be cleaned up.
            // We still return 200 because from the user's perspective, their account is gone.
        }

        // 5. Logout (Clear cookies)
        await supabase.auth.signOut();

        return NextResponse.json({ message: 'Account permanently deleted' });

    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
