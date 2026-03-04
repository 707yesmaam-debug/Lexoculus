import { createServerClient } from '@/lib/infra/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard/scanner';

    if (code) {
        const supabase = await createServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${requestUrl.origin}${next}`);
        } else {
            console.error('[AUTH CALLBACK] Exchange error:', error);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_code_error`);
}
