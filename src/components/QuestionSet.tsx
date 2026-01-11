'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, CheckCircle2 } from 'lucide-react';
import QuestionFileUpload from './QuestionFileUpload';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
        <Card className="bg-zinc-950/50">
            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors cursor-pointer border-b border-zinc-800"
            >
                <div className="flex items-center gap-3">
                    <span className="text-zinc-200 font-medium">{questionSet.title}</span>
                    {questionSet.required && (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
                            Required
                        </Badge>
                    )}
                    <span className="text-xs text-zinc-500">
                        {answeredCount}/{questionSet.questions.length} answered
                    </span>
                    {isComplete && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                )}
            </div>

            {/* Questions */}
            {isExpanded && (
                <CardContent className="p-4 space-y-6">
                    {questionSet.description && (
                        <p className="text-zinc-500 text-sm">{questionSet.description}</p>
                    )}

                    {questionSet.questions.map((question, idx) => (
                        <div key={question.id} className="pt-2">
                            {/* Question text */}
                            <div className="flex items-start gap-2 mb-3">
                                <span className="text-zinc-600 text-sm font-mono mt-0.5">{idx + 1}.</span>
                                <div className="flex-1 space-y-1">
                                    <Label className="text-zinc-200 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {question.question}
                                        {question.required ? (
                                            <span className="text-amber-400 ml-1">*</span>
                                        ) : (
                                            <span className="text-zinc-500 text-xs ml-2 font-normal">(Optional)</span>
                                        )}
                                    </Label>
                                    {question.helpText && (
                                        <p className="text-zinc-500 text-xs flex items-center gap-1">
                                            <HelpCircle className="w-3 h-3" />
                                            {question.helpText}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Answer input */}
                            <div className="ml-6">
                                {question.type === 'multiple_choice' && question.options && (
                                    <RadioGroup
                                        value={answers[question.id] as string}
                                        onValueChange={(val) => onAnswerChange(question.id, val)}
                                        className="gap-3"
                                    >
                                        {question.options.map(option => (
                                            <label
                                                key={option.value}
                                                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[question.id] === option.value
                                                    ? 'border-blue-500/50 bg-blue-500/10'
                                                    : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                                                    }`}
                                            >
                                                <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                                                <span className="text-zinc-300 text-sm flex-1">{option.label}</span>
                                                {option.riskImpact === 'escalates' && (
                                                    <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/10 text-xs">
                                                        ⚠️ Risk
                                                    </Badge>
                                                )}
                                                {option.riskImpact === 'mitigates' && (
                                                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
                                                        ✓ Mitigation
                                                    </Badge>
                                                )}
                                            </label>
                                        ))}
                                    </RadioGroup>
                                )}

                                {question.type === 'boolean' && (
                                    <RadioGroup
                                        value={answers[question.id] === true ? 'true' : answers[question.id] === false ? 'false' : undefined}
                                        onValueChange={(val) => onAnswerChange(question.id, val === 'true')}
                                        className="flex gap-4"
                                    >
                                        <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${answers[question.id] === true
                                            ? 'border-blue-500/50 bg-blue-500/10'
                                            : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                                            }`}>
                                            <RadioGroupItem value="true" id={`${question.id}-yes`} />
                                            <span className="text-zinc-300 text-sm font-medium">Yes</span>
                                        </label>
                                        <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${answers[question.id] === false
                                            ? 'border-blue-500/50 bg-blue-500/10'
                                            : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                                            }`}>
                                            <RadioGroupItem value="false" id={`${question.id}-no`} />
                                            <span className="text-zinc-300 text-sm font-medium">No</span>
                                        </label>
                                    </RadioGroup>
                                )}

                                {question.type === 'text' && (
                                    <Textarea
                                        value={(answers[question.id] as string) || ''}
                                        onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                        placeholder="Enter your answer..."
                                        className="bg-zinc-950/50 min-h-[100px]"
                                    />
                                )}

                                {question.type === 'file_upload' && riskAssessmentId && (
                                    <QuestionFileUpload
                                        questionId={question.id}
                                        riskAssessmentId={riskAssessmentId}
                                        currentValue={answers[question.id] as string}
                                        onUploadComplete={(url) => onAnswerChange(question.id, url)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            )}
        </Card>
    );
}
