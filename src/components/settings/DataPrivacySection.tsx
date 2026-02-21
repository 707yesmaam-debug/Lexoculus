'use client';

import { useState } from 'react';
import { Download, Trash2, AlertOctagon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function DataPrivacySection() {
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const res = await fetch('/api/user/export');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lexoculus-data-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Failed to export data');
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred during export');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') return;

        setIsDeleting(true);
        setDeleteError(null);

        try {
            const res = await fetch('/api/user/account', {
                method: 'DELETE',
            });

            if (res.ok) {
                // Success - redirect to landing page
                window.location.href = '/';
            } else {
                const data = await res.json();
                setDeleteError(data.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error(error);
            setDeleteError('An unexpected network error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-12">

            {/* DATA PORTABILITY */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-serif font-bold mb-2">Data Portability</h2>
                    <p className="text-gray-500 text-sm font-mono">GDPR_ARTICLE_20</p>
                </div>
                <Separator className="bg-gray-200" />

                <div className="bg-white border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Export Personal Data</h3>
                        <p className="text-gray-600 text-sm max-w-lg">
                            Download a comprehensive JSON file containing all your personal data, scan history, report metadata, and system logs stored on our servers.
                        </p>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-white text-black border border-black hover:bg-gray-50 font-mono text-xs uppercase tracking-widest min-w-[160px]"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                EXPORTING...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                DOWNLOAD_JSON
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* DANGER ZONE */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-serif font-bold mb-2 text-red-600">Danger Zone</h2>
                    <p className="text-red-400 text-sm font-mono">IRREVERSIBLE_ACTIONS</p>
                </div>
                <Separator className="bg-red-100" />

                <div className="bg-red-50 border border-red-200 p-6">
                    <h3 className="font-bold text-lg text-red-700 mb-2">Delete Account</h3>
                    <p className="text-red-600 text-sm mb-6 max-w-2xl leading-relaxed">
                        Permanently delete your account and all associated data. This action cannot be undone.
                        Your active subscription will be cancelled immediately, and all scans, reports,
                        and compliance evidence will be permanently destroyed in accordance with GDPR Article 17 (Right to Erasure).
                    </p>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-widest">
                                <Trash2 className="w-4 h-4 mr-2" />
                                DELETE_MY_ACCOUNT
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-2 border-red-600 rounded-none sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600 font-serif text-xl">
                                    <AlertOctagon className="w-6 h-6" />
                                    CONFIRM_DELETION
                                </DialogTitle>
                                <DialogDescription className="font-mono text-xs text-red-500 pt-2">
                                    WARNING: THIS ACTION IS PERMANENT AND CANNOT BE UNDONE.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                <p className="text-sm text-gray-700">
                                    To confirm deletion, type <strong>DELETE</strong> in the box below:
                                </p>
                                <Input
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    className="font-mono border-red-200 focus-visible:ring-red-500"
                                    placeholder="DELETE"
                                />
                                {deleteError && (
                                    <div className="bg-red-100 border border-red-300 text-red-800 text-xs p-3 font-mono">
                                        [ERROR] {deleteError}
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-mono uppercase tracking-widest"
                                >
                                    {isDeleting ? 'DELETING_DATA...' : 'PERMANENTLY_DELETE_ACCOUNT'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
