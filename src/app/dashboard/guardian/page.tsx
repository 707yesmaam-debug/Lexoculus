'use client';

import { useState, useEffect } from 'react';
import GuardianActivity from '@/components/dashboard/GuardianActivity';
import GitHubActionSetupModal from '@/components/GitHubActionSetupModal';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, RefreshCw, Check, X, Lock, Play, Zap, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Repo {
    name: string;
    full_name: string;
    repo_url: string;
    visibility: string;
    description: string;
    language: string;
    stars: number;
    updated_at: string;
}

interface Installation {
    id: string;
    repo_full_name: string;
    status: string;
    block_on_high_risk: boolean;
    block_on_unacceptable: boolean;
    notify_slack: boolean;
    installed_at: string;
    last_scan_at: string | null;
    total_scans: number;
    pr_scan_count: number;
}

export default function ComplianceGuardianPage() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [installations, setInstallations] = useState<Installation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isPro, setIsPro] = useState(true); // Default to true to avoid flicker, let API override if needed

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [reposRes, installsRes] = await Promise.all([
                    fetch('/api/github/repos'),
                    fetch('/api/github/action-install')
                ]);

                if (reposRes.ok) {
                    const data = await reposRes.json();
                    setRepos(data.repos || []);
                }

                if (installsRes.ok) {
                    const data = await installsRes.json();
                    setInstallations(data.installations || []);
                    setIsPro(data.can_enable_integrations ?? true); // Default to true if not specified
                }
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleEnable = (repoFullName: string) => {
        setSelectedRepo(repoFullName);
        setModalOpen(true);
    };

    const handleDisable = async (repoFullName: string) => {
        if (!confirm(`Are you sure you want to disable the Guardian for ${repoFullName}?`)) return;

        try {
            const res = await fetch(`/api/github/action-install?repo_full_name=${encodeURIComponent(repoFullName)}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Refresh installations
                const installsRes = await fetch('/api/github/action-install');
                const data = await installsRes.json();
                setInstallations(data.installations || []);
            }
        } catch (error) {
            console.error('Failed to disable', error);
        }
    };

    const handleSetupComplete = async () => {
        setModalOpen(false);
        // Refresh installations
        const installsRes = await fetch('/api/github/action-install');
        const data = await installsRes.json();
        setInstallations(data.installations || []);
    };

    // Helper to check if a repo is installed
    const getInstallation = (repoFullName: string) =>
        installations.find(i => i.repo_full_name === repoFullName && i.status === 'active');

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-12 border-b-2 border-black pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black mb-4 tracking-tighter">COMPLIANCE_GUARDIAN</h1>
                        <p className="font-mono text-sm text-gray-600 max-w-2xl">
                            Automated PR checks against EU AI Act regulations.
                            Deploy the Guardian to your repositories to prevent non-compliant code from merging.
                        </p>
                    </div>

                </div>
            </header>

            <div className="grid grid-cols-1 gap-12">

                {/* SECTION 1: INSTALLATION & CONFIGURATION (Restored) */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                        <h2 className="font-mono text-lg font-bold uppercase tracking-widest">DEPLOYMENT_CENTER</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center font-mono text-xs text-gray-500">LOADING_REPOSITORIES...</div>
                    ) : (
                        <div className="bg-white border border-black divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                            {repos.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="font-mono text-xs text-gray-500 mb-4">NO_REPOSITORIES_FOUND</p>
                                    <Link href="/dashboard/settings" className="text-xs bg-black text-white px-4 py-2 uppercase font-mono tracking-wider hover:opacity-80">
                                        Connect GitHub
                                    </Link>
                                </div>
                            ) : (
                                repos.map((repo) => {
                                    const installation = getInstallation(repo.full_name);
                                    const isInstalled = !!installation;

                                    return (
                                        <div key={repo.full_name} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 flex items-center justify-center border ${isInstalled ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm flex items-center gap-2">
                                                        {repo.full_name}
                                                        {repo.visibility === 'private' && <Lock className="w-3 h-3 text-gray-400" />}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-gray-500 mt-1 flex items-center gap-3">
                                                        <span>{repo.language || 'Unknown'}</span>
                                                        {isInstalled && (
                                                            <span className="text-green-600 flex items-center gap-1">
                                                                <Check className="w-3 h-3" /> ACTIVE_PROTECTION
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                {isInstalled ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-[10px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 uppercase tracking-wider font-mono"
                                                            onClick={() => handleDisable(repo.full_name)}
                                                        >
                                                            Disable
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-[10px] border-gray-200 text-gray-600 hover:bg-gray-50 uppercase tracking-wider font-mono cursor-not-allowed opacity-50"
                                                            disabled
                                                        >
                                                            <Settings className="w-3 h-3 mr-1" /> Config
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 text-[10px] bg-black text-white hover:bg-gray-800 uppercase tracking-wider font-mono"
                                                        onClick={() => handleEnable(repo.full_name)}
                                                        disabled={!isPro}
                                                    >
                                                        {isPro ? (
                                                            <>
                                                                <Zap className="w-3 h-3 mr-1" /> Deploy_Guardian
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Lock className="w-3 h-3 mr-1" /> Locked
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </section>

                {/* SECTION 2: GUARDIAN ACTIVITY LOG (New) */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h2 className="font-mono text-lg font-bold uppercase tracking-widest">LIVE_ACTIVITY_FEED</h2>
                    </div>
                    <GuardianActivity />
                </section>

            </div>

            {/* Setup Modal */}
            {selectedRepo && (
                <GitHubActionSetupModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    repoFullName={selectedRepo}
                    onComplete={handleSetupComplete}
                />
            )}
        </div>
    );
}
