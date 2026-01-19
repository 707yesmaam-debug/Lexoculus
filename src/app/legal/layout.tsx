import Link from 'next/link';
import OpticalLogo from '@/components/OpticalLogo';

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-[#FF4F00] selection:text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 border-b-2 border-black bg-white z-50 flex items-center justify-between px-6">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <OpticalLogo />
                </Link>
                <Link
                    href="/dashboard"
                    className="text-sm font-bold uppercase tracking-widest hover:text-[#FF4F00] transition-colors"
                >
                    Return to Dashboard →
                </Link>
            </header>

            <div className="pt-16 flex min-h-screen">
                {/* Sidebar Navigation */}
                <aside className="fixed left-0 top-16 bottom-0 w-64 border-r-2 border-black bg-neutral-50 p-8 hidden md:block overflow-y-auto">
                    <div className="mb-8">
                        <h2 className="font-bold uppercase tracking-widest text-xs text-neutral-500 mb-4">
                            Legal Documentation
                        </h2>
                        <nav className="flex flex-col space-y-2">
                            <LegalLink href="/legal/terms">Terms of Service</LegalLink>
                            <LegalLink href="/legal/privacy">Privacy Policy</LegalLink>
                            <LegalLink href="/legal/security">Security Policy</LegalLink>
                            <LegalLink href="/legal/compliance">EU Compliance</LegalLink>
                        </nav>
                    </div>

                    <div className="text-xs text-neutral-400 mt-auto pt-8 border-t border-neutral-200">
                        <p>© 2026 LexOculus</p>
                        <p className="mt-1">All data processed in EU/Global compliance.</p>
                    </div>
                </aside>

                {/* content */}
                <main className="flex-1 md:ml-64 p-8 md:p-16 max-w-4xl mx-auto">
                    <div className="prose prose-neutral prose-lg max-w-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="block text-sm font-medium text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200"
        >
            {children}
        </Link>
    );
}
