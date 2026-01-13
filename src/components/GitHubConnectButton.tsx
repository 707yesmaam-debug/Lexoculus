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
            <div className="w-full bg-[#F5F5F5] border border-black p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-black text-white p-2">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-lg">GitHub Connected</h3>
                        <p className="font-mono text-xs text-[#555] uppercase tracking-wider">Ready for ingestion</p>
                    </div>
                </div>

                <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="flex items-center gap-2 px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors text-xs font-mono uppercase tracking-widest disabled:opacity-50"
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
                className="group relative w-full flex items-center justify-center gap-3 px-6 py-6 bg-black text-white hover:bg-[#FF4F00] transition-colors duration-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                    <>
                        <Github className="w-5 h-5" />
                        <span className="font-mono font-bold tracking-widest uppercase text-sm">Connect GitHub Source</span>
                    </>
                )}
            </button>

            <div className="mt-4 flex items-start gap-2 text-[10px] text-[#555] font-mono border-l-2 border-[#E5E5E5] pl-3 py-1">
                <span className="text-[#FF4F00] font-bold">WARNING:</span>
                <p>READ-ONLY TOKEN REQUIRED. SOURCE CODE IS PROCESSED IN VOLATILE MEMORY.</p>
            </div>
        </div>
    );
}
