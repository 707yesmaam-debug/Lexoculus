import { createServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SettingsTabs, { TabsContent } from '@/components/settings/SettingsTabs';
import ProfileSection from '@/components/settings/ProfileSection';
import SubscriptionSection from '@/components/settings/SubscriptionSection';
import DataPrivacySection from '@/components/settings/DataPrivacySection';

export default async function SettingsPage() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Fetch User Data for Server-Side Rendering
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            subscription: true,
            _count: {
                select: {
                    repo_scans: true,
                }
            }
        }
    });

    if (!dbUser) {
        // Edge case: User in Auth but not in DB
        redirect('/auth/login');
    }

    const userData = {
        full_name: dbUser.full_name,
        email: dbUser.email,
        created_at: dbUser.created_at,
    };

    const subData = dbUser.subscription ? {
        tier: dbUser.subscription.tier,
        status: dbUser.subscription.status,
        current_period_end: dbUser.subscription.current_period_end,
        limits: {
            scans: dbUser.subscription.scans_limit,
            repos: dbUser.subscription.repos_limit,
        },
        usage: {
            scans: dbUser.subscription.scans_used,
            repos: dbUser.subscription.repos_used,
        },
        has_payment_method: !!dbUser.subscription.payment_customer_id,
    } : null;

    return (
        <div className="flex flex-col h-full bg-[#f9fafb]">
            {/* Header */}
            <div className="bg-white border-b border-black p-8 pb-12">
                <h1 className="text-4xl font-serif mb-2">Account Settings</h1>
                <div className="font-mono text-xs uppercase tracking-widest text-gray-500">
                    CONFIGURE_YOUR_WORKSPACE
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="flex-1 overflow-hidden">
                <SettingsTabs>
                    <TabsContent value="profile">
                        <ProfileSection initialData={userData} />
                    </TabsContent>

                    <TabsContent value="subscription">
                        <SubscriptionSection subscription={subData} />
                    </TabsContent>

                    <TabsContent value="privacy">
                        <DataPrivacySection />
                    </TabsContent>
                </SettingsTabs>
            </div>
        </div>
    );
}
