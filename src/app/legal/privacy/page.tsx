export default function PrivacyPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Privacy Policy</h1>
                <p className="text-neutral-500 font-mono text-sm">Effective Date: April 17, 2026</p>
            </div>

            <p>
                LexOculus is committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR) (EU) 2016/679.
            </p>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">1. Data Controller</h2>
                <p>
                    LexOculus operates as the Data Controller for personal data processed through the Service.
                </p>
                <p>
                    <strong>Contact:</strong> <a href="mailto:founder@lexoculus.com" className="text-[#FF4F00] hover:underline">founder@lexoculus.com</a>
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">2. Information We Collect</h2>
                <div className="overflow-x-auto border-2 border-black">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-widest font-mono text-xs border-b-2 border-black bg-neutral-100">
                            <tr>
                                <th scope="col" className="px-6 py-4">Category</th>
                                <th scope="col" className="px-6 py-4">Data Collected</th>
                                <th scope="col" className="px-6 py-4">Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black font-mono text-xs">
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Account Data</th>
                                <td className="px-6 py-4 border-r border-black">Email, Name, GitHub Username</td>
                                <td className="px-6 py-4">Account creation, authentication</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Usage Data</th>
                                <td className="px-6 py-4 border-r border-black">Truncated IP address, browser type</td>
                                <td className="px-6 py-4">Security, audit logging</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Repository Data</th>
                                <td className="px-6 py-4 border-r border-black">File tree, README, dependency files</td>
                                <td className="px-6 py-4">Compliance analysis</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Inquiries</th>
                                <td className="px-6 py-4 border-r border-black">Name, Email, Company</td>
                                <td className="px-6 py-4">Demo requests, sales communication</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">3. Legal Basis (GDPR Article 6)</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Contract (Art. 6(1)(b)):</strong> Processing necessary to perform the LexOculus Service you requested (e.g., scanning repos, generating reports).</li>
                    <li><strong>Legitimate Interest (Art. 6(1)(f)):</strong> Security monitoring, fraud prevention, and responding to business inquiries.</li>
                    <li><strong>Consent (Art. 6(1)(a)):</strong> Where required for specific optional features.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">4. Data Retention</h2>
                <div className="overflow-x-auto border-2 border-black">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-widest font-mono text-xs border-b-2 border-black bg-neutral-100">
                            <tr>
                                <th scope="col" className="px-6 py-4">Data Type</th>
                                <th scope="col" className="px-6 py-4">Retention Period</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black font-mono text-xs">
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Account Data</th>
                                <td className="px-6 py-4">Retained while active. Deleted upon user request.</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Repository Metadata</th>
                                <td className="px-6 py-4">Stored for 30 days to enable regenerative analysis, then automatically purged.</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Demo & Sales Inquiries</th>
                                <td className="px-6 py-4">Stored for 90 days, then automatically purged.</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Audit Logs</th>
                                <td className="px-6 py-4">Retained for 12 months for security compliance.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">5. Sub-Processors</h2>
                <p>We use the following third-party services to operate LexOculus. We have signed Data Processing Agreements with applicable sub-processors.</p>
                <div className="overflow-x-auto border-2 border-black">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-widest font-mono text-xs border-b-2 border-black bg-neutral-100">
                            <tr>
                                <th scope="col" className="px-6 py-4">Provider</th>
                                <th scope="col" className="px-6 py-4">Purpose</th>
                                <th scope="col" className="px-6 py-4">Data Shared</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black font-mono text-xs">
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Supabase (South Korea, ap-northeast-2)</th>
                                <td className="px-6 py-4 border-r border-black">Database, Authentication</td>
                                <td className="px-6 py-4">Account data, encrypted tokens, scan metadata</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Vercel (Paris, France — cdg1)</th>
                                <td className="px-6 py-4 border-r border-black">Hosting, CDN</td>
                                <td className="px-6 py-4">Anonymised metrics, request routing</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">Groq (USA)</th>
                                <td className="px-6 py-4 border-r border-black">LLM code analysis</td>
                                <td className="px-6 py-4">Repository metadata (NO training on API inputs)</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-black">DodoPayments</th>
                                <td className="px-6 py-4 border-r border-black">Merchant of Record</td>
                                <td className="px-6 py-4">Billing email, transaction history</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-sm mt-2">
                    Note on Groq: Code snippets sent for analysis are processed transiently and discarded. Following their Terms of Service, <strong>no customer data is used to train their models</strong>.
                </p>
                <p className="text-sm">
                    <strong>Enterprise Customers:</strong> Please refer to our <a href="/legal/dpa" className="text-[#FF4F00] hover:underline">Data Processing Agreement (DPA)</a>.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">6. Data Breach Notification</h2>
                <p>
                    In the event of a personal data breach, LexOculus will notify affected Data Controllers (and where applicable, Data Subjects) within <strong>72 hours</strong> of becoming aware of the breach, in compliance with GDPR Article 33.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">7. Your Rights Under GDPR</h2>
                <p>You can execute the following rights directly within your Dashboard Settings:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Right to Erasure (Art. 17):</strong> Use the "Delete Account" button to permanently and cascadedly delete all your data.</li>
                    <li><strong>Right to Data Portability (Art. 20):</strong> Use the "Export Data" button to download a JSON file of your complete data history.</li>
                </ul>
                <p>For other rights (Access, Rectification, Restriction, Objection), please contact: <a href="mailto:founder@lexoculus.com" className="text-[#FF4F00] hover:underline">founder@lexoculus.com</a>.</p>
            </section>
        </div>
    );
}
