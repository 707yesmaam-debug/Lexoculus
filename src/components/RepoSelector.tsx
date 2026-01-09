'use client';

import { useState, useEffect } from 'react';
import { Search, GitFork, Star, Lock, Eye, Check, Loader2, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Repo {
    repo_url: string;
    name: string;
    full_name: string;
    visibility: 'public' | 'private';
    description: string | null;
    language: string | null;
    stars: number;
    updated_at: string;
}

interface RepoSelectorProps {
    onSelect: (repoFullName: string) => void;
}

export default function RepoSelector({ onSelect }: RepoSelectorProps) {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        async function fetchRepos() {
            try {
                const response = await fetch('/api/github/repos');
                if (!response.ok) {
                    if (response.status === 401) throw new Error('Unauthorized');
                    throw new Error('Failed to fetch repos');
                }
                const data = await response.json();
                setRepos(data.repos || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load repositories');
            } finally {
                setLoading(false);
            }
        }
        fetchRepos();
    }, []);

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (repo: Repo) => {
        setSelectedRepo(repo.name);
        onSelect(repo.full_name);
        setIsOpen(false);
    };

    if (loading) {
        return (
            <div className="w-full h-12 bg-zinc-900 border border-zinc-800 flex items-center px-4 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                <span className="text-zinc-500 text-sm font-mono">Loading repositories...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-4 bg-red-950/20 border border-red-900/50 text-red-400 text-sm font-mono">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="w-full relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors text-left"
            >
                {selectedRepo ? (
                    <span className="font-medium text-zinc-100">{selectedRepo}</span>
                ) : (
                    <span className="text-zinc-500">Select a repository to scan...</span>
                )}
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 shadow-xl z-50 max-h-[400px] flex flex-col">
                    <div className="p-2 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Filter repositories..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-600 focus:ring-0 disabled:opacity-50"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredRepos.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">No repositories found.</div>
                        ) : (
                            filteredRepos.map((repo) => (
                                <button
                                    key={repo.repo_url}
                                    onClick={() => handleSelect(repo)}
                                    className="w-full group flex items-start gap-3 p-3 hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-800 text-left"
                                >
                                    <div className={`mt-0.5 p-1.5 rounded-sm flex-shrink-0 ${repo.visibility === 'private' ? 'bg-amber-950/30 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                        {repo.visibility === 'private' ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">{repo.name}</span>
                                            {repo.language && (
                                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded-sm">{repo.language}</span>
                                            )}
                                        </div>
                                        {repo.description && (
                                            <p className="text-xs text-zinc-500 truncate mt-0.5 max-w-[90%]">{repo.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-600 font-mono">
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3" /> {repo.stars}
                                            </span>
                                            <span className="text-zinc-700">|</span>
                                            <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
