import { prisma } from '@/lib/infra/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Github, AlertCircle } from 'lucide-react';
import OpticalLogo from '@/components/OpticalLogo'; // Or a firm logo if configured later

export default async function ClientOnboardingPage(props: { 
    params: Promise<{ token: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { token } = await props.params;
    const searchParams = await props.searchParams;
    const forceReconnect = searchParams?.reconnect === 'true';

    // Fetch the client by token
    const client = await (prisma as any).firmClient.findUnique({
        where: { onboard_token: token },
        include: { firm: true }
    });

    if (!client || !(client as any).firm) {
        return notFound();
    }

    const isReconnected = searchParams?.success === 'reconnected';

    if ((client as any).status === 'active' && !forceReconnect) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-6 text-black">
                <div className="max-w-md w-full bg-white border border-black p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 text-green-700">
                        <ShieldCheck className="w-8 h-8" />
                        <h1 className="font-serif text-2xl font-bold">
                            {isReconnected ? 'Connection Updated' : 'Access Granted'}
                        </h1>
                    </div>
                    <p className="font-mono text-sm text-[#555] mb-8 leading-relaxed">
                        {isReconnected 
                            ? `Your GitHub connection for ${(client as any).firm.name} has been successfully updated. You can now close this window.`
                            : `You have successfully authorized ${(client as any).firm.name} to perform compliance audits on your selected repositories. No further action is required.`
                        }
                    </p>
                    <div className="pt-6 border-t border-[#E5E5E5] flex flex-col items-center gap-4">
                        <Link 
                            href={`/onboard/${token}?reconnect=true`}
                            className="font-mono text-[10px] text-[#FF4F00] uppercase tracking-widest hover:underline"
                        >
                            Update Permissions or Reconnect GitHub
                        </Link>
                        <span className="font-mono text-xs text-[#999] uppercase tracking-widest">
                            SECURE_CONNECTION_ESTABLISHED
                        </span>
                    </div>
                </div>
            </div>
        );
    }
 
    const isExpired = (client as any).onboard_token_expires && new Date() > new Date((client as any).onboard_token_expires);

    if (isExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-6 text-black">
                <div className="max-w-md w-full bg-white border border-black p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 text-red-700">
                        <AlertCircle className="w-8 h-8" />
                        <h1 className="font-serif text-2xl font-bold">Link Expired</h1>
                    </div>
                    <p className="font-mono text-sm text-[#555] mb-8 leading-relaxed">
                        This authorization link has expired for security reasons. Please contact <strong>{client.firm.name}</strong> to request a new link.
                    </p>
                    <div className="pt-6 border-t border-[#E5E5E5] text-center">
                        <span className="font-mono text-xs text-[#999] uppercase tracking-widest">
                            ERROR: TOKEN_EXPIRED
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Connect URL for GitHub OAuth. 
    // We pass the token in state parameter to associate the callback with this client.
    const oauthUrl = `/api/auth/delegated-github?token=${token}`;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F5F5] text-black">
            {/* Context Chassis */}
            <aside className="w-full md:w-[450px] border-b-2 md:border-b-0 md:border-r-2 border-black p-8 md:p-12 flex flex-col bg-white">
                <div className="flex-1">
                    <div className="mb-12">
                        {/* If firm has a logo we show it, else default or text */}
                        <div className="font-serif text-2xl font-bold border-b-2 border-black pb-4 inline-block">
                            {(client as any).firm.name}
                        </div>
                    </div>
                    
                    <h1 className="font-serif text-3xl font-bold mb-6">
                        Repository Authorization Request.
                    </h1>
                    
                    <div className="space-y-6 font-mono text-sm text-[#555] leading-relaxed">
                        <p>
                            Hello <strong>{(client as any).client_name}</strong>,
                        </p>
                        <p>
                            <strong>{(client as any).firm.name}</strong> has requested delegated access to scan your repositories for compliance with the EU AI Act using the LexOculus platform.
                        </p>
                        
                        <div className="bg-orange-50 border border-[#FF4F00] p-4 text-[#FF4F00]">
                            <strong>SECURITY GUARANTEE:</strong><br/>
                            We request <strong>READ-ONLY</strong> access. Code is never stored permanently. Scans are executed in secure, ephermal environments and immediately purged.
                        </div>
                    </div>
                </div>

                <div className="hidden md:block font-mono text-[10px] text-[#999] pt-8 border-t border-[#E5E5E5]">
                    <div>POWERED_BY: LEXOCULUS_AUDIT_ENGINE</div>
                    <div>STATUS: AWAITING_AUTHORIZATION</div>
                </div>
            </aside>

            {/* Action Chassis */}
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="font-mono text-xs text-[#FF4F00] mb-8 tracking-widest uppercase text-center block">
                        // Grant_Access
                    </div>

                    <div className="bg-white border border-black p-8 shadow-sm">
                        <div className="text-center mb-8">
                            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-black" />
                            <h2 className="font-mono font-bold text-lg uppercase tracking-wider mb-2">Authorize Connection</h2>
                            <p className="font-mono text-xs text-[#555]">
                                You will be redirected to GitHub to select which repositories <strong>{(client as any).firm.name}</strong> can access.
                            </p>
                        </div>

                        <Link 
                            href={oauthUrl}
                            className="w-full bg-black hover:bg-[#FF4F00] text-white font-mono font-bold py-4 text-sm transition-colors flex items-center justify-center gap-3 uppercase tracking-widest border border-black"
                        >
                            <Github className="w-5 h-5" />
                            Connect via GitHub -&gt;
                        </Link>
                        
                        <div className="mt-6 text-center text-[10px] font-mono text-[#999] uppercase">
                            By clicking connect, you accept the LexOculus Terms of Service & Privacy Policy on behalf of your organization.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
