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
            // Fetch the user to determine where to redirect
            const { data: { user } } = await supabase.auth.getUser();
            const accountType = user?.user_metadata?.account_type || 'individual';
            
            // If 'next' is not provided, use the appropriate platform root
            let redirectUrl = next;
            if (next === '/dashboard/scanner') {
                redirectUrl = accountType === 'firm' ? '/firm/clients' : '/dashboard/scanner';
            }

            return NextResponse.redirect(`${requestUrl.origin}${redirectUrl}`);
        } else {
            console.error('[AUTH CALLBACK] Exchange error:', error);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_code_error`);
}
