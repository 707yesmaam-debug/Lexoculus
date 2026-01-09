'use client';

import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Loader2, X, FileText } from 'lucide-react';

interface QuestionFileUploadProps {
    questionId: string;
    onUploadComplete: (url: string) => void;
    currentValue?: string;
    riskAssessmentId: string;
}

export default function QuestionFileUpload({
    questionId,
    onUploadComplete,
    currentValue,
    riskAssessmentId,
}: QuestionFileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset
        setError(null);

        // Validation (Max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size exceeds 5MB limit.');
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('questionId', questionId);
            formData.append('riskAssessmentId', riskAssessmentId);

            const res = await fetch('/api/upload-evidence', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await res.json();
            onUploadComplete(data.url); // Pass the public/signed URL back to the form

        } catch (err) {
            console.error('Upload Error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (currentValue) {
        return (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm text-emerald-300 font-medium truncate">
                        Evidence Uploaded
                    </p>
                    <a
                        href={currentValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-500 hover:text-emerald-400 underline"
                    >
                        View Document
                    </a>
                </div>
                <button
                    onClick={() => onUploadComplete('')} // Clear value
                    className="p-1 hover:bg-emerald-500/20 rounded-full transition-colors"
                >
                    <X className="w-4 h-4 text-emerald-400" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`w-full flex items-center justify-center gap-2 p-4 border border-dashed rounded-lg transition-colors ${error
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-600'
                    }`}
            >
                {isUploading ? (
                    <>
                        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                        <span className="text-zinc-400 text-sm">Uploading...</span>
                    </>
                ) : (
                    <>
                        <UploadCloud className={`w-5 h-5 ${error ? 'text-red-400' : 'text-zinc-500'}`} />
                        <span className={`${error ? 'text-red-400' : 'text-zinc-400'} text-sm`}>
                            {error || 'Click to upload evidence (PDF, PNG, DOCX)'}
                        </span>
                    </>
                )}
            </button>
        </div>
    );
}
