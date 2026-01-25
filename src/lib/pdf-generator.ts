
import puppeteer from 'puppeteer';
// We use 'puppeteer-core' and '@sparticuz/chromium' for production (Serverless/Vercel)
// We use 'puppeteer' (standard) for local development
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

/**
 * Core function to generate PDF from HTML
 */
export async function generatePdfBuffer(html: string): Promise<Buffer> {
    let browser;
    try {
        // Detect production environment (Vercel, AWS, or any Linux container)
        // We use sparticuz/chromium for all Linux production builds to avoid missing binary issues
        const isProduction = process.env.NODE_ENV === 'production' && process.platform !== 'win32';

        if (isProduction) {
            console.log('🚀 [PDF] Launching Serverless Chrome (Sparticuz)...');
            browser = await puppeteerCore.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
        } else {
            console.log('💻 [PDF] Launching Local Chrome (Puppeteer)...');
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error('Puppeteer generation error:', error);
        if (browser) await browser.close();
        throw error;
    }
}

/**
 * Generates the official Compliance Report PDF
 */
export async function generateComplianceReport(data: any): Promise<Buffer> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @page { margin: 2.5cm; }
            body { 
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                line-height: 1.6; 
                color: #1a1a1a;
                padding: 0;
            }
            .brand-header {
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
                margin-bottom: 40px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .brand-logo { font-weight: 900; font-size: 16pt; text-transform: uppercase; }
            .brand-logo span { color: #FF4F00; }
            
            h1 { font-size: 24pt; font-weight: 700; margin-bottom: 10px; }
            h2 { font-size: 16pt; border-bottom: 1px solid #eee; padding-bottom: 5pt; margin-top: 30px; }
            
            .score-card {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
            }
            .score-val { font-size: 32pt; font-weight: 800; color: #1a1a1a; }
            .score-label { text-transform: uppercase; letter-spacing: 1px; font-size: 9pt; color: #666; }
            
            ul { line-height: 1.8; }
            li { margin-bottom: 8px; }
        </style>
    </head>
    <body>
        <div class="brand-header">
            <div class="brand-logo">Lex<span>Oculus</span></div>
            <div style="text-align:right; font-size:9pt; color:#666;">
                Generated: ${new Date().toLocaleDateString()}<br>
                Repo: ${data.repo?.repo_name}
            </div>
        </div>

        <h1>Compliance Report</h1>
        <p>Detailed risk assessment and capabilities analysis for EU AI Act compliance.</p>
        
        <div class="score-card">
            <div class="score-label">Compliance Score</div>
            <div class="score-val">${data.assessment?.final_risk_score || 0}/100</div>
            <div style="margin-top:10px; font-weight:600; color: ${data.assessment?.final_risk_score > 80 ? '#16a34a' : '#d97706'}">
                ${data.assessment?.final_risk_classification || 'UNKNOWN'}
            </div>
        </div>

        <h2>Capabilities Detected</h2>
        <ul>
            ${(data.capabilities?.detected_capabilities || []).map((c: string) => `<li>${c}</li>`).join('')}
        </ul>
        ${(!data.capabilities?.detected_capabilities?.length) ? '<p>No specific AI capabilities detected.</p>' : ''}
    </body>
    </html>
    `;
    return generatePdfBuffer(html);
}

/**
 * Generates the Trust Pack PDF for vendors
 */
export async function generateTrustPackPDF(data: any): Promise<Buffer> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @page { margin: 2.5cm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; }
            .brand-logo { font-weight: 900; font-size: 16pt; text-transform: uppercase; margin-bottom: 40px;}
            .brand-logo span { color: #FF4F00; }
            
            .trust-seal {
                text-align: center;
                margin: 60px 0;
                padding: 40px;
                border: 2px solid #000;
                background: #fafafa;
            }
            .verified-text {
                font-size: 24pt;
                font-weight: 700;
                letter-spacing: -1px;
                margin-bottom: 10px;
            }
            .meta { color: #666; margin-top: 20px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="brand-logo">Lex<span>Oculus</span></div>
        
        <div class="trust-seal">
            <div class="verified-text">Scan Verified</div>
            <p>This software repository has been scanned for EU AI Act compliance risks.</p>
            
            <div style="margin-top: 30px; font-size: 14pt; font-weight: 600;">
                Risk Level: ${data.riskClassification}
            </div>
            
            <div class="meta">
                Repo: ${data.repoScan?.repo_name}<br>
                Date: ${new Date(data.generatedAt).toLocaleDateString()}<br>
                Ref: ${data.repoScan?.id?.slice(0, 8)}
            </div>
        </div>
    </body>
    </html>
    `;
    return generatePdfBuffer(html);
}
