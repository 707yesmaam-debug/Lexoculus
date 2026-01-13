'use client';

import { useState, useEffect } from 'react';
import { Search, GitFork, Star, Lock, Eye, Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

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
            <div className="w-full p-4 border border-black flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono text-xs uppercase tracking-widest">Fetching_Manifest...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-4 border border-red-500 bg-red-50 text-red-500 font-mono text-xs">
                ERR_FETCH_FAILED: {error}
            </div>
        );
    }

    return (
        <div className="w-full relative">
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between py-8 px-6 bg-white border-0 hover:bg-[#F5F5F5] hover:text-black text-black font-normal rounded-none transition-none"
            >
                {selectedRepo ? (
                    <span className="font-serif font-bold text-xl">{selectedRepo}</span>
                ) : (
                    <span className="font-mono text-xs text-[#999] uppercase tracking-widest">Select Target System...</span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <div className="border-t border-black bg-white z-50 max-h-[400px] flex flex-col">
                    <div className="p-4 border-b border-black">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-black" />
                            <input
                                type="text"
                                placeholder="FILTER_REPOSITORIES"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#F5F5F5] border border-black pl-10 pr-4 py-2 font-mono text-xs focus:outline-none focus:bg-white placeholder:text-[#999]"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredRepos.length === 0 ? (
                            <div className="p-8 text-center font-mono text-xs text-[#999]">NO_MATCH_FOUND</div>
                        ) : (
                            filteredRepos.map((repo) => (
                                <button
                                    key={repo.repo_url}
                                    onClick={() => handleSelect(repo)}
                                    className="w-full group flex items-start gap-4 p-6 border-b border-[#E5E5E5] hover:bg-black hover:text-white transition-colors text-left last:border-0"
                                >
                                    <div className={`mt-0.5 p-1 border ${repo.visibility === 'private' ? 'border-[#FF4F00] text-[#FF4F00] bg-[#FF4F00]/10' : 'border-black text-black bg-transparent group-hover:border-white group-hover:text-white'}`}>
                                        {repo.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-serif font-bold text-lg">{repo.name}</span>
                                            {repo.language && (
                                                <span className="font-mono text-[10px] uppercase border border-black px-1 py-0.5 group-hover:border-white">{repo.language}</span>
                                            )}
                                        </div>
                                        {repo.description && (
                                            <p className="font-mono text-xs text-[#555] group-hover:text-[#999] truncate mb-2">{repo.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 font-mono text-[10px] text-[#999] group-hover:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                ★ {repo.stars}
                                            </span>
                                            <span>|</span>
                                            <span>UPDATED: {new Date(repo.updated_at).toLocaleDateString()}</span>
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
