'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import QuestionFileUpload from './QuestionFileUpload';

interface QuestionOption {
    value: string;
    label: string;
    riskImpact?: string;
}

interface Question {
    id: string;
    question: string;
    type: string;
    options?: QuestionOption[];
    required: boolean;
    helpText?: string;
}

interface QuestionSetData {
    set_id: string;
    title: string;
    description?: string;
    required: boolean;
    questions: Question[];
}

interface QuestionSetProps {
    questionSet: QuestionSetData;
    answers: Record<string, string | boolean>;
    onAnswerChange: (questionId: string, value: string | boolean) => void;
    isExpanded?: boolean;
    riskAssessmentId?: string;
}

export default function QuestionSet({
    questionSet,
    answers,
    onAnswerChange,
    isExpanded: defaultExpanded = true,
    riskAssessmentId,
}: QuestionSetProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const answeredCount = questionSet.questions.filter(q =>
        answers[q.id] !== undefined && answers[q.id] !== ''
    ).length;

    const isComplete = answeredCount === questionSet.questions.length;

    return (
        <div className="border border-zinc-800 bg-zinc-950/50">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-zinc-200 font-medium">{questionSet.title}</span>
                    {questionSet.required && (
                        <span className="px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Required
                        </span>
                    )}
                    <span className="text-xs text-zinc-500">
                        {answeredCount}/{questionSet.questions.length} answered
                    </span>
                    {isComplete && (
                        <span className="text-emerald-400 text-xs">✓</span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                )}
            </button>

            {/* Questions */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-6 border-t border-zinc-800">
                    {questionSet.description && (
                        <p className="text-zinc-500 text-sm pt-4">{questionSet.description}</p>
                    )}

                    {questionSet.questions.map((question, idx) => (
                        <div key={question.id} className="pt-4">
                            {/* Question text */}
                            <div className="flex items-start gap-2 mb-3">
                                <span className="text-zinc-600 text-sm">{idx + 1}.</span>
                                <div className="flex-1">
                                    <p className="text-zinc-200 text-sm">
                                        {question.question}
                                        {question.required && (
                                            <span className="text-amber-400 ml-1">*</span>
                                        )}
                                    </p>
                                    {question.helpText && (
                                        <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                                            <HelpCircle className="w-3 h-3" />
                                            {question.helpText}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Answer input */}
                            {question.type === 'multiple_choice' && question.options && (
                                <div className="space-y-2 ml-5">
                                    {question.options.map(option => (
                                        <label
                                            key={option.value}
                                            className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${answers[question.id] === option.value
                                                ? 'border-blue-500/50 bg-blue-500/10'
                                                : 'border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={question.id}
                                                value={option.value}
                                                checked={answers[question.id] === option.value}
                                                onChange={() => onAnswerChange(question.id, option.value)}
                                                className="w-4 h-4 accent-blue-500"
                                            />
                                            <span className="text-zinc-300 text-sm">{option.label}</span>
                                            {option.riskImpact === 'escalates' && (
                                                <span className="ml-auto px-1.5 py-0.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30">
                                                    ⚠️ Risk
                                                </span>
                                            )}
                                            {option.riskImpact === 'mitigates' && (
                                                <span className="ml-auto px-1.5 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                    ✓ Mitigation
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {question.type === 'boolean' && (
                                <div className="flex gap-4 ml-5">
                                    <label
                                        className={`flex items-center gap-2 px-4 py-2 border cursor-pointer transition-colors ${answers[question.id] === true
                                            ? 'border-blue-500/50 bg-blue-500/10'
                                            : 'border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={question.id}
                                            checked={answers[question.id] === true}
                                            onChange={() => onAnswerChange(question.id, true)}
                                            className="w-4 h-4 accent-blue-500"
                                        />
                                        <span className="text-zinc-300 text-sm">Yes</span>
                                    </label>
                                    <label
                                        className={`flex items-center gap-2 px-4 py-2 border cursor-pointer transition-colors ${answers[question.id] === false
                                            ? 'border-blue-500/50 bg-blue-500/10'
                                            : 'border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={question.id}
                                            checked={answers[question.id] === false}
                                            onChange={() => onAnswerChange(question.id, false)}
                                            className="w-4 h-4 accent-blue-500"
                                        />
                                        <span className="text-zinc-300 text-sm">No</span>
                                    </label>
                                </div>
                            )}

                            {question.type === 'text' && (
                                <textarea
                                    value={(answers[question.id] as string) || ''}
                                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                    placeholder="Enter your answer..."
                                    className="w-full ml-5 p-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                                    rows={3}
                                />
                            )}

                            {question.type === 'file_upload' && riskAssessmentId && (
                                <div className="ml-5">
                                    <QuestionFileUpload
                                        questionId={question.id}
                                        riskAssessmentId={riskAssessmentId}
                                        currentValue={answers[question.id] as string}
                                        onUploadComplete={(url) => onAnswerChange(question.id, url)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
