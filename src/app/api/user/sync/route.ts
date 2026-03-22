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

        const email = user.email!;
        const metadata = user.user_metadata || {};
        const accountType = metadata.account_type || 'individual';
        const fullName = metadata.full_name || '';
        const firmName = metadata.firm_name || `${fullName}'s Firm`;

        // Create or update the User record
        let dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        
        if (!dbUser) {
            dbUser = await (prisma as any).user.create({
                data: {
                    id: user.id,
                    email: email,
                    full_name: fullName,
                    account_type: accountType as any,
                }
            });
        }

        // Ensure default subscription exists
        let subs = await prisma.subscription.findUnique({ where: { user_id: user.id } });
        if (!subs) {
            subs = await prisma.subscription.create({
                data: {
                    user_id: user.id,
                    tier: 'free',
                    status: 'active',
                }
            });
        }

        // If it's a firm account, ensure Firm and FirmMember exist
        let firmNameResponse = null;
        
        // UPGRADE logic: If individual user has client_limit > 0, they should be a firm
        const isFirmSubscription = subs && ((subs as any).client_limit && (subs as any).client_limit > 0);
        const effectiveAccountType = isFirmSubscription ? 'firm' : accountType;

        if (effectiveAccountType === 'firm') {
            // Update user account type if it was individual but now has firm subs
            if ((dbUser as any).account_type !== 'firm') {
                await (prisma as any).user.update({
                    where: { id: user.id },
                    data: { account_type: 'firm' as any }
                });
            }

            let firmMember = await (prisma as any).firmMember.findUnique({ 
                where: { user_id: user.id },
                include: { firm: true } 
            });

            if (!firmMember) {
                // Create Firm
                const newFirm = await (prisma as any).firm.create({
                    data: {
                        name: firmName,
                        business_email: email,
                    }
                });

                // Link User to Firm
                firmMember = await (prisma as any).firmMember.create({
                    data: {
                        firm_id: newFirm.id,
                        user_id: user.id,
                        role: 'admin',
                    },
                    include: { firm: true }
                });
            }
            
            firmNameResponse = (firmMember as any).firm.name;

            return NextResponse.json({ 
                success: true, 
                user: { ...dbUser, account_type: effectiveAccountType }, 
                firmName: firmNameResponse, 
                firmLogo: (firmMember as any)?.firm?.logo_url || null,
                brandingColor: (firmMember as any)?.firm?.branding_color || '#000000',
                email 
            });
        }

        return NextResponse.json({ 
            success: true, 
            user: { ...dbUser, account_type: effectiveAccountType }, 
            firmName: null, 
            email 
        });

    } catch (error) {
        console.error('Error in user sync:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
