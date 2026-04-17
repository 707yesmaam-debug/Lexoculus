import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/platform/email';
import logger from '@/lib/infra/logger';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        console.log('[RESET-PASSWORD] Received request for:', email);

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRole) {
            logger.error('Missing Supabase credentials for admin link generation');
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRole, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        console.log('[RESET-PASSWORD] Supabase admin client initializing for:', email);

        // Generate the recovery link
        // This admin call can sometimes hang if the Supabase connection is unstable
        console.log('[RESET-PASSWORD] Triggering supabase.auth.admin.generateLink...');
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                redirectTo: `${appUrl}/auth/update-password`,
            }
        });

        if (error) {
            console.error('[RESET-PASSWORD] Auth admin link generation failed:', error.message);
            logger.error({ err: error, email }, 'Failed to generate recovery link');
            // We shouldn't leak whether the email exists or not to prevent user enumeration
            return NextResponse.json({ success: true });
        }

        console.log('[RESET-PASSWORD] Generation successful, properties:', !!data.properties);

        const actionLink = data.properties?.action_link;

        if (!actionLink) {
            logger.error({ email }, 'Generated link is empty');
            return NextResponse.json({ success: true });
        }

        console.log('[RESET-PASSWORD] Link generated successfully, sending email...');
        // Send the email using our custom SMTP
        const emailSent = await sendPasswordResetEmail(email, actionLink);

        if (!emailSent) {
            logger.error({ email }, 'Failed to send recovery email via custom SMTP');
            return NextResponse.json(
                { error: 'Failed to send recovery email' },
                { status: 500 }
            );
        }

        console.log('[RESET-PASSWORD] All steps completed successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ err: error }, 'Error in password reset route');
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
