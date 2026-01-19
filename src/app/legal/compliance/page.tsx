export default function CompliancePage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Legal Compliance Disclaimer</h1>
                <p className="text-neutral-500 font-mono text-sm">EU AI Act (Regulation (EU) 2024/1689)</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">1. Purpose of LexOculus</h2>
                <p>
                    LexOculus is designed to assist developers and organizations in <strong>self-assessing</strong> their AI software projects against the regulatory framework of the <strong>EU Artificial Intelligence Act (Regulation (EU) 2024/1689)</strong>.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">2. Methodology</h2>
                <p>
                    Our platform employs a "Context-Aware Rule-Based Engine" that analyzes:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Project documentation (README, configuration files).</li>
                    <li>Code structure and dependencies.</li>
                    <li>User-provided context (questionnaires).</li>
                </ul>
                <p>
                    This information is mapped against the risk categories and requirements defined in the EU AI Act (Prohibited, High-Risk, Limited Risk, Minimal Risk).
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">3. Limitations</h2>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                    <h3 className="font-bold text-red-700 uppercase mb-1">Important Notice</h3>
                    <p className="text-red-800">
                        <strong>LexOculus is NOT a Notified Body.</strong> Our reports are NOT official Conformity Assessments and do NOT constitute regulatory certification.
                    </p>
                </div>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Automated & Static:</strong> Analysis is based on the information provided at the time of scan. It cannot dynamically assess runtime behavior, human-in-the-loop implementations, or evolving regulatory interpretations.</li>
                    <li><strong>Preparatory Tool:</strong> Reports are intended to aid in <em>preparation</em> for formal compliance processes, not to replace them.</li>
                    <li><strong>No Legal Status:</strong> A "Compliant" score from LexOculus has no legal standing with regulatory authorities.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold uppercase">4. Recommendation</h2>
                <p>
                    We strongly recommend that organizations pursuing formal EU AI Act compliance engage with:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Qualified legal counsel specializing in technology regulation.</li>
                    <li>Accredited Notified Bodies for official Conformity Assessments (where required for High-Risk AI systems).</li>
                </ul>
            </section>
        </div>
    );
}
