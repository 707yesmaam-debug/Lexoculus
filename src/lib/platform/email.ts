/**
 * Email Notification Utility
 * 
 * Sends notifications to the founder when key events occur (demo requests, etc.)
 * Uses nodemailer with SMTP. Configure via environment variables.
 */

import nodemailer from 'nodemailer';
import logger from '../infra/logger';

const FOUNDER_EMAIL = process.env.LEADS_EMAIL || 'founder@lexoculus.com';
const NO_REPLY_EMAIL = process.env.SMTP_FROM || 'onboarding@lexoculus.com';

// Create transporter (fresh per call for serverless compatibility)

function getTransporter(): nodemailer.Transporter | null {

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        logger.warn('SMTP credentials not configured. Email notifications disabled.');
        return null;
    }

    const currentTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });

    logger.info({ host, port }, '📧 [EMAIL] Fresh transporter initialized');

    return currentTransporter;
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

/**
 * Send a demo request notification email to the founder
 */
export async function sendDemoRequestNotification(data: DemoRequestData): Promise<boolean> {
    const mailer = getTransporter();

    if (!mailer) {
        logger.info({ event: 'email_skip', reason: 'no_smtp' },
            `📧 [EMAIL] Skipped notification — SMTP not configured. Lead: ${data.work_email}`);
        return false;
    }

    const useCaseLabel = data.use_case ? (USE_CASE_LABELS[data.use_case] || data.use_case) : 'Not specified';

    const html = `
    <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 0;">
        <!-- Header -->
        <div style="background: #000; color: #fff; padding: 20px 24px; border-bottom: 2px solid #000;">
            <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #FF4F00; margin-bottom: 8px;">
                NEW DEMO REQUEST
            </div>
            <div style="font-size: 20px; font-weight: bold;">
                ${data.full_name}
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
                ${data.company_name}
            </div>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; width: 120px; vertical-align: top;">NAME</td>
                    <td style="padding: 10px 0; font-weight: bold;">${data.full_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">EMAIL</td>
                    <td style="padding: 10px 0;">
                        <a href="mailto:${data.work_email}" style="color: #FF4F00; text-decoration: none;">${data.work_email}</a>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">COMPANY</td>
                    <td style="padding: 10px 0;">${data.company_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">TEAM SIZE</td>
                    <td style="padding: 10px 0;">${data.company_size} employees</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">ROLE</td>
                    <td style="padding: 10px 0;">${data.role || 'Not specified'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">USE CASE</td>
                    <td style="padding: 10px 0;">${useCaseLabel}</td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 16px 24px; border-top: 2px solid #000; font-size: 10px; color: #999; letter-spacing: 1px; text-transform: uppercase;">
            LexOculus · Lead Capture System · ${new Date().toISOString().split('T')[0]}
        </div>
    </div>
    `;

    try {
        await mailer.sendMail({
            from: `"LexOculus Leads" <${NO_REPLY_EMAIL}>`,
            to: FOUNDER_EMAIL,
            subject: `🔔 New Demo Request — ${data.full_name} (${data.company_name})`,
            html,
        });

        logger.info({ event: 'email_sent', to: FOUNDER_EMAIL, lead: data.work_email },
            `📧 [EMAIL] Demo request notification sent for ${data.work_email}`);
        return true;
    } catch (error) {
        logger.error({ err: error, event: 'email_error' },
            `📧 [EMAIL] Failed to send demo request notification`);
        return false;
    }
    // ... existing code ...

}

/**
 * Send an enterprise inquiry notification email to the founder
 */
