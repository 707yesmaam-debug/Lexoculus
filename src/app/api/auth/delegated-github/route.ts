import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Missing onboarding token' }, { status: 400 });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/delegated-github/callback`;
    
    // We pass the onboarding token in the 'state' parameter 
    // so we can associate the GitHub callback with the correct FirmClient
    const state = token;
    
    const scope = 'repo'; // We need repo scope for private repos

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&prompt=consent`;

    return NextResponse.redirect(githubAuthUrl);
}
