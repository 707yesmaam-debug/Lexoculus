export default function DPAPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Data Processing Agreement</h1>
                <p className="text-neutral-500 font-mono text-sm">Effective Date: April 17, 2026</p>
            </div>

            <div className="bg-neutral-50 border-l-4 border-black p-4 my-4">
                <p className="text-sm font-mono leading-relaxed">
                    This Data Processing Agreement ("DPA") forms an integral part of the LexOculus Terms of Service or any other Enterprise Agreement between LexOculus ("Data Processor") and the Customer ("Data Controller"). To execute a counter-signed copy of this DPA, please contact <a href="mailto:varadkhoriya17@gmail.com" className="text-[#FF4F00]">varadkhoriya17@gmail.com</a>.
                </p>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">1. Subject Matter, Nature, and Purpose</h2>
                <p>
                    <strong>Subject Matter:</strong> The processing of Personal Data in connection with the provision of the LexOculus technical compliance auditing platform.
                </p>
                <p>
                    <strong>Nature and Purpose:</strong> LexOculus will process Personal Data solely to provide the Service, including repository analysis, risk classification generation, compliance report production, and related security monitoring. LexOculus does not process Personal Data for its own marketing or algorithmic training purposes.
                </p>
                <p>
                    <strong>Duration:</strong> The processing will continue for the duration of the Agreement between the parties, and until the Personal Data is deleted in accordance with Section 7.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">2. Types of Personal Data & Categories of Data Subjects</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Categories of Data Subjects:</strong> Employees, contractors, or agents of the Data Controller who access the LexOculus platform.</li>
                    <li><strong>Types of Personal Data:</strong> Identification and contact data (Name, Email), Authentication data (GitHub Usernames, Encrypted OAuth Tokens), and System interaction data (Truncated IP addresses, timestamped audit logs).</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">3. Sub-Processors</h2>
                <p>
                    The Controller agrees that the Processor may engage the following sub-processors:
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li><strong>Supabase</strong> (Database &amp; Auth — South Korea, ap-northeast-2)</li>
                    <li><strong>Vercel</strong> (Hosting &amp; CDN — Paris, France, cdg1)</li>
                    <li><strong>Groq</strong> (LLM Inference - USA)</li>
                </ul>
                <p className="text-sm mt-4 text-neutral-600">
                    LexOculus will provide 30 days prior written notice of any new sub-processors. LexOculus ensures that all sub-processors are bound by data protection obligations materially the same as those in this DPA. <strong>Note on Supabase region:</strong> Data is hosted in South Korea (AWS ap-northeast-2), which is an EU-adequate country under European Commission Adequacy Decision 2022/254. No additional safeguards (SCCs) are required. <strong>Note on Groq:</strong> Groq is contractually prohibited from using any API data for training AI models.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">4. Security Measures (Art. 32 GDPR)</h2>
                <p>LexOculus implements the following technical and organizational measures:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Encryption:</strong> Data encrypted at rest (AES-256) and in transit (TLS 1.2+).</li>
                    <li><strong>Access Control:</strong> Row-Level Security (RLS) ensures tenant isolation. Strict principle of least privilege for internal access.</li>
                    <li><strong>Certifications:</strong> Core infrastructure (Supabase, Vercel) holds SOC 2 Type II and/or ISO 27001 certifications.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">5. Data Breach Notification</h2>
                <p>
                    In the event of a Personal Data breach affecting the Controller's data, LexOculus will notify the Controller without undue delay, and no later than <strong>72 hours</strong> after becoming aware of the breach, providing sufficient information to allow the Controller to meet its obligations to report to supervisory authorities.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">6. Data Subject Rights (Art. 15-22 GDPR)</h2>
                <p>
                    LexOculus provides self-service tools within the platform enabling the Controller to export (JSON dataset) or delete data. If a Data Subject directly submits a request to LexOculus, we will forward the request to the Controller. LexOculus will assist the Controller by appropriate technical and organizational measures regarding the fulfillment of the Controller's obligations.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">7. Deletion and Return of Data</h2>
                <p>
                    Upon termination of the service, or upon written request from the Controller, LexOculus will securely delete all Personal Data associated with the Controller's account. LexOculus implements an automated 30-day purge cycle for all repository metadata in standard use.
                </p>
            </section>
            
            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">8. Governing Law</h2>
                <p>
                    Without prejudice to clauses applying the GDPR directly, this agreement is governed by the laws of India. For avoidance of doubt, LexOculus complies fully with the EU GDPR directly as a Data Processor serving customers in the European Union.
                </p>
            </section>
        </div>
    );
}
