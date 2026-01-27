'use client';

import { useState, useEffect } from 'react';
import { Shield, ExternalLink, RefreshCw, Check, X, Lock, Play, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GitHubActionSetupModal from '@/components/GitHubActionSetupModal';
import Link from 'next/link';

interface Repo {
    name: string;
    full_name: string;
    repo_url: string;
    visibility: 'public' | 'private';
}

interface Installation {
    repo_full_name: string;
    status: 'active' | 'disabled';
    last_scan_at: string | null;
    pr_scan_count: number;
}

export default function IntegrationsPage() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [installations, setInstallations] = useState<Installation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
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
                setIsPro(data.can_enable_integrations);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnable = (repoName: string) => {
        setSelectedRepo(repoName);
        setModalOpen(true);
    };

    const handleSetupComplete = async () => {
        if (!selectedRepo) return;

        // Call API to register installation
        try {
            await fetch('/api/github/action-install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repo_full_name: selectedRepo,
                    block_on_high_risk: true
                })
            });

            // Refresh list
            await fetchData();
            setModalOpen(false);
            setSelectedRepo(null);
        } catch (error) {
            console.error('Failed to enable', error);
        }
    };

    const handleDisable = async (repoName: string) => {
        if (!confirm(`Are you sure you want to disable scanning for ${repoName}?`)) return;

        try {
            await fetch(`/api/github/action-install?repo_full_name=${repoName}`, {
                method: 'DELETE'
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to disable', error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-12">

            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <div className="font-mono text-xs text-[#FF4F00] mb-4 tracking-widest uppercase">
                    PHASE_02 // INTEGRATION
                </div>
                <h1 className="font-serif text-5xl font-bold mb-4 tracking-tight">System Guardian.</h1>
                <p className="font-mono text-sm text-[#555] max-w-xl leading-relaxed">
                    Connect LexOculus to your development workflow.
                    Automatically audit every Pull Request against the EU AI Act.
                </p>
            </div>

            {/* Pro Banner if not subscribed */}
            {!loading && !isPro && (
                <div className="border border-black bg-[#F5F5F5] p-6 mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">


                    <div className="space-y-2 z-10">
                        <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                            <Lock className="w-5 h-5 text-[#FF4F00]" />
                            Unlock Guardian Protocol
                        </h3>
                        <p className="font-mono text-xs text-[#555] max-w-lg">
                            Continuous compliance scanning is restricted to authorized accounts.
                            Upgrade to activate the CI/CD defense layer.
                        </p>
                    </div>
                    <Link href="/pricing">
                        <Button className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs uppercase tracking-widest px-8 py-6 z-10 transition-colors w-full sm:w-auto">
                            Upgrade_Account -&gt;
                        </Button>
                    </Link>
                </div>
            )}

            {/* Repository List */}
            <div className="border-2 border-black bg-white">
                <div className="p-4 border-b border-black bg-[#F5F5F5] flex items-center justify-between">
                    <h3 className="font-bold text-sm uppercase tracking-widest">Available Systems</h3>
                    <Button variant="ghost" size="sm" onClick={fetchData} className="text-black hover:bg-black hover:text-white rounded-none">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                <div className="divide-y divide-[#E5E5E5]">
                    {loading ? (
                        <div className="p-12 text-center font-mono text-xs text-[#999] uppercase tracking-widest">
                            Scanning_Network...
                        </div>
                    ) : repos.length === 0 ? (
                        <div className="p-12 text-center font-mono text-xs text-[#999]">
                            NO_REPOSITORIES_DETECTED. CHECK_SOURCE_CONNECTION.
                        </div>
                    ) : (
                        repos.map((repo) => {
                            const install = installations.find(i => i.repo_full_name === repo.full_name && i.status === 'active');
                            const isActive = !!install;

                            return (
                                <div key={repo.name} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[#F9F9F9] transition-colors group">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-serif font-bold text-xl">{repo.name}</span>
                                            {repo.visibility === 'private' && (
                                                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-black text-white">PRIVATE</span>
                                            )}
                                            {isActive && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase bg-[#FF4F00] text-white">
                                                    <Check className="w-3 h-3" /> ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        {isActive && (
                                            <div className="mt-2 text-[10px] font-mono text-[#555] flex items-center gap-4">
                                                <span>SCANNED_PRS: {install.pr_scan_count}</span>
                                                {install.last_scan_at && (
                                                    <span>LAST_AUDIT: {new Date(install.last_scan_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <a href={repo.repo_url} target="_blank" rel="noopener noreferrer" className="text-[#999] hover:text-black transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>

                                        {isActive ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-500 text-red-500 hover:bg-red-50 rounded-none font-mono text-[10px] uppercase tracking-widest h-8"
                                                onClick={() => handleDisable(repo.full_name)}
                                            >
                                                Deactivate
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={!isPro}
                                                className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-[10px] uppercase tracking-widest px-4 h-8 transition-colors disabled:opacity-50"
                                                onClick={() => handleEnable(repo.full_name)}
                                            >
                                                {isPro ? 'Deploy_Guardian' : <><Lock className="w-3 h-3 mr-1.5" /> LOCKED</>}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

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
