'use client';

import { useState, useEffect } from 'react';
import { Shield, ExternalLink, RefreshCw, Check, X, Lock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GitHubActionSetupModal from '@/components/GitHubActionSetupModal';
import Link from 'next/link';

interface Repo {
    name: string;
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-500" />
                    Integrations
                </h1>
                <p className="text-zinc-400 mt-2 max-w-2xl">
                    Connect ComplianceAI to your development workflow. Automatically scan every Pull Request for EU AI Act compliance risks.
                </p>
            </div>

            {/* Pro Banner if not subscribed */}
            {!loading && !isPro && (
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Lock className="w-4 h-4 text-purple-400" />
                                Unlock GitHub PR Scanning
                            </h3>
                            <p className="text-zinc-400 text-sm max-w-lg">
                                Automated PR scanning is a Pro feature. Upgrade to protect your codebase continuously and block non-compliant AI changes.
                            </p>
                        </div>
                        <Button className="bg-white text-black hover:bg-zinc-200">
                            Upgrade to Pro
                        </Button>
                    </div>
                </div>
            )}

            {/* Repository List */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/80 flex items-center justify-between">
                    <h3 className="font-medium text-zinc-200">Your Repositories</h3>
                    <Button variant="ghost" size="sm" onClick={fetchData} className="text-zinc-500 hover:text-white">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                <div className="divide-y divide-zinc-800/50">
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500">Loading repositories...</div>
                    ) : repos.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            No repositories found. Please connect your GitHub account.
                        </div>
                    ) : (
                        repos.map((repo) => {
                            const install = installations.find(i => i.repo_full_name === repo.name && i.status === 'active');
                            const isActive = !!install;

                            return (
                                <div key={repo.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm text-zinc-300">{repo.name}</span>
                                            {repo.visibility === 'private' && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">PRIVATE</span>
                                            )}
                                            {isActive && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <Check className="w-3 h-3" /> ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        {isActive && (
                                            <div className="mt-1 text-xs text-zinc-500 flex items-center gap-3">
                                                <span>{install.pr_scan_count} PRs scanned</span>
                                                {install.last_scan_at && (
                                                    <span>Last scan: {new Date(install.last_scan_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <a href={repo.repo_url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>

                                        {isActive ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-900/30 text-red-400 hover:bg-red-950/30 hover:border-red-900/50 text-xs h-8"
                                                onClick={() => handleDisable(repo.name)}
                                            >
                                                Disable
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={!isPro}
                                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8"
                                                onClick={() => handleEnable(repo.name)}
                                            >
                                                {isPro ? 'Setup Guardian' : <><Lock className="w-3 h-3 mr-1.5" /> Locked</>}
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
