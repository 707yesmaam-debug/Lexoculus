import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if needed
    // Optimized: Use getSession() instead of getUser() to rely on cookies and avoid DB roundtrips when possible
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    // Geo-Location Pricing Logic REMOVED - Single Currency (EUR) Enforced
    // Vercel populates 'x-vercel-ip-country' with the 2-letter country code
    // const country = request.headers.get('x-vercel-ip-country');

    // Protect dashboard routes (Individual)
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            return NextResponse.redirect(url);
        }
        
        // Prevent firm accounts from accessing individual dashboard
        const accountType = user.user_metadata?.account_type || 'individual';
        if (accountType === 'firm') {
            const url = request.nextUrl.clone();
            url.pathname = '/firm/clients';
            return NextResponse.redirect(url);
        }
    }
 
    // Protect firm routes
    if (request.nextUrl.pathname.startsWith('/firm')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            return NextResponse.redirect(url);
        }

        // Prevent individual accounts from accessing law firm platform
        const accountType = user.user_metadata?.account_type || 'individual';
        if (accountType === 'individual') {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard/scanner';
            return NextResponse.redirect(url);
        }
    }

    // Redirect logged-in users from auth pages to dashboard, EXCEPT when they are updating their password
    if (request.nextUrl.pathname.startsWith('/auth')) {
        const isExcluded = 
            request.nextUrl.pathname.startsWith('/auth/update-password') || 
            request.nextUrl.pathname.startsWith('/auth/reset-password') || 
            request.nextUrl.pathname.startsWith('/auth/callback') ||
            request.nextUrl.pathname === '/auth/login';

        if (user && !isExcluded) {
            const accountType = user.user_metadata?.account_type || 'individual';
            const url = request.nextUrl.clone();
            url.pathname = accountType === 'firm' ? '/firm/clients' : '/dashboard/scanner';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (handled separately)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
