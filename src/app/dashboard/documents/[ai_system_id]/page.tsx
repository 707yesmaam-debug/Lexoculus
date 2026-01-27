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

    const [isPro, setIsPro] = useState(false);
    const [checkingSubscription, setCheckingSubscription] = useState(true);

    useEffect(() => {
        fetchAiSystem();
        fetchDocuments();
        fetchSubscription();
    }, [aiSystemId]);

    const fetchSubscription = async () => {
        try {
            const res = await fetch('/api/subscription/status');
            if (res.ok) {
                const data = await res.json();
                setIsPro(data.tier !== 'free');
            }
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
        } finally {
            setCheckingSubscription(false);
        }
    };

    const fetchAiSystem = async () => {
        try {
            const res = await fetch(`/api/ai-systems/${aiSystemId}`);
            if (res.ok) {
                const data = await res.json();
                setAiSystem(data);
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

    const generateDocument = async (docType: string) => {
        setGenerating(docType);
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ai_system_id: aiSystemId,
                    document_type: docType,
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
                a.download = `compliance-document-${docId}.pdf`;
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
                                                    {isPro ? (
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
                                                    ) : (
                                                        <Link href="/pricing">
                                                            <Button
                                                                size="sm"
                                                                className="bg-white text-[#999] border border-[#E5E5E5] hover:border-black hover:text-black rounded-none font-mono text-xs"
                                                            >
                                                                <Lock className="w-3 h-3 mr-1" /> PDF
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </>
                                            ) : (
                                                isPro ? (
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
                                                ) : (
                                                    <Link href="/pricing">
                                                        <Button
                                                            className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs"
                                                        >
                                                            UPGRADE_TO_PRO
                                                        </Button>
                                                    </Link>
                                                )
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
