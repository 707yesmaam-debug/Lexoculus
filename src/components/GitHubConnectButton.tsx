'use client';

import { Github, Loader2, CheckCircle, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GitHubConnectButtonProps {
    onConnected?: () => void;
    initialConnected?: boolean;
}

export default function GitHubConnectButton({ onConnected, initialConnected = false }: GitHubConnectButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(initialConnected);
    const router = useRouter();

    // If passed as prop, sync state
    useEffect(() => {
        setIsConnected(initialConnected);
    }, [initialConnected]);

    const handleConnect = async () => {
        setIsLoading(true);
        window.location.href = '/api/auth/github/login';
    };

    const handleDisconnect = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to disconnect GitHub? You\'ll need to reconnect to scan repositories.'
        );

        if (!confirmed) return;

        try {
            setIsDisconnecting(true);
            const response = await fetch('/api/auth/github/disconnect', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to disconnect');
            }

            // Success
            setIsConnected(false);
            router.refresh(); // Refresh server components

            // If we provided a callback, maybe call it or just let the parent handle via props
            // For now, reload to ensure full state reset
            window.location.reload();

        } catch (error) {
            console.error('Disconnect error:', error);
            alert('Failed to disconnect GitHub. Please try again.');
        } finally {
            setIsDisconnecting(false);
        }
    };

    if (isConnected) {
        return (
            <div className="w-full bg-zinc-900 border border-zinc-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-zinc-200 font-medium text-sm">GitHub Connected</h3>
                        <p className="text-zinc-500 text-xs">Ready to ingest repositories</p>
                    </div>
                </div>

                <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-950/30 hover:bg-red-950/50 border border-red-900/30 hover:border-red-900/50 text-red-400 text-xs font-medium transition-colors rounded-sm ml-auto sm:ml-0"
                >
                    {isDisconnecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <LogOut className="w-3.5 h-3.5" />
                    )}
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <button
                onClick={handleConnect}
                disabled={isLoading}
                className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-100 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                ) : (
                    <>
                        <Github className="w-5 h-5 text-zinc-100 group-hover:text-white transition-colors" />
                        <span>Connect GitHub Repository</span>
                    </>
                )}

                {/* Sharp corner accent */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="mt-3 flex items-start gap-2 text-xs text-zinc-500 font-mono">
                <div className="mt-0.5 min-w-[12px]">
                    <span className="text-emerald-500">✓</span>
                </div>
                <p>Read-only access to repository metadata. Source code is processed in volatile memory only.</p>
            </div>
        </div>
    );
}
