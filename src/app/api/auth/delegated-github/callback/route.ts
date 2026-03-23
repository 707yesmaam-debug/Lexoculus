import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/github/github';
import { encrypt } from '@/lib/security/encryption';
import { prisma } from '@/lib/infra/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains our onboarding token
    const error = searchParams.get('error');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (error) {
        console.error('Delegated GitHub OAuth error:', error);
        return NextResponse.redirect(`${appUrl}/onboard/${state}?error=github_denied`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${appUrl}/?error=invalid_request`);
    }

    try {
        // Exchange code for token
        const accessToken = await exchangeCodeForToken(code);

        // Get GitHub user info (who authorized it)
        const githubUser = await getUserInfo(accessToken);

        // Encrypt the token before storing
        const encryptedToken = encrypt(accessToken);

        // Find the client using the onboarding token
        const client = await (prisma as any).firmClient.findUnique({
            where: { onboard_token: state }
        });

        if (!client) {
            console.error('Client not found for token:', state);
            return NextResponse.redirect(`${appUrl}/?error=client_not_found`);
        }

        // Store or update delegated access token and update client status
        await prisma.$transaction(async (tx) => {
            await (tx as any).firmClientAccess.upsert({
                where: { firm_client_id: client.id },
                update: {
                    github_oauth_token: encryptedToken,
                    github_username: githubUser.login,
                    granted_at: new Date(),
                },
                create: {
                    firm_client_id: client.id,
                    github_oauth_token: encryptedToken,
                    github_username: githubUser.login,
                }
            });

            await (tx as any).firmClient.update({
                where: { id: client.id },
                data: {
                    status: 'active',
                    github_repo_url: `${githubUser.login} (Authorized Account)`,
                }
            });
        });

        // Redirect back to the onboarding success page with a flag
        return NextResponse.redirect(`${appUrl}/onboard/${state}?success=reconnected`);

    } catch (err) {
        console.error('Delegated GitHub OAuth callback error:', err);
        return NextResponse.redirect(`${appUrl}/onboard/${state}?error=oauth_failed`);
    }
}
