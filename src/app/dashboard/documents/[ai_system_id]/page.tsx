'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, RefreshCw, CheckCircle, AlertCircle, Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarkdownEditor from '@/components/MarkdownEditor';

interface Document {
    id: string;
    document_type: string;
    title: string;
    status: string;
    completion_percent: number;
    missing_fields: string[] | null;
    version: number;
    created_at: string;
    updated_at: string;
}

interface AiSystem {
    id: string;
    name: string;
    latest_scan_id?: string;
    latest_scan?: {
        final_risk_assessment?: {
            id: string;
            repo_scan_id: string;
            approved_for_report: boolean;
            requires_manual_review: boolean;
            final_risk_classification: string;
            compliance_report?: {
                file_url?: string;
            } | null;
        }
    }
}

const DOCUMENT_TYPES = {
    technical_doc: { title: 'Technical Documentation', article: 'Article 11' },
    risk_management: { title: 'Risk Management Plan', article: 'Article 9' },
    data_governance: { title: 'Data Governance', article: 'Article 10' },
    instructions_for_use: { title: 'Instructions for Use', article: 'Article 13' },
    declaration_of_conformity: { title: 'Declaration of Conformity', article: 'EU AI Act' },
};

export default function DocumentsPage() {
    const params = useParams();
    const router = useRouter();
    const aiSystemId = params.ai_system_id as string;

    const [documents, setDocuments] = useState<Document[]>([]);
    const [aiSystem, setAiSystem] = useState<AiSystem | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [exporting, setExporting] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [docContent, setDocContent] = useState<string>('');
    const [openingDocId, setOpeningDocId] = useState<string | null>(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [existingReportUrl, setExistingReportUrl] = useState<string | null>(null);


    useEffect(() => {
        fetchAiSystem();
        fetchDocuments();
    }, [aiSystemId]);


    const fetchAiSystem = async () => {
        try {
            const res = await fetch(`/api/ai-systems/${aiSystemId}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const system = data.ai_system || data;
                setAiSystem(system);
                // Check if a compliance report already exists
                const reportUrl = system?.latest_scan?.final_risk_assessment?.compliance_report?.file_url;
                if (reportUrl) {
                    setExistingReportUrl(reportUrl);
                }
            }
        } catch (error) {
            console.error('Failed to fetch AI system:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/documents?ai_system_id=${aiSystemId}`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateDocument = async (docType: string, regenerate = false) => {
        setGenerating(docType);
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ai_system_id: aiSystemId,
                    document_type: docType,
                    regenerate, // Pass the flag
                }),
            });

            if (res.ok) {
                fetchDocuments();
            } else if (res.status === 409) {
                // Document already exists
                fetchDocuments();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to generate document');
            }
        } catch (error) {
            console.error('Generation error:', error);
        } finally {
            setGenerating(null);
        }
    };

    const generateOfficialReport = async (regenerate = false) => {
        const assessment = aiSystem?.latest_scan?.final_risk_assessment;
        if (!assessment?.id) return;

        // Extra guard: if not approved, don't even try to call API
        if (!assessment.approved_for_report) {
            alert('This assessment is not yet approved for report generation. Please complete all verification steps or wait for manual review.');
            return;
        }

        setGeneratingReport(true);
        try {
            const res = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    final_risk_assessment_id: assessment.id,
                    repo_scan_id: assessment.repo_scan_id,
                    regenerate
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.file_url) {
                    setExistingReportUrl(data.file_url);
                    const a = document.createElement('a');
                    a.href = data.file_url;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    alert('Official report generated but no download URL available.');
                }
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to generate official report.');
            }
        } catch (error) {
            console.error('Report generation error:', error);
            alert('Failed to generate official report. Please refresh and try again.');
        } finally {
            setGeneratingReport(false);
        }
    };


    const viewDocument = async (doc: Document) => {
        setOpeningDocId(doc.id);
        try {
            const res = await fetch(`/api/documents/${doc.id}`);
            if (res.ok) {
                const data = await res.json();
                const content = data.content?.markdown || '';
                setDocContent(content);
                setSelectedDoc(doc);
            }
        } catch (error) {
            console.error('Failed to load document:', error);
        } finally {
            setOpeningDocId(null);
        }
    };

    const handleSaveDocument = async (newContent: string) => {
        if (!selectedDoc) return;

        try {
            const res = await fetch(`/api/documents/${selectedDoc.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newContent,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // Update local document state
                setDocuments(docs => docs.map(d =>
                    d.id === selectedDoc.id
                        ? { ...d, completion_percent: data.completion_percent || d.completion_percent, status: data.status || d.status }
                        : d
                ));
                setSelectedDoc(null);
                setDocContent('');
            } else {
                alert('Failed to save document');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save document');
        }
    };

    const exportPdf = async (docId: string) => {
        setExporting(docId);
        try {
            const res = await fetch(`/api/documents/${docId}/export`, {
                method: 'POST',
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const doc = documents.find(d => d.id === docId);
                const systemName = aiSystem?.name || 'System';
                const docTitle = doc?.title || 'Document';
                const sanitizedSystem = systemName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const sanitizedTitle = docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

                a.download = `lexoculus_${sanitizedSystem}_${sanitizedTitle}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to export PDF');
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setExporting(null);
        }
    };

    const getDocumentForType = (docType: string) => {
        return documents.find(d => d.document_type === docType);
    };

    const getCompletionColor = (percent: number) => {
        if (percent === 100) return 'text-green-600 bg-green-100';
        if (percent >= 50) return 'text-yellow-600 bg-yellow-100';
        return 'text-orange-600 bg-orange-100';
    };

    const assessment = aiSystem?.latest_scan?.final_risk_assessment;
    const isUnacceptable = assessment?.final_risk_classification === 'UNACCEPTABLE';
    const isApproved = !!assessment?.approved_for_report;

    return (
        <div className="min-h-screen bg-white p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <Link
                    href="/dashboard/registry"
                    className="inline-flex items-center gap-2 text-[#999] hover:text-black font-mono text-xs uppercase tracking-widest mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Registry
                </Link>

                <h1 className="font-serif text-3xl font-bold">
                    Compliance Documents
                </h1>
                <p className="font-mono text-xs text-[#666] mt-1">
                    {aiSystem ? aiSystem.name : loading ? 'Loading...' : 'System Not Found'}
                </p>
            </div>

            {/* Document List */}
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#999]" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {/* Official Compliance Report Card */}
                        <div className={`border-2 border-black ${isUnacceptable ? 'bg-red-50' : 'bg-[#FFF5F0]'} p-6 mb-4`}>
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`px-2 py-0.5 ${isUnacceptable ? 'bg-red-600' : 'bg-black'} text-white font-mono text-[10px] uppercase tracking-widest`}>
                                            {isUnacceptable ? 'PROHIBITED_SYSTEM' : 'OFFICIAL_RECORD'}
                                        </div>
                                    </div>
                                    <h2 className="font-serif text-2xl font-bold text-black mb-1">
                                        Comprehensive Compliance Report
                                    </h2>
                                    <p className="font-mono text-xs text-[#666] max-w-xl">
                                        {isUnacceptable
                                            ? 'Under the EU AI Act, systems with UNACCEPTABLE risk are prohibited from deployment. Documentation for prohibited systems is for internal audit and cessation planning only.'
                                            : 'Consolidated PDF containing the final risk assessment, capabilities analysis, and all evidentiary responses mapped to the EU AI Act.'}
                                    </p>
                                </div>

                                <div className="flex-shrink-0 w-full md:w-auto">
                                    {assessment?.id ? (
                                        existingReportUrl ? (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => {
                                                        const a = document.createElement('a');
                                                        a.href = existingReportUrl;
                                                        a.target = '_blank';
                                                        a.rel = 'noopener noreferrer';
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                    }}
                                                    className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs uppercase tracking-widest px-6 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-y-[2px] transition-all"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    DOWNLOAD_REPORT
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (confirm('REGENERATE WARNING:\nThis will generate a fresh compliance report using the latest data.\nThe existing report will be replaced.\n\nContinue?')) {
                                                            generateOfficialReport(true);
                                                        }
                                                    }}
                                                    disabled={generatingReport || !isApproved}
                                                    className="text-[#999] hover:text-[#FF4F00] hover:bg-transparent px-2"
                                                    title="Regenerate from latest data"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${generatingReport ? 'animate-spin' : ''}`} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    onClick={() => generateOfficialReport(false)}
                                                    disabled={generatingReport || !isApproved}
                                                    className={`w-full ${isApproved ? 'bg-black hover:bg-[#FF4F00]' : 'bg-[#E5E5E5] text-[#999]'} text-white rounded-none font-mono text-xs uppercase tracking-widest px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-y-[2px] transition-all`}
                                                >
                                                    {generatingReport ? (
                                                        <>
                                                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                                            GENERATING_PDF...
                                                        </>
                                                    ) : isApproved ? (
                                                        <>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            GENERATE_MASTER_REPORT
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Lock className="w-4 h-4 mr-2" />
                                                            GENERATION_LOCKED
                                                        </>
                                                    )}
                                                </Button>
                                                {!isApproved && (
                                                    <p className="font-mono text-[10px] text-red-600 text-center uppercase tracking-tight max-w-[200px] mt-1">
                                                        {isUnacceptable
                                                            ? 'Prohibited Classification'
                                                            : assessment?.requires_manual_review
                                                                ? 'Pending Manual Review'
                                                                : 'Verification Incomplete'}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <Button
                                            disabled
                                            className="w-full bg-[#E5E5E5] text-[#999] rounded-none font-mono text-xs uppercase tracking-widest px-8 py-6 h-auto"
                                        >
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            REQUIRES_VERIFICATION
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Individual Documents Grid */}
                        <h3 className="font-serif text-xl font-bold mt-4 mb-2">Individual Artifacts</h3>
                        {Object.entries(DOCUMENT_TYPES).map(([docType, info]) => {
                            const doc = getDocumentForType(docType);
                            const isGenerating = generating === docType;

                            return (
                                <div
                                    key={docType}
                                    className="border-2 border-black p-4 hover:bg-[#F5F5F5] transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 border-2 border-black flex items-center justify-center bg-[#F5F5F5]">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-serif text-lg font-bold">{info.title}</h3>
                                                <p className="font-mono text-xs text-[#666]">{info.article}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {doc ? (
                                                <>
                                                    {/* Completion Badge */}
                                                    <span className={`px-3 py-1 font-mono text-xs ${getCompletionColor(doc.completion_percent)}`}>
                                                        {doc.completion_percent}% COMPLETE
                                                    </span>

                                                    {/* Status Icon */}
                                                    {doc.completion_percent === 100 ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <AlertCircle className="w-5 h-5 text-orange-500" />
                                                    )}

                                                    {/* View/Edit Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => viewDocument(doc)}
                                                        disabled={!!openingDocId}
                                                        className="border-black rounded-none font-mono text-xs"
                                                    >
                                                        {openingDocId === doc.id ? (
                                                            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                                        ) : null}
                                                        OPEN
                                                    </Button>

                                                    {/* Export Button */}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => exportPdf(doc.id)}
                                                        disabled={exporting === doc.id}
                                                        className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs"
                                                    >
                                                        {exporting === doc.id ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Download className="w-4 h-4 mr-1" />
                                                                PDF
                                                            </>
                                                        )}
                                                    </Button>

                                                    {/* Regenerate Button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm('REGENERATE WARNING:\nThis will overwrite your current document with the latest scan data.\nAny manual edits will be LOST.\n\nContinue?')) {
                                                                generateDocument(docType, true); // true = regenerate
                                                            }
                                                        }}
                                                        disabled={isGenerating}
                                                        className="text-[#999] hover:text-[#FF4F00] hover:bg-transparent px-2"
                                                        title="Regenerate from latest scan"
                                                    >
                                                        <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={() => generateDocument(docType)}
                                                    disabled={isGenerating}
                                                    className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs"
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                                                            GENERATING...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            GENERATE
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Missing Fields Warning */}
                                    {doc && doc.missing_fields && doc.missing_fields.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
                                            <p className="font-mono text-xs text-[#999]">
                                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                                {doc.missing_fields.length} field{doc.missing_fields.length > 1 ? 's' : ''} need attention
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Document Editor */}
            {selectedDoc && (
                <MarkdownEditor
                    title={selectedDoc.title}
                    initialContent={docContent}
                    onSave={handleSaveDocument}
                    onCancel={() => { setSelectedDoc(null); setDocContent(''); }}
                />
            )}
        </div>
    );
}
