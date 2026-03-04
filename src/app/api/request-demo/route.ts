/**
 * POST /api/request-demo
 * 
 * Handles demo request form submissions.
 * Stores in DB + sends email notification to founder.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/infra/prisma';
import { sendDemoRequestNotification } from '@/lib/platform/email';
import logger from '@/lib/infra/logger';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { full_name, work_email, company_name, company_size, role, use_case } = body;

        // ─── VALIDATION ──────────────────────────────────────────────
        const errors: string[] = [];

        if (!full_name?.trim()) errors.push('Full name is required');
        if (!work_email?.trim()) errors.push('Work email is required');
        if (!company_name?.trim()) errors.push('Company name is required');
        if (!company_size?.trim()) errors.push('Company size is required');

        // Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (work_email && !emailRegex.test(work_email)) {
            errors.push('Please enter a valid email address');
        }

        // Block personal email domains
        const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'proton.me'];
        if (work_email) {
            const domain = work_email.split('@')[1]?.toLowerCase();
            if (personalDomains.includes(domain)) {
                errors.push('Please use your work email address');
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors[0], errors }, { status: 400 });
        }

        // ─── RATE LIMITING (max 3 per email per day) ────────────────
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentRequests = await prisma.demoRequest.count({
            where: {
                work_email: work_email.toLowerCase().trim(),
                created_at: { gte: oneDayAgo },
            },
        });

        if (recentRequests >= 3) {
            return NextResponse.json(
                { error: 'You have already submitted a request. We will be in touch shortly.' },
                { status: 429 }
            );
        }

        // ─── STORE IN DB ────────────────────────────────────────────
        const demoRequest = await prisma.demoRequest.create({
            data: {
                full_name: full_name.trim(),
                work_email: work_email.toLowerCase().trim(),
                company_name: company_name.trim(),
                company_size,
                role: role || null,
                use_case: use_case || null,
                ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
                user_agent: request.headers.get('user-agent') || null,
                referrer: request.headers.get('referer') || null,
            },
        });

        logger.info({ event: 'demo_request', id: demoRequest.id, email: work_email },
            `[TARGET] [LEAD] New demo request from ${full_name} (${company_name})`);

        // ─── EMAIL NOTIFICATION (async, don't block response) ───────
        sendDemoRequestNotification({
            full_name: full_name.trim(),
            work_email: work_email.toLowerCase().trim(),
            company_name: company_name.trim(),
            company_size,
            role,
            use_case,
        }).catch((err) => {
            logger.error({ err, event: 'email_error' }, 'Failed to send demo request email');
        });

        return NextResponse.json({
            success: true,
            message: 'Demo request received. We will be in touch within 24 hours.',
        });

    } catch (error) {
        logger.error({ err: error }, 'Demo request API error');
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