export async function sendEnterpriseInquiryNotification(data: DemoRequestData): Promise<boolean> {
    const mailer = getTransporter();

    if (!mailer) {
        logger.info({ event: 'email_skip', reason: 'no_smtp' },
            `📧 [EMAIL] Skipped notification — SMTP not configured. Lead: ${data.work_email}`);
        return false;
    }

    const html = `
    <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 0;">
        <!-- Header -->
        <div style="background: #000; color: #fff; padding: 20px 24px; border-bottom: 2px solid #000;">
            <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #00ff9d; margin-bottom: 8px;">
                ENTERPRISE INQUIRY
            </div>
            <div style="font-size: 20px; font-weight: bold;">
                ${data.full_name}
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
                ${data.company_name}
            </div>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; width: 120px; vertical-align: top;">NAME</td>
                    <td style="padding: 10px 0; font-weight: bold;">${data.full_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">EMAIL</td>
                    <td style="padding: 10px 0;">
                        <a href="mailto:${data.work_email}" style="color: #FF4F00; text-decoration: none;">${data.work_email}</a>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">COMPANY</td>
                    <td style="padding: 10px 0;">${data.company_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">TEAM SIZE</td>
                    <td style="padding: 10px 0;">${data.company_size} employees</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">ROLE</td>
                    <td style="padding: 10px 0;">${data.role || 'Not specified'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #999; vertical-align: top;">MESSAGE</td>
                    <td style="padding: 10px 0;">${data.use_case || 'No message'}</td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 16px 24px; border-top: 2px solid #000; font-size: 10px; color: #999; letter-spacing: 1px; text-transform: uppercase;">
            LexOculus · Enterprise Sales · ${new Date().toISOString().split('T')[0]}
        </div>
    </div>
    `;

    try {
        await mailer.sendMail({
            from: `"LexOculus Enterprise" <${NO_REPLY_EMAIL}>`,
            to: FOUNDER_EMAIL,
            subject: `💼 Enterprise Inquiry — ${data.company_name}`,
            html,
        });

        logger.info({ event: 'email_sent', to: FOUNDER_EMAIL, lead: data.work_email },
            `📧 [EMAIL] Enterprise notification sent for ${data.work_email}`);
        return true;
    } catch (error) {
        logger.error({ err: error, event: 'email_error' },
            `📧 [EMAIL] Failed to send enterprise notification`);
        return false;
    }
}

/**
 * Send password reset email

     */
export async function sendPasswordResetEmail(email: string, actionLink: string): Promise<boolean> {
    const mailer = getTransporter();

    if (!mailer) {
        logger.info({ event: 'email_skip', reason: 'no_smtp' },
            `📧 [EMAIL] Skipped notification — SMTP not configured. Action Link: ${actionLink}`);
        return false;
    }

    const html = `
    <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 0;">
        <!-- Header -->
        <div style="background: #000; color: #fff; padding: 20px 24px; border-bottom: 2px solid #000;">
            <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #FF4F00; margin-bottom: 8px;">
                SECURITY PROTOCOL
            </div>
            <div style="font-size: 20px; font-weight: bold;">
                Password Reset Request
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
                LexOculus Authentication System
            </div>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
            <p style="margin-top: 0; font-size: 14px; line-height: 1.6;">
                A request has been made to reset the password for the account associated with <strong>${email}</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                To authenticate and establish a new credential, follow the secure link below:
            </p>
            
            <a href="${actionLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #FF4F00;">
                RESET PASSWORD ->
            </a>
            
            <p style="font-size: 12px; color: #999; margin-top: 32px; line-height: 1.5;">
                If you did not initiate this sequence, you may safely ignore this message. The link will expire automatically.
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 16px 24px; border-top: 2px solid #000; font-size: 10px; color: #999; letter-spacing: 1px; text-transform: uppercase;">
            LexOculus · Access Gateway · ${new Date().toISOString().split('T')[0]}
        </div>
    </div>
    `;

    try {
        await mailer.sendMail({
            from: `"LexOculus Security" <${NO_REPLY_EMAIL}>`,
            to: email,
            subject: `Action Required: Password Reset`,
            html,
        });

        logger.info({ event: 'email_sent', to: email },
            `📧 [EMAIL] Password reset sent to ${email}`);
        return true;
    } catch (error) {
        logger.error({ err: error, event: 'email_error' },
            `📧 [EMAIL] Failed to send password reset notification`);
        return false;
    }
}
