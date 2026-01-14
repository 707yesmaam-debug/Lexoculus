/**
 * Report Signer Utility
 * 
 * Creates digital signatures for PDF reports
 * Ensures authenticity and non-repudiation
 */

import * as crypto from 'crypto';

interface SignatureResult {
    signedPdf: Buffer;
    signature: string;
    timestamp: Date;
    fileHash: string;
}

/**
 * Sign a PDF report with digital signature
 */
export async function signReport(
    pdfBuffer: Buffer,
    signingKey: string
): Promise<SignatureResult> {
    // Calculate file hash
    const fileHash = crypto
        .createHash('sha256')
        .update(pdfBuffer)
        .digest('hex');

    const timestamp = new Date();

    // Create signature payload
    const payload = JSON.stringify({
        file_hash: fileHash,
        timestamp: timestamp.toISOString(),
        version: '1.0',
    });

    // Create HMAC signature (simpler than RSA for our use case)
    const signature = crypto
        .createHmac('sha256', signingKey)
        .update(payload)
        .digest('hex');

    console.log(`[Signer] PDF signed: ${fileHash.substring(0, 16)}...`);

    return {
        signedPdf: pdfBuffer, // PDFKit doesn't support embedded signatures easily
        signature: `${signature}:${timestamp.getTime()}`,
        timestamp,
        fileHash,
    };
}

/**
 * Verify a report signature
 */
export function verifySignature(
    pdfBuffer: Buffer,
    signature: string,
    signingKey: string
): { valid: boolean; timestamp?: Date } {
    try {
        const [sig, timestampStr] = signature.split(':');
        const timestamp = new Date(parseInt(timestampStr));

        const fileHash = crypto
            .createHash('sha256')
            .update(pdfBuffer)
            .digest('hex');

        const payload = JSON.stringify({
            file_hash: fileHash,
            timestamp: timestamp.toISOString(),
            version: '1.0',
        });

        const expectedSig = crypto
            .createHmac('sha256', signingKey)
            .update(payload)
            .digest('hex');

        // SECURITY: Use timing-safe comparison to prevent timing attacks
        const sigBuffer = Buffer.from(sig, 'hex');
        const expectedBuffer = Buffer.from(expectedSig, 'hex');

        // Ensure buffers are same length before comparison
        const valid = sigBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(sigBuffer, expectedBuffer);

        return { valid, timestamp: valid ? timestamp : undefined };
    } catch (error) {
        console.error('[Signer] Verification failed:', error);
        return { valid: false };
    }
}
