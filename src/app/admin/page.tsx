/**
 * Admin Dashboard
 * 
 * Platform administration panel - protected by ADMIN_EMAIL
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
    total_users: number;
    total_scans: number;
    total_pr_scans: number;
    total_reports: number;
    pro_users: number;
    active_github_installs: number;
    mrr: number;
}

interface User {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    subscription: {
        tier: string;
        status: string;
        is_manual_grant: boolean;
        current_period_end: string | null;
    } | null;
    usage: {
        repo_scans: number;
        pr_scans: number;
        compliance_reports: number;
    };
}

interface RecentScan {
    id: string;
    repo_name: string;
    repo_owner: string;
    scanned_at: string;
    user: { email: string };
}

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'feedback' | 'subscriptions'>('overview');

    // Data
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    interface Feedback {
        id: string;
        user_id: string | null;
        rating: number;
        comment: string | null;
        page_url: string | null;
        created_at: string;
        user: { email: string } | null;
    }
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

    // Actions
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [grantEmail, setGrantEmail] = useState('');
    const [grantDays, setGrantDays] = useState('30');
    const [grantReason, setGrantReason] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'overview') {
                const res = await fetch('/api/admin?section=overview');
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    if (res.status === 403) {
                        // If it's a specific auth error, we might want to show it instead of redirecting
                        // But for now, let's allow seeing the error if admin is configured but denied
                        if (data.error === 'Access denied - not an admin') {
                            throw new Error(data.error);
                        }
                        router.push('/dashboard/scanner');
                        return;
                    }
                    throw new Error(data.error || 'Failed to fetch stats');
                }
                const data = await res.json();
                setStats(data.stats);
                setRecentScans(data.recent_scans || []);
            } else if (activeTab === 'users') {
                const res = await fetch('/api/admin?section=users');
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Failed to fetch users');
                }
                const data = await res.json();
                setUsers(data.users || []);
            } else if (activeTab === 'feedback') {
                const res = await fetch('/api/admin?section=feedback');
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Failed to fetch feedback');
                }
                const data = await res.json();
                setFeedbacks(data.feedbacks || []);
            }
        } catch (err) {
            setError('Access denied or failed to load');
        } finally {
            setLoading(false);
        }
    };

    const handleGrantPro = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setActionMessage(null);

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'grant_pro',
                    user_email: grantEmail,
                    duration_days: parseInt(grantDays),
                    reason: grantReason || 'Granted by admin',
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setActionMessage({ type: 'success', text: data.message });
                setGrantEmail('');
                setGrantReason('');
                fetchData();
            } else {
                setActionMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: 'Failed to grant Pro' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokePro = async (userId: string, email: string) => {
        if (!confirm(`Revoke Pro from ${email}?`)) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'revoke_pro',
                    user_id: userId,
                }),
            });

            if (res.ok) {
                setActionMessage({ type: 'success', text: `Pro revoked from ${email}` });
                fetchData();
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: 'Failed to revoke Pro' });
        } finally {
            setActionLoading(false);
        }
    };

    // ... (rest of loading/error states)
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400">Platform management and user administration</p>
                </div>

                {/* Action Message */}
                {actionMessage && (
                    <div className={`mb-6 p-4 rounded-lg ${actionMessage.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-red-500/20 border border-red-500/50 text-red-400'
                        }`}>
                        {actionMessage.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-gray-800">
                    {['overview', 'users', 'feedback', 'subscriptions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === tab
                                ? 'text-cyan-400 border-b-2 border-cyan-400'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Total Users" value={stats.total_users} />
                            <StatCard label="Pro Users" value={stats.pro_users} highlight />
                            <StatCard label="MRR" value={`€${stats.mrr}`} highlight />
                            <StatCard label="Total Scans" value={stats.total_scans} />
                            <StatCard label="PR Scans" value={stats.total_pr_scans} />
                            <StatCard label="Reports" value={stats.total_reports} />
                            <StatCard label="Feedback" value={(stats as any).total_feedback || 0} />
                            <StatCard label="GitHub Installs" value={stats.active_github_installs} />
                        </div>

                        {/* Quick Grant Pro */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Quick Grant Pro</h2>
                            <form onSubmit={handleGrantPro} className="flex flex-wrap gap-4">
                                <input
                                    type="email"
                                    placeholder="user@email.com"
                                    value={grantEmail}
                                    onChange={(e) => setGrantEmail(e.target.value)}
                                    required
                                    className="flex-1 min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                />
                                <select
                                    value={grantDays}
                                    onChange={(e) => setGrantDays(e.target.value)}
                                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                >
                                    <option value="7">7 days</option>
                                    <option value="30">30 days</option>
                                    <option value="90">90 days</option>
                                    <option value="365">1 year</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Reason (optional)"
                                    value={grantReason}
                                    onChange={(e) => setGrantReason(e.target.value)}
                                    className="flex-1 min-w-[150px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                />
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Granting...' : 'Grant Pro'}
                                </button>
                            </form>
                        </div>

                        {/* Recent Scans */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Recent Scans</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-400 border-b border-gray-800">
                                            <th className="pb-2">Repository</th>
                                            <th className="pb-2">User</th>
                                            <th className="pb-2">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentScans.map((scan) => (
                                            <tr key={scan.id} className="border-b border-gray-800/50">
                                                <td className="py-3 text-white">
                                                    {scan.repo_owner}/{scan.repo_name}
                                                </td>
                                                <td className="py-3 text-gray-400">{scan.user.email}</td>
                                                <td className="py-3 text-gray-500">
                                                    {new Date(scan.scanned_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">User Feedback</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-800">
                                        <th className="pb-2 w-20">Rating</th>
                                        <th className="pb-2">Comment</th>
                                        <th className="pb-2">User</th>
                                        <th className="pb-2">Page</th>
                                        <th className="pb-2 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedbacks.map((fb) => (
                                        <tr key={fb.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded text-sm font-bold ${fb.rating >= 4 ? 'bg-green-500/20 text-green-400' :
                                                    fb.rating <= 2 ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {fb.rating} / 5
                                                </span>
                                            </td>
                                            <td className="py-4 text-white max-w-md">
                                                {fb.comment || <span className="text-gray-600 italic">No comment</span>}
                                            </td>
                                            <td className="py-4 text-gray-400 text-sm">
                                                {fb.user?.email || <span className="text-gray-600">Anonymous</span>}
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm max-w-xs truncate" title={fb.page_url || ''}>
                                                {fb.page_url?.replace('http://localhost:3000', '').replace('https://compliance-ai-beta.vercel.app', '') || '-'}
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm text-right">
                                                {new Date(fb.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {feedbacks.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                No feedback received yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">All Users ({users.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-800">
                                        <th className="pb-2">Email</th>
                                        <th className="pb-2">Tier</th>
                                        <th className="pb-2">Scans</th>
                                        <th className="pb-2">Reports</th>
                                        <th className="pb-2">Joined</th>
                                        <th className="pb-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-800/50">
                                            <td className="py-3 text-white">{user.email}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-sm ${user.subscription?.tier === 'pro'
                                                    ? 'bg-cyan-500/20 text-cyan-400'
                                                    : 'bg-gray-700 text-gray-400'
                                                    }`}>
                                                    {user.subscription?.tier || 'free'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-400">{user.usage.repo_scans}</td>
                                            <td className="py-3 text-gray-400">{user.usage.compliance_reports}</td>
                                            <td className="py-3 text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3">
                                                {user.subscription?.tier === 'pro' ? (
                                                    <button
                                                        onClick={() => handleRevokePro(user.id, user.email)}
                                                        className="text-red-400 hover:text-red-300 text-sm"
                                                    >
                                                        Revoke Pro
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setGrantEmail(user.email);
                                                            setActiveTab('overview');
                                                        }}
                                                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                                                    >
                                                        Grant Pro
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
    return (
        <div className={`p-6 rounded-xl ${highlight
            ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/50'
            : 'bg-gray-900/50 border border-gray-800'
            }`}>
            <div className="text-gray-400 text-sm mb-1">{label}</div>
            <div className={`text-3xl font-bold ${highlight ? 'text-cyan-400' : 'text-white'}`}>
                {value}
            </div>
        </div>
    );
}
