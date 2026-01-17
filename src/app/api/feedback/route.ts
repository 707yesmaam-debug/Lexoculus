import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { rating, comment, url } = body;

        // In a real app, save to DB. For now, we'll log it.
        // We could also send an email or webhook.
        console.log('[FEEDBACK_RECEIVED]', {
            rating,
            comment,
            url,
            timestamp: new Date().toISOString()
        });

        // TODO: Save to 'feedbacks' table once created

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Feedback error:', error);
        return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 });
    }
}
