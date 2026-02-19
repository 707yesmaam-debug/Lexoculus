import { NextRequest, NextResponse } from 'next/server';
import { sendEnterpriseInquiryNotification } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const inquirySchema = z.object({
    full_name: z.string().min(2),
    work_email: z.string().email(),
    company_name: z.string().min(2),
    company_size: z.string(),
    role: z.string().optional(),
    message: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = inquirySchema.parse(body);

        // 1. Save to Database (Fail-safe)
        let inquiryId;
        try {
            const record = await prisma.enterpriseInquiry.create({
                data: {
                    full_name: validated.full_name,
                    work_email: validated.work_email,
                    company: validated.company_name,
                    team_size: validated.company_size,
                    role: validated.role,
                    message: validated.message,
                    status: 'new'
                }
            });
            inquiryId = record.id;
        } catch (dbError) {
            console.error('Failed to save enterprise inquiry to DB:', dbError);
            // We continue to try sending email even if DB fails, though unlikely
        }

        // 2. Send Email Notification
        const success = await sendEnterpriseInquiryNotification({
            full_name: validated.full_name,
            work_email: validated.work_email,
            company_name: validated.company_name,
            company_size: validated.company_size,
            role: validated.role,
            use_case: validated.message || 'Enterprise Inquiry from Pricing Page'
        });

        if (!success) {
            console.error('Failed to send email for enterprise inquiry');
            // We still return success to the user to avoid discouraging them, 
            // but log the error. In a real production system, we might want to 
            // store this in the DB as a fallback.
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Enterprise inquiry error:', error);
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        );
    }
}
