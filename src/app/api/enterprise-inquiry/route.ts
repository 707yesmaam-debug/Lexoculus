import { NextRequest, NextResponse } from 'next/server';
import { sendDemoRequestNotification } from '@/lib/email';
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

        const success = await sendDemoRequestNotification({
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
