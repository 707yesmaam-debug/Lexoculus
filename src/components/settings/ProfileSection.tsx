'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileSectionProps {
    initialData: {
        full_name: string | null;
        email: string;
        created_at: Date;
    };
}

export default function ProfileSection({ initialData }: ProfileSectionProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: initialData.full_name || '',
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setIsSaving(true);
        setSuccessMessage(null);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to update profile');

            setSuccessMessage('PROFILE_UPDATED_SUCCESSFULLY');
            router.refresh();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error(error);
            form.setError('root', { message: 'Failed to save changes. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-serif font-bold mb-2">Profile Settings</h2>
                <p className="text-gray-500 text-sm font-mono">MANAGE_YOUR_IDENTITY</p>
            </div>

            <Separator className="bg-gray-200" />

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
                <div className="space-y-2">
                    <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-gray-500">
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        value={initialData.email}
                        disabled
                        className="bg-gray-50 font-mono text-gray-500 border-gray-200 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 font-mono">
                        [LOCKED] CONTACT_SUPPORT_TO_CHANGE
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="full_name" className="font-mono text-xs uppercase tracking-wider">
                        Full Name
                    </Label>
                    <Input
                        id="full_name"
                        {...form.register('full_name')}
                        className="font-sans"
                        placeholder="e.g. Jane Doe"
                    />
                    {form.formState.errors.full_name && (
                        <p className="text-xs text-red-500 font-mono mt-1 flex items-center gap-1">
                            {form.formState.errors.full_name.message}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        type="submit"
                        disabled={isSaving || !form.formState.isDirty}
                        className="bg-black hover:bg-gray-800 text-white font-mono text-xs uppercase tracking-widest px-8"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                SAVING...
                            </>
                        ) : (
                            'SAVE_CHANGES'
                        )}
                    </Button>

                    {successMessage && (
                        <span className="text-green-600 font-mono text-xs flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            <Check className="w-3 h-3" />
                            {successMessage}
                        </span>
                    )}
                </div>

                {form.formState.errors.root && (
                    <p className="text-red-600 font-mono text-xs border border-red-200 bg-red-50 p-3">
                        [ERROR] {form.formState.errors.root.message}
                    </p>
                )}
            </form>
        </div>
    );
}
