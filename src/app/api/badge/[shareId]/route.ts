'use server';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/infra/prisma';

interface RouteContext {
    params: Promise<{ shareId: string }>;
}

/**
 * Generate shields.io-style SVG badge
 */
function generateBadge(
    label: string,
    message: string,
    color: string,
    messageColor: string = '#fff'
): string {
    const labelWidth = label.length * 7 + 14;
    const messageWidth = message.length * 7 + 14;
    const totalWidth = labelWidth + messageWidth;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="14" fill="#fff">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14" fill="${messageColor}">${message}</text>
  </g>
</svg>`;
}

/**
 * GET /api/badge/:shareId
 * Returns SVG badge for the AI System
 * 
 * Query params:
 * - style: 'flat' | 'flat-square' (default: flat)
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { shareId } = await context.params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'svg';

        // Find AI system by share ID
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { public_share_id: shareId },
            include: {
                user: {
                    include: {
                        subscription: true
                    }
                }
            }
        });

        // Not found
        if (!aiSystem) {
            const svg = generateBadge('EU AI Act', 'Not Found', '#9f9f9f');
            return new NextResponse(svg, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                }
            });
        }

        // Sharing disabled
        if (!aiSystem.share_enabled) {
            const svg = generateBadge('EU AI Act', 'Disabled', '#9f9f9f');
            return new NextResponse(svg, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                }
            });
        }

        // MRR GATING: Check subscription
        const subscription = aiSystem.user?.subscription;
        const hasActiveSubscription = subscription?.status === 'active' ||
            subscription?.status === 'trialing';

        if (!hasActiveSubscription) {
            const svg = generateBadge('EU AI Act', 'Subscription Required', '#dc3545');
            return new NextResponse(svg, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                }
            });
        }

        // Generate badge based on classification
        let message: string;
        let color: string;

        switch (aiSystem.risk_classification) {
            case 'UNACCEPTABLE':
                message = 'UNACCEPTABLE';
                color = '#dc3545'; // red
                break;
            case 'HIGH_RISK':
                message = 'HIGH RISK';
                color = '#FF4F00'; // orange
                break;
            case 'LIMITED_RISK':
                message = 'LIMITED RISK';
                color = '#ffc107'; // yellow
                break;
            case 'MINIMAL_RISK':
                message = 'MINIMAL RISK ✓';
                color = '#28a745'; // green
                break;
            default:
                message = 'PENDING';
                color = '#6c757d'; // gray
        }

        // Return JSON if requested (Internal metadata like risk_score/scan_time redacted for security)
        if (format === 'json') {
            return NextResponse.json({
                system_name: aiSystem.name,
                risk_classification: aiSystem.risk_classification,
                status_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/status/${shareId}`,
                badge_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/badge/${shareId}`,
            });
        }

        // Return SVG
        const svg = generateBadge('EU AI Act', message, color);

        return new NextResponse(svg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
            }
        });

    } catch (error) {
        console.error('Badge generation error:', error);
        const svg = generateBadge('EU AI Act', 'Error', '#dc3545');
        return new NextResponse(svg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'no-cache',
            }
        });
    }
}
