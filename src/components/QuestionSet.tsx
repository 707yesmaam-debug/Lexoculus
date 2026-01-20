'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
// We'll update QuestionFileUpload if needed, for now assuming it handles its own styles or will inherit some globals
import QuestionFileUpload from './QuestionFileUpload';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

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
    isPro?: boolean;
}

export default function QuestionSet({
    questionSet,
    answers,
    onAnswerChange,
    isExpanded: defaultExpanded = true,
    riskAssessmentId,
    isPro = false,
}: QuestionSetProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const answeredCount = questionSet.questions.filter(q =>
        answers[q.id] !== undefined && answers[q.id] !== ''
    ).length;

    const isComplete = answeredCount === questionSet.questions.length;

    return (
        <div className="border-2 border-black bg-white mb-6">
            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors cursor-pointer border-b border-black md:border-b-0"
                style={{ borderBottomWidth: isExpanded ? '1px' : '0px' }}
            >
                <div className="flex items-center gap-4">
                    <h3 className="font-serif text-lg font-bold text-black">{questionSet.title}</h3>
                    {questionSet.required && (
                        <span className="font-mono text-[10px] uppercase text-[#FF4F00] border border-[#FF4F00] px-2 py-0.5 tracking-widest">
                            Required
                        </span>
                    )}
                    <span className="font-mono text-xs text-[#999]">
                        [{answeredCount}/{questionSet.questions.length}]
                    </span>
                    {isComplete && (
                        <CheckCircle2 className="w-5 h-5 text-black" />
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-black" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-black" />
                )}
            </div>

            {/* Questions */}
            {isExpanded && (
                <div className="p-4 md:p-6 space-y-12 animate-in slide-in-from-top-2 duration-300">
                    {questionSet.description && (
                        <p className="font-mono text-sm text-[#555] border-l-2 border-[#E5E5E5] pl-4">{questionSet.description}</p>
                    )}

                    {questionSet.questions.map((question, idx) => (
                        <div key={question.id} className="group">
                            {/* Question text */}
                            <div className="flex items-start gap-4 mb-4">
                                <span className="font-mono text-xl font-bold text-black/20 group-hover:text-[#FF4F00] transition-colors">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </span>
                                <div className="flex-1 space-y-2">
                                    <Label className="font-serif text-lg font-medium text-black block leading-tight">
                                        {question.question}
                                        {question.required && <span className="text-[#FF4F00] ml-1">*</span>}
                                    </Label>

                                    {question.helpText && (
                                        <p className="font-mono text-xs text-[#999] flex items-center gap-1.5">
                                            <HelpCircle className="w-3 h-3" />
                                            {question.helpText}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Answer input */}
                            <div className="ml-10 md:ml-12 pl-4 border-l border-[#E5E5E5]">
                                {question.type === 'multiple_choice' && question.options && (
                                    <RadioGroup
                                        value={answers[question.id] as string}
                                        onValueChange={(val) => onAnswerChange(question.id, val)}
                                        className="gap-3"
                                    >
                                        {question.options.map(option => (
                                            <div key={option.value} className="relative">
                                                <RadioGroupItem
                                                    value={option.value}
                                                    id={`${question.id}-${option.value}`}
                                                    className="peer sr-only" // Hide default radio
                                                />
                                                <label
                                                    htmlFor={`${question.id}-${option.value}`}
                                                    className="flex items-center p-4 border border-[#E5E5E5] cursor-pointer hover:bg-[#FAFAFA] peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white peer-data-[state=checked]:hover:bg-black peer-data-[state=checked]:hover:text-white transition-all peer-focus:ring-1 peer-focus:ring-black peer-data-[state=checked]:[&_.check-indicator]:opacity-100"
                                                >
                                                    <div className="w-4 h-4 border border-current mr-3 flex items-center justify-center">
                                                        <div className="check-indicator w-2 h-2 bg-current opacity-0 transition-opacity" />
                                                    </div>
                                                    <span className="font-mono text-sm flex-1">{option.label}</span>

                                                    {option.riskImpact === 'escalates' && (
                                                        <span className="font-mono text-[10px] uppercase text-[#FF4F00] border border-[#FF4F00] px-2 py-0.5 ml-2 bg-white peer-data-[state=checked]:text-black peer-data-[state=checked]:border-transparent">
                                                            Risk
                                                        </span>
                                                    )}
                                                </label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}

                                {question.type === 'boolean' && (
                                    <RadioGroup
                                        value={answers[question.id] === true ? 'true' : answers[question.id] === false ? 'false' : undefined}
                                        onValueChange={(val) => onAnswerChange(question.id, val === 'true')}
                                        className="flex gap-4"
                                    >
                                        {['true', 'false'].map((val) => (
                                            <div key={val} className="relative">
                                                <RadioGroupItem
                                                    value={val}
                                                    id={`${question.id}-${val}`}
                                                    className="peer sr-only"
                                                />
                                                <label
                                                    htmlFor={`${question.id}-${val}`}
                                                    className="flex items-center px-6 py-3 border border-[#E5E5E5] cursor-pointer hover:bg-[#FAFAFA] peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white peer-data-[state=checked]:hover:bg-black peer-data-[state=checked]:hover:text-white transition-all min-w-[100px] justify-center"
                                                >
                                                    <span className="font-mono text-sm font-bold uppercase">{val === 'true' ? 'YES' : 'NO'}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}

                                {question.type === 'text' && (
                                    <Textarea
                                        value={(answers[question.id] as string) || ''}
                                        onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                        placeholder="INPUT_RESPONSE..."
                                        className="bg-[#FAFAFA] border-[#E5E5E5] min-h-[120px] font-mono text-sm focus:border-black focus:ring-0 rounded-none resize-y placeholder:text-[#999]"
                                    />
                                )}

                                {question.type === 'file_upload' && riskAssessmentId && (
                                    <div className={`border border-dashed ${isPro ? 'border-[#999] bg-[#FAFAFA]' : 'border-[#E5E5E5] bg-[#F5F5F5]'} p-6`}>
                                        {isPro ? (
                                            <QuestionFileUpload
                                                questionId={question.id}
                                                riskAssessmentId={riskAssessmentId}
                                                currentValue={answers[question.id] as string}
                                                onUploadComplete={(url) => onAnswerChange(question.id, url)}
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <div className="flex justify-center mb-3">
                                                    <div className="w-10 h-10 bg-[#E5E5E5] flex items-center justify-center rounded-full">
                                                        <HelpCircle className="w-5 h-5 text-[#999]" />
                                                        {/* Using HelpCircle as generic lock icon fallback since Lock might need import */}
                                                    </div>
                                                </div>
                                                <p className="font-mono text-xs uppercase tracking-widest text-[#555] mb-2">Evidence Upload Locked</p>
                                                <p className="font-mono text-[10px] text-[#999] mb-4 max-w-xs mx-auto">
                                                    Secure evidence storage is available for Pro plans.
                                                </p>
                                                <a href="/pricing" className="inline-block bg-black text-white px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-[#FF4F00] transition-colors">
                                                    Upgrade_to_Upload
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
