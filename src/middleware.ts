import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPricingForRegion } from './lib/pricing-config';

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
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Geo-Location Pricing Logic
    // Vercel populates 'x-vercel-ip-country' with the 2-letter country code
    const country = request.headers.get('x-vercel-ip-country');

    // Only set the cookie if it doesn't exist to allow for server-side pricing on first load
    if (country && !request.cookies.has('pricing_region')) {
        const { region } = getPricingForRegion(country);
        supabaseResponse.cookies.set('pricing_region', region, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: 'lax',
        });
    }

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            return NextResponse.redirect(url);
        }
    }

    // Redirect logged-in users from auth pages to dashboard
    if (request.nextUrl.pathname.startsWith('/auth')) {
        if (user) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard/scanner';
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
