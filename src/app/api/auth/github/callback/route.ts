import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, getUserInfo } from '@/lib/github';
import { encrypt } from '@/lib/encryption';
import prisma from '@/lib/prisma';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle GitHub OAuth errors
    if (error) {
        console.error('GitHub OAuth error:', error);
        return NextResponse.redirect(
            `${appUrl}/dashboard/scanner?error=github_denied`
        );
    }

    // Validate required params
    if (!code || !state) {
        return NextResponse.redirect(
            `${appUrl}/dashboard/scanner?error=invalid_request`
        );
    }

    // Validate CSRF state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('github_oauth_state')?.value;

    if (!storedState || storedState !== state) {
        console.error('CSRF state mismatch');
        return NextResponse.redirect(
            `${appUrl}/dashboard/scanner?error=invalid_state`
        );
    }

    // Clear the state cookie
    cookieStore.delete('github_oauth_state');

    try {
        // Exchange code for token
        const accessToken = await exchangeCodeForToken(code);

        // Get GitHub user info
        const githubUser = await getUserInfo(accessToken);

        // Get current authenticated user using server client
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('No authenticated user found');
            return NextResponse.redirect(
                `${appUrl}/auth/login?error=not_authenticated`
            );
        }

        // Encrypt the token before storing
        const encryptedToken = encrypt(accessToken);

        // Ensure user exists in our users table (create if they don't)
        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email || '',
                updated_at: new Date(),
            },
            create: {
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || null,
            },
        });

        // Upsert GitHub connection (update if exists, create if not)
        await prisma.githubConnection.upsert({
            where: {
                user_id_github_username: {
                    user_id: user.id,
                    github_username: githubUser.login,
                },
            },
            update: {
                github_oauth_token: encryptedToken,
                last_refreshed_at: new Date(),
            },
            create: {
                user_id: user.id,
                github_username: githubUser.login,
                github_oauth_token: encryptedToken,
                connected_at: new Date(),
            },
        });

        // Success - redirect to scanner
        return NextResponse.redirect(`${appUrl}/dashboard/scanner?connected=true`);

    } catch (err) {
        console.error('GitHub OAuth callback error:', err);
        return NextResponse.redirect(
            `${appUrl}/dashboard/scanner?error=oauth_failed`
        );
    }
}
