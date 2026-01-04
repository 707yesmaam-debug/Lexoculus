import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGitHubAuthUrl } from '@/lib/github';
import crypto from 'crypto';

export async function GET() {
    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in cookie for validation on callback
    const cookieStore = await cookies();
    cookieStore.set('github_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });

    // Redirect to GitHub OAuth
    const authUrl = getGitHubAuthUrl(state);

    return NextResponse.redirect(authUrl);
}
