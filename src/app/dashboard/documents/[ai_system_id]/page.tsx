'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, RefreshCw, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    useEffect(() => {
        fetchAiSystem();
        fetchDocuments();
    }, [aiSystemId]);

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
        setSelectedDoc(doc);
        try {
            const res = await fetch(`/api/documents/${doc.id}`);
            if (res.ok) {
                const data = await res.json();
                const content = data.content?.markdown || '';
                setDocContent(content);
            }
        } catch (error) {
            console.error('Failed to load document:', error);
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

                                                    {/* View Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => viewDocument(doc)}
                                                        className="border-black rounded-none font-mono text-xs"
                                                    >
                                                        VIEW
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

            {/* Document Viewer Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b-2 border-black bg-[#F5F5F5] flex items-center justify-between">
                            <h3 className="font-serif text-xl font-bold">{selectedDoc.title}</h3>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 font-mono text-xs ${getCompletionColor(selectedDoc.completion_percent)}`}>
                                    {selectedDoc.completion_percent}%
                                </span>
                                <button
                                    onClick={() => { setSelectedDoc(null); setDocContent(''); }}
                                    className="text-[#999] hover:text-black text-xl"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <div
                                className="prose prose-sm max-w-none font-mono text-sm whitespace-pre-wrap"
                                style={{ fontFamily: 'monospace' }}
                            >
                                {docContent.split(/(\{\{MISSING:[^}]+\}\})/).map((part, i) => {
                                    if (part.startsWith('{{MISSING:')) {
                                        return (
                                            <span
                                                key={i}
                                                className="bg-orange-100 text-orange-700 px-1 rounded"
                                            >
                                                {part}
                                            </span>
                                        );
                                    }
                                    return <span key={i}>{part}</span>;
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t-2 border-black bg-[#F5F5F5] flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => { setSelectedDoc(null); setDocContent(''); }}
                                className="border-black rounded-none font-mono text-xs"
                            >
                                CLOSE
                            </Button>
                            <Button
                                onClick={() => exportPdf(selectedDoc.id)}
                                disabled={exporting === selectedDoc.id}
                                className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs"
                            >
                                {exporting === selectedDoc.id ? 'EXPORTING...' : 'EXPORT PDF'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
