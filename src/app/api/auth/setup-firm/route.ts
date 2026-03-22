import { createServerClient } from '@/lib/infra/supabase-server';
import { prisma } from '@/lib/infra/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accountType = user.user_metadata?.account_type;
        const firmName = user.user_metadata?.firm_name;

        if (accountType !== 'firm' || !firmName) {
            return NextResponse.json({ message: 'Not a firm account or missing firm name, skipping setup.' }, { status: 200 });
        }

        // Check if user already has a firm
        const existingMember = await prisma.firmMember.findUnique({
            where: { user_id: user.id }
        });

        if (existingMember) {
            return NextResponse.json({ message: 'Firm profile already exists.' }, { status: 200 });
        }

        // Create the firm and add the user as admin
        await prisma.$transaction(async (tx) => {
            const firm = await tx.firm.create({
                data: {
                    name: firmName,
                    business_email: user.email, // Default to user's email
                }
            });

            await tx.firmMember.create({
                data: {
                    user_id: user.id,
                    firm_id: firm.id,
                    role: 'admin',
                }
            });
        });

        return NextResponse.json({ message: 'Firm profile created successfully.' });

    } catch (error) {
        console.error('Error setting up firm profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
