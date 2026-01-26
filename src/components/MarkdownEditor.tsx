'use client';

import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Eye, Edit2, Columns, Save, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarkdownEditorProps {
    initialContent: string;
    onSave: (content: string) => Promise<void>;
    onCancel: () => void;
    title: string;
}

export default function MarkdownEditor({ initialContent, onSave, onCancel, title }: MarkdownEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
    const [saving, setSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-save logic could go here, but manual save is safer for now

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(content);
        } finally {
            setSaving(false);
        }
    };

    // Custom renderer for the preview to highlight missing fields
    const renderPreview = (markdown: string) => {
        let html = marked.parse(markdown) as string;

        // Replace {{MISSING: ...}} with styled badges
        // We do this post-marked processing to ensure we catch them even inside other tags
        html = html.replace(
            /\{\{MISSING:([^}]+)\}\}/g,
            '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"><svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>$1</span>'
        );

        return { __html: html };
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border-2 border-black w-full max-w-7xl h-[90vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {/* Header */}
                <div className="p-4 border-b-2 border-black bg-[#F5F5F5] flex items-center justify-between">
                    <div>
                        <h3 className="font-serif text-xl font-bold">{title}</h3>
                        <p className="font-mono text-xs text-[#666] mt-1">Markdown Editor</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-white border border-black p-1 gap-1 mr-4">
                            <button
                                onClick={() => setViewMode('edit')}
                                className={`p-1.5 ${viewMode === 'edit' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                                title="Edit Only"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('split')}
                                className={`p-1.5 ${viewMode === 'split' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                                title="Split View"
                            >
                                <Columns className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`p-1.5 ${viewMode === 'preview' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                                title="Preview Only"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="border-black rounded-none font-mono text-xs h-9"
                        >
                            <X className="w-4 h-4 mr-2" />
                            CANCEL
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs h-9 min-w-[100px]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    SAVING...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    SAVE
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Input Area */}
                    {(viewMode === 'edit' || viewMode === 'split') && (
                        <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r-2 border-black' : ''}`}>
                            <div className="bg-[#1e1e1e] text-gray-400 text-xs px-4 py-2 font-mono border-b border-gray-700 flex justify-between items-center">
                                <span>MARKDOWN INPUT</span>
                                <span className="text-[10px]">Use markdown syntax</span>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex-1 w-full p-6 resize-none focus:outline-none font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] leading-relaxed selection:bg-[#264f78]"
                                spellCheck={false}
                                placeholder="# Start typing your document..."
                            />
                        </div>
                    )}

                    {/* Preview Area */}
                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className="flex-1 flex flex-col bg-white overflow-hidden">
                            <div className="bg-[#F5F5F5] text-gray-500 text-xs px-4 py-2 font-mono border-b border-[#E5E5E5]">
                                PREVIEW
                            </div>
                            <div className="flex-1 overflow-auto p-8">
                                <article
                                    className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-code:text-[#FF4F00] prose-code:bg-orange-50 prose-code:px-1 prose-pre:bg-gray-900 prose-pre:text-gray-100"
                                    dangerouslySetInnerHTML={renderPreview(content)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
