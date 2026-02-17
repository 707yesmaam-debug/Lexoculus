'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { User, CreditCard, Shield } from 'lucide-react';

interface SettingsTabsProps {
    children: React.ReactNode;
    defaultValue?: string;
}

export default function SettingsTabs({ children, defaultValue = 'profile' }: SettingsTabsProps) {
    return (
        <Tabs.Root defaultValue={defaultValue} className="flex flex-col w-full h-full">
            <Tabs.List className="flex border-b border-black bg-[#F5F5F5] px-6">
                <Tabs.Trigger
                    value="profile"
                    className="group px-6 py-4 font-mono text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black data-[state=active]:text-[#FF4F00] data-[state=active]:border-b-2 data-[state=active]:border-[#FF4F00] flex items-center gap-2 transition-colors"
                >
                    <User className="w-4 h-4Group" />
                    Profile
                </Tabs.Trigger>
                <Tabs.Trigger
                    value="subscription"
                    className="group px-6 py-4 font-mono text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black data-[state=active]:text-[#FF4F00] data-[state=active]:border-b-2 data-[state=active]:border-[#FF4F00] flex items-center gap-2 transition-colors"
                >
                    <CreditCard className="w-4 h-4" />
                    Subscription
                </Tabs.Trigger>
                <Tabs.Trigger
                    value="privacy"
                    className="group px-6 py-4 font-mono text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black data-[state=active]:text-[#FF4F00] data-[state=active]:border-b-2 data-[state=active]:border-[#FF4F00] flex items-center gap-2 transition-colors"
                >
                    <Shield className="w-4 h-4" />
                    Data_&_Privacy
                </Tabs.Trigger>
            </Tabs.List>

            <div className="flex-1 overflow-y-auto bg-white">
                {children}
            </div>
        </Tabs.Root>
    );
}

export function TabsContent({ value, children }: { value: string, children: React.ReactNode }) {
    return (
        <Tabs.Content value={value} className="p-6 md:p-12 max-w-4xl mx-auto focus:outline-none animate-in fade-in duration-300">
            {children}
        </Tabs.Content>
    );
}
