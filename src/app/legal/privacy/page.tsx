export default function PrivacyPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Privacy Policy</h1>
                <p className="text-neutral-500 font-mono text-sm">Effective Date: January 19, 2026</p>
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
                    <strong>Contact:</strong> <a href="mailto:founder@lexoculus.com" className="text-blue-600 hover:underline">founder@lexoculus.com</a>
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">2. Information We Collect</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-wider border-b-2 border-neutral-200 bg-neutral-50">
                            <tr>
                                <th scope="col" className="px-6 py-4">Category</th>
                                <th scope="col" className="px-6 py-4">Data Collected</th>
                                <th scope="col" className="px-6 py-4">Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 border-t border-neutral-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">Account Data</th>
                                <td className="px-6 py-4">Email, Name, GitHub Username</td>
                                <td className="px-6 py-4">Account creation, authentication</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">Usage Data</th>
                                <td className="px-6 py-4">IP address, browser type</td>
                                <td className="px-6 py-4">Service improvement, security</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">Repository Data</th>
                                <td className="px-6 py-4">File tree, code snippets</td>
                                <td className="px-6 py-4">Compliance analysis (ephemeral)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">3. How We Use Your Data</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>To provide and operate the Service.</li>
                    <li>To generate compliance reports.</li>
                    <li>To communicate service updates.</li>
                    <li>To improve the Service based on aggregate, anonymized usage patterns.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">4. Legal Basis (GDPR Article 6)</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Contract:</strong> Processing necessary to perform the Service you requested.</li>
                    <li><strong>Legitimate Interest:</strong> Security monitoring, fraud prevention.</li>
                    <li><strong>Consent:</strong> Where required for specific optional features.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">5. Data Retention</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Account Data:</strong> Retained while your account is active. Deleted upon account deletion request.</li>
                    <li><strong>Scan Reports:</strong> Stored for your access history. Deleted upon account deletion.</li>
                    <li><strong>Source Code:</strong> <strong>NOT permanently stored.</strong> Code is processed in temporary memory during analysis and discarded immediately after report generation.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">6. Third-Party Processors</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-wider border-b-2 border-neutral-200 bg-neutral-50">
                            <tr>
                                <th scope="col" className="px-6 py-4">Provider Type</th>
                                <th scope="col" className="px-6 py-4">Purpose</th>
                                <th scope="col" className="px-6 py-4">Data Shared</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 border-t border-neutral-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">Cloud Infrastructure</th>
                                <td className="px-6 py-4">Hosting, CDN</td>
                                <td className="px-6 py-4">All service data (encrypted)</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">Database & Auth</th>
                                <td className="px-6 py-4">Storage, Authentication</td>
                                <td className="px-6 py-4">Account data, encrypted tokens</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">AI/ML Services</th>
                                <td className="px-6 py-4">Code analysis</td>
                                <td className="px-6 py-4">Anonymized snippets</td>
                            </tr>
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">Payment Provider</th>
                                <td className="px-6 py-4">Billing (Coming Soon)</td>
                                <td className="px-6 py-4">Billing information</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-sm text-neutral-500 mt-2">
                    All sub-processors are contractually bound by Data Processing Agreements (DPAs) that ensure GDPR-compliant data handling.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">7. Your Rights Under GDPR</h2>
                <p>You have the following rights regarding your personal data:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Right of Access (Art. 15):</strong> Request a copy of your personal data.</li>
                    <li><strong>Right to Rectification (Art. 16):</strong> Correct inaccurate data.</li>
                    <li><strong>Right to Erasure (Art. 17):</strong> Request deletion of your data ("Right to be Forgotten").</li>
                    <li><strong>Right to Data Portability (Art. 20):</strong> Receive your data in a machine-readable format.</li>
                    <li><strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate interest.</li>
                    <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw at any time.</li>
                </ul>
                <p>
                    To exercise these rights, contact: <a href="mailto:founder@lexoculus.com" className="text-blue-600 hover:underline">founder@lexoculus.com</a>. We will respond within 30 days.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">8. International Transfers</h2>
                <p>
                    Data may be processed in regions outside the European Economic Area (EEA). Where this occurs, we ensure appropriate safeguards are in place (e.g., Standard Contractual Clauses).
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">9. Cookies</h2>
                <p>
                    We use essential cookies for authentication and session management. We do not use third-party advertising or tracking cookies.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">10. Children's Privacy</h2>
                <p>
                    The Service is not intended for individuals under <strong>16 years of age</strong>. We do not knowingly collect data from children. If we become aware of such collection, we will delete the data promptly.
                </p>
            </section>
        </div>
    );
}
