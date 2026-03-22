import { createServerClient } from '@/lib/infra/supabase-server';
import { prisma } from '@/lib/infra/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendOnboardingEmail } from '@/lib/email/sender';

export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { client_name, client_email } = body;

        if (!client_name) {
            return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
        }

        // Ensure user is part of a firm
        const firmMember = await (prisma as any).firmMember.findUnique({
            where: { user_id: user.id },
            include: { firm: true }
        });

        if (!firmMember) {
            return NextResponse.json({ error: 'User is not associated with a firm' }, { status: 403 });
        }

        // Check Client Capacity Limits
        const subscription = await (prisma as any).subscription.findUnique({
            where: { user_id: user.id }
        });

        const currentClientCount = await (prisma as any).firmClient.count({
            where: { firm_id: (firmMember as any).firm_id }
        });

        const clientLimit = (subscription as any)?.client_limit || 0;

        if ((subscription as any)?.status !== 'active' || currentClientCount >= clientLimit) {
            return NextResponse.json({ 
                error: 'Capacity Limit Reached', 
                message: `Your firm is limited to ${clientLimit} clients. Please contact your account manager to purchase additional seats.`,
                capacity_reached: true
            }, { status: 402 }); // 402 Payment Required
        }

        // Generate a secure random token for onboarding
        const onboardingToken = crypto.randomBytes(32).toString('hex');
        
        // Calculate expiration (48 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        // Create the firm client record
        const newClient = await (prisma as any).firmClient.create({
            data: {
                firm_id: firmMember.firm_id,
                client_name,
                client_email,
                status: 'pending',
                onboard_token: onboardingToken,
                onboard_token_expires: expiresAt,
            }
        });

        // The exact URL depends on the environment
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const onboardingUrl = `${baseUrl}/onboard/${onboardingToken}`;

        // Send email using Nodemailer if client_email is provided
        if (client_email) {
            await sendOnboardingEmail({
                to: client_email,
                clientName: client_name,
                firmName: firmMember.firm.name,
                onboardingUrl,
            });
        }

        return NextResponse.json({ 
            success: true, 
            client: newClient,
            onboarding_url: onboardingUrl
        });
        
    } catch (error) {
        console.error('Error creating firm client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
