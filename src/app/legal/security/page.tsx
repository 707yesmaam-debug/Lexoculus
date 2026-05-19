export default function SecurityPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Security Policy</h1>
                <p className="text-neutral-500 font-mono text-sm">Effective Date: February 19, 2026</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">1. Data Encryption</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>At Rest:</strong> All data stored in our databases is encrypted using AES-256.</li>
                    <li><strong>In Transit:</strong> All communications are secured with TLS 1.2 or higher.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">2. Access Control</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>OAuth Tokens:</strong> Your GitHub access tokens are encrypted with AES-256 before storage and decrypted only at the moment of use.</li>
                    <li><strong>Row-Level Security:</strong> Database policies ensure strict user isolation. Users cannot access each other's scans or reports.</li>
                    <li><strong>Principle of Least Privilege:</strong> Internal systems access only the data necessary for their function.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">3. Infrastructure</h2>
                <p>
                    Our infrastructure is hosted on enterprise-grade cloud platforms (e.g., Vercel, Supabase) that maintain SOC 2 Type II and ISO 27001 certifications.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">4. Vulnerability Disclosure</h2>
                <p>
                    If you discover a security vulnerability, please report it responsibly to: <a href="mailto:varadkhoriya17@gmail.com" className="text-blue-600 hover:underline">varadkhoriya17@gmail.com</a>. We commit to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Acknowledging receipt within 48 hours.</li>
                    <li>Providing an initial assessment within 7 business days.</li>
                    <li>Resolving critical vulnerabilities promptly.</li>
                </ul>
                <p>
                    We do not currently offer a formal bug bounty program.
                </p>
            </section>
        </div>
    );
}
