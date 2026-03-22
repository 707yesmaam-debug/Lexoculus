import nodemailer from 'nodemailer';

export async function sendOnboardingEmail({
    to,
    clientName,
    firmName,
    onboardingUrl,
}: {
    to: string;
    clientName: string;
    firmName: string;
    onboardingUrl: string;
}) {
    // Note: In production, configure these securely via env vars
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const emailHtml = `
    <div style="font-family: monospace; max-width: 600px; margin: 0 auto; border: 1px solid #000; padding: 40px; background-color: #fff; color: #000;">
        <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
            <h2 style="font-family: serif; margin: 0; font-size: 24px;">${firmName}</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 1px;">
                Secure Audit Access Request
            </p>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6;">Hello ${clientName},</p>
        
        <p style="font-size: 14px; line-height: 1.6;">
            <strong>${firmName}</strong> has requested delegated access to scan your repositories for compliance with the EU AI Act using the LexOculus engine.
        </p>

        <div style="background-color: #fcece6; border: 1px solid #FF4F00; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #FF4F00;">
                <strong style="text-transform: uppercase;">Security Guarantee:</strong><br>
                We request READ-ONLY access. Code is never stored permanently. Scans are executed in secure, ephemeral environments and immediately purged.
            </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
            Please click the secure link below to authorize access via GitHub. You will be able to select exactly which repositories <strong>${firmName}</strong> is allowed to audit.
        </p>

        <a href="${onboardingUrl}" style="display: block; background-color: #000; color: #fff; text-decoration: none; text-align: center; padding: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; margin-bottom: 30px;">
            Authorize Connection
        </a>

        <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; font-size: 10px; color: #999; text-align: center;">
            <p style="margin: 0;">POWERED_BY: LEXOCULUS_AUDIT_ENGINE</p>
            <p style="margin: 5px 0 0 0;">This secure link is single-use and will expire in 48 hours for your protection.</p>
        </div>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"${firmName} via LexOculus" <${process.env.SMTP_FROM || 'noreply@lexoculus.com'}>`,
            to,
            subject: `Action Required: Authorize ${firmName} Compliance Audit`,
            html: emailHtml,
        });
        console.log(`Onboarding email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error('Failed to send onboarding email:', error);
        return false;
    }
}
