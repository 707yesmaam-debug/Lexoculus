
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { generatePdfBuffer } from '@/lib/pdf-generator';
import { marked } from 'marked';

// Configure marked for professional output
marked.use({
    gfm: true,
    breaks: true
});

export const dynamic = 'force-dynamic';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/documents/:id/export
 * Export document to PDF
 * 
 * MRR HOOK: Requires active subscription
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get document with AI system and user subscription
        const document = await prisma.complianceDocument.findUnique({
            where: { id },
            include: {
                ai_system: {
                    include: {
                        user: {
                            include: {
                                subscription: true
                            }
                        }
                    }
                }
            }
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        if (document.ai_system.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // MRR GATING: Check subscription
        const subscription = document.ai_system.user?.subscription;
        const hasActiveSubscription = subscription?.status === 'active' ||
            subscription?.status === 'trialing';

        if (!hasActiveSubscription) {
            return NextResponse.json(
                { error: 'Active subscription required to export PDF' },
                { status: 403 }
            );
        }

        // Get markdown content
        let contentMarkdown = (document.content as { markdown?: string })?.markdown || '';

        // Strip the main title from markdown to avoid duplication (since we add a styled Brand Header)
        // We look for the first H1 (# Title)
        contentMarkdown = contentMarkdown.replace(/^#\s+.*$/m, '');

        // Convert to HTML using standard library
        const bodyHtml = await marked.parse(contentMarkdown);

        // Generate full HTML with LexOculus Theme
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${document.title}</title>
    <style>
        @page {
            margin: 2.5cm;
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-size: 9pt;
                color: #666;
            }
        }
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            line-height: 1.5; 
            color: #222;
            max-width: 21cm;
            margin: 0 auto;
            background: white;
            font-size: 11pt;
        }
        
        /* Typography Scale */
        h1 { font-size: 24pt; font-weight: 700; margin-bottom: 24px; color: #111; line-height: 1.2; break-after: avoid; }
        h2 { font-size: 18pt; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid #eaeaea; padding-bottom: 8px; color: #333; break-after: avoid; }
        h3 { font-size: 14pt; font-weight: 600; margin-top: 24px; margin-bottom: 8px; color: #444; break-after: avoid; }
        h4 { font-size: 12pt; font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; break-after: avoid; }
        h5, h6 { font-size: 11pt; font-weight: 700; margin-top: 16px; margin-bottom: 8px; color: #666; break-after: avoid; }
        
        p { margin-bottom: 16px; text-align: justify; }
        ul, ol { margin-bottom: 16px; padding-left: 24px; }
        li { margin-bottom: 4px; }
        
        /* Missing Field Warning */
        .missing {
            background-color: #fff3cd;
            color: #856404;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
            font-family: monospace;
            border: 1px solid #ffeeba;
        }

        /* Branding Header */
        .brand-header {
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .brand-logo { font-weight: 900; font-size: 18pt; text-transform: uppercase; letter-spacing: -1px; }
        .brand-logo span { color: #FF4F00; }
        
        .doc-meta { text-align: right; font-size: 9pt; color: #666; line-height: 1.4; }

        /* Tables - Professional Look */
        table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 10pt; page-break-inside: avoid; }
        th, td { border: 1px solid #ddd; padding: 12px 10px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: 600; color: #333; }
        tr:nth-child(even) { background-color: #fafafa; }

        /* Code Blocks */
        pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; margin-bottom: 16px; page-break-inside: avoid; }
        code { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.9em; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }

        /* Blockquotes */
        blockquote { border-left: 4px solid #FF4F00; margin: 0 0 16px 0; padding-left: 16px; color: #555; font-style: italic; }

        /* Footer */
        .footer-info { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 8pt; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class="brand-header">
        <div class="brand-logo">Lex<span>Oculus</span></div>
        <div class="doc-meta">
            AI System: ${escapeHtml(document.ai_system.name)}<br>
            Version: ${document.version}.0<br>
            Date: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
    </div>

    <h1>${escapeHtml(document.title)}</h1>
    
    ${bodyHtml}

    <div class="footer-info">
        Generated by LexOculus EU AI Act Compliance Platform | Document ID: ${document.id}<br>
        ${new Date().toISOString()}
    </div>
</body>
</html>`;

        // Generate PDF
        const pdfBuffer = await generatePdfBuffer(html);

        // Mark document as exported
        await prisma.complianceDocument.update({
            where: { id },
            data: { status: 'exported' }
        });

        console.log(`📄 [EXPORT] PDF generated for ${document.title} (${pdfBuffer.length} bytes)`);

        // Return PDF binary
        // Cast to any to avoid BodyInit type issues with Buffer/Uint8Array
        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${document.document_type}-${document.ai_system.name.replace(/\s+/g, '-')}.pdf"`,
            }
        });

    } catch (error: any) {
        console.error('PDF export error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to export PDF' },
            { status: 500 }
        );
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
