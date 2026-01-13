import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { uploadEvidenceToSupabase } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const riskAssessmentId = formData.get('riskAssessmentId') as string;

        if (!file || !riskAssessmentId) {
            return NextResponse.json(
                { error: 'Missing file or assessment ID' },
                { status: 400 }
            );
        }

        // Security: Validate File Size (Max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds 5MB limit' },
                { status: 413 }
            );
        }

        // Security: Validate File Type
        const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PDF, PNG, and JPEG are allowed.' },
                { status: 415 }
            );
        }

        // 1. Authenticate
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Convert to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Upload
        const result = await uploadEvidenceToSupabase(
            buffer,
            user.id,
            riskAssessmentId,
            file.name,
            file.type
        );

        return NextResponse.json({ url: result.url });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal upload failure' },
            { status: 500 }
        );
    }
}
