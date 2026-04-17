/**
 * Email Notification Utility
 * 
 * Sends notifications to the founder when key events occur (demo requests, etc.)
 * Priority: Uses Resend HTTP API to bypass SMTP restrictions in serverless environments.
 * Fallback: Uses nodemailer with SMTP for non-Resend providers or local dev.
 */

import nodemailer from 'nodemailer';
import logger from '../infra/logger';

const FOUNDER_EMAIL = process.env.LEADS_EMAIL || 'founder@lexoculus.com';
const NO_REPLY_EMAIL = process.env.SMTP_FROM || 'onboarding@lexoculus.com';

/**
 * Universal Email Dispatcher
 * Automatically chooses between Resend HTTP (Port 443) or standard SMTP (Port 587/465)
 */
async function dispatchEmail(options: {
    to: string;
    from: string;
    subject: string;
    html: string;
}): Promise<boolean> {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // SCENARIO 1: Resend HTTP API (Strongly Preferred for Vercel)
    if (host === 'smtp.resend.com' || host?.includes('resend')) {
        try {
            logger.info({ to: options.to, subject: options.subject }, '📧 [EMAIL] Dispatching via Resend HTTP API...');
            
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pass}`
                },
                body: JSON.stringify({
                    from: options.from,
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                logger.error({ errorData, status: response.status }, '📧 [EMAIL] Resend HTTP API failure');
                throw new Error(`Resend API: ${response.status}`);
            }

            logger.info({ to: options.to }, '📧 [EMAIL] Successfully sent via HTTP (Port 443)');
            return true;
        } catch (error) {
            logger.warn({ err: error }, '📧 [EMAIL] HTTP fallback to SMTP...');
            // Proceed to SMTP fallback
        }
    }

    // SCENARIO 2: Nodemailer SMTP (Fallback or local development)
    if (!host || !user || !pass) {
        logger.warn('SMTP credentials not configured. Email skipped.');
        return false;
    }

    const port = parseInt(process.env.SMTP_PORT || '587');
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });

    try {
        await transporter.sendMail({
            from: options.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        logger.info({ to: options.to }, '📧 [EMAIL] Successfully sent via SMTP');
        return true;
    } catch (error) {
        logger.error({ err: error }, '📧 [EMAIL] Final failure in SMTP dispatch');
        return false;
    }
}

interface DemoRequestData {
    full_name: string;
    work_email: string;
    company_name: string;
    company_size: string;
    role?: string;
    use_case?: string;
}

const USE_CASE_LABELS: Record<string, string> = {
    preparing_for_eu_ai_act: 'Preparing for EU AI Act compliance',
    already_under_audit: 'Already under audit / regulatory review',
    evaluating_tools: 'Evaluating compliance tools',
    other: 'Other',
};

export async function sendDemoRequestNotification(data: DemoRequestData): Promise<boolean> {
    const useCaseLabel = data.use_case ? (USE_CASE_LABELS[data.use_case] || data.use_case) : 'Not specified';
    const html = `
    <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 0;">
        <div style="background: #000; color: #fff; padding: 20px 24px; border-bottom: 2px solid #000;">
            <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #FF4F00; margin-bottom: 8px;">NEW DEMO REQUEST</div>
            <div style="font-size: 20px; font-weight: bold;">${data.full_name}</div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">${data.company_name}</div>
        </div>
        <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; width: 120px; vertical-align: top;">NAME</td>
                    <td style="padding: 10px 0; font-weight: bold;">${data.full_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">EMAIL</td>
                    <td style="padding: 10px 0;"><a href="mailto:${data.work_email}" style="color: #FF4F00; text-decoration: none;">${data.work_email}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">COMPANY</td>
                    <td style="padding: 10px 0;">${data.company_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">TEAM SIZE</td>
                    <td style="padding: 10px 0;">${data.company_size} employees</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">USE CASE</td>
                    <td style="padding: 10px 0;">${useCaseLabel}</td>
                </tr>
            </table>
        </div>
        <div style="background: #f5f5f5; padding: 16px 24px; border-top: 2px solid #000; font-size: 10px; color: #999; letter-spacing: 1px; text-transform: uppercase;">
            LexOculus · Lead Capture System · ${new Date().toISOString().split('T')[0]}
        </div>
    </div>`;

    return dispatchEmail({
        to: FOUNDER_EMAIL,
        from: `LexOculus Leads <${NO_REPLY_EMAIL}>`,
        subject: `🔔 New Demo Request — ${data.full_name} (${data.company_name})`,
        html,
    });
}

export async function sendEnterpriseInquiryNotification(data: DemoRequestData): Promise<boolean> {
    const html = `
    <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 0;">
        <div style="background: #000; color: #fff; padding: 20px 24px; border-bottom: 2px solid #000;">
            <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #00ff9d; margin-bottom: 8px;">ENTERPRISE INQUIRY</div>
            <div style="font-size: 20px; font-weight: bold;">${data.full_name}</div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">${data.company_name}</div>
        </div>
        <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; width: 120px; vertical-align: top;">NAME</td>
                    <td style="padding: 10px 0; font-weight: bold;">${data.full_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">EMAIL</td>
                    <td style="padding: 10px 0;"><a href="mailto:${data.work_email}" style="color: #FF4F00; text-decoration: none;">${data.work_email}</a></td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">MESSAGE</td>
                    <td style="padding: 10px 0;">${data.use_case || 'No message'}</td>
                </tr>
            </table>
        </div>
        <div style="background: #f5f5f5; padding: 16px 24px; border-top: 2px solid #000; font-size: 10px; color: #999; letter-spacing: 1px; text-transform: uppercase;">
            LexOculus · Enterprise Sales · ${new Date().toISOString().split('T')[0]}
        </div>
    </div>`;

    return dispatchEmail({
        to: FOUNDER_EMAIL,
        from: `LexOculus Enterprise <${NO_REPLY_EMAIL}>`,
        subject: `💼 Enterprise Inquiry — ${data.company_name}`,
        html,
    });
}

export async function sendPasswordResetEmail(email: string, actionLink: string): Promise<boolean> {
    const html = `
    <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 0;">
        <div style="background: #000; color: #fff; padding: 20px 24px; border-bottom: 2px solid #000;">
            <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #FF4F00; margin-bottom: 8px;">SECURITY PROTOCOL</div>
            <div style="font-size: 20px; font-weight: bold;">Password Reset Request</div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">LexOculus Authentication System</div>
        </div>
        <div style="padding: 24px;">
            <p style="margin-top: 0; font-size: 14px; line-height: 1.6;">A request has been made to reset the password for the account associated with <strong>${email}</strong>.</p>
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">To authenticate and establish a new credential, follow the secure link below:</p>
            <a href="${actionLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #FF4F00;">RESET PASSWORD -></a>
            <p style="font-size: 12px; color: #999; margin-top: 32px; line-height: 1.5;">If you did not initiate this sequence, you may safely ignore this message. The link will expire automatically.</p>
        </div>
        <div style="background: #f5f5f5; padding: 16px 24px; border-top: 2px solid #000; font-size: 10px; color: #999; letter-spacing: 1px; text-transform: uppercase;">
            LexOculus · Access Gateway · ${new Date().toISOString().split('T')[0]}
        </div>
    </div>`;

    return dispatchEmail({
        to: email,
        from: `LexOculus Security <${NO_REPLY_EMAIL}>`,
        subject: `Action Required: Password Reset`,
        html,
    });
}
