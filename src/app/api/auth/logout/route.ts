import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase-server';

export async function POST() {
    try {
        const supabase = await createServerClient();

        // Sign out from Supabase Auth
        // This revokes the session and clears the HttpOnly cookies via the CookieStore
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Also clear the GitHub OAuth state cookie if it exists
        const cookieStore = await cookies();
        cookieStore.delete('github_oauth_state');

        // Return success with instructions for client-side cleanup
        return NextResponse.json({
            message: 'Logged out successfully',
            clearStorage: true // Signal to client to clear localStorage
        });
    } catch (error) {
        console.error('Logout failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
