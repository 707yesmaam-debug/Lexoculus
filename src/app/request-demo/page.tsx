'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle, Shield, Clock, FileText, Zap, ChevronDown } from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────
interface FormData {
    full_name: string;
    work_email: string;
    company_name: string;
    company_size: string;
    role: string;
    use_case: string;
}

const INITIAL_FORM: FormData = {
    full_name: '',
    work_email: '',
    company_name: '',
    company_size: '',
    role: '',
    use_case: '',
};

const COMPANY_SIZES = [
    { value: '1-10', label: '1–10 employees' },
    { value: '11-50', label: '11–50 employees' },
    { value: '51-200', label: '51–200 employees' },
    { value: '201-1000', label: '201–1,000 employees' },
    { value: '1000+', label: '1,000+ employees' },
];

const ROLES = [
    { value: 'CTO / VP Engineering', label: 'CTO / VP Engineering' },
    { value: 'Engineering Lead', label: 'Engineering Lead' },
    { value: 'Compliance / Legal', label: 'Compliance / Legal' },
    { value: 'Product Manager', label: 'Product Manager' },
    { value: 'Other', label: 'Other' },
];

const USE_CASES = [
    { value: 'preparing_for_eu_ai_act', label: 'Preparing for EU AI Act compliance' },
    { value: 'already_under_audit', label: 'Already under audit / regulatory review' },
    { value: 'evaluating_tools', label: 'Evaluating compliance tools' },
    { value: 'other', label: 'Something else' },
];

// ─── TYPEWRITER HOOK ─────────────────────────────────────────────────────
function useTypewriter(text: string, speed: number = 40, delay: number = 200) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        let i = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                if (i < text.length) {
                    setDisplayed(text.slice(0, i + 1));
                    i++;
                } else {
                    setDone(true);
                    clearInterval(interval);
                }
            }, speed);
            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timer);
    }, [text, speed, delay]);

    return { displayed, done };
}

// ─── CUSTOM SELECT ───────────────────────────────────────────────────────
function CustomSelect({
    value, onChange, options, placeholder, id
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    id: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} className="relative" id={id}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full text-left border-2 border-black px-4 py-3 font-mono text-sm
                    bg-white hover:bg-[#FAFAFA] transition-colors flex items-center justify-between
                    focus:outline-none focus:ring-2 focus:ring-[#FF4F00] focus:ring-offset-1
                    ${!value ? 'text-[#999]' : 'text-black'}`}
            >
                <span>{selected?.label || placeholder}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 border-2 border-black bg-white shadow-[4px_4px_0_#000] max-h-48 overflow-y-auto">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`w-full text-left px-4 py-3 font-mono text-sm hover:bg-[#FF4F00] hover:text-white transition-colors
                                ${value === opt.value ? 'bg-black text-white' : ''}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────
export default function RequestDemoPage() {
    const [form, setForm] = useState<FormData>(INITIAL_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const { displayed: heading, done: headingDone } = useTypewriter('Let\'s talk compliance.', 45, 300);

    const updateField = (field: keyof FormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
        setServerError('');
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (!form.full_name.trim()) newErrors.full_name = 'Required';
        if (!form.work_email.trim()) {
            newErrors.work_email = 'Required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.work_email)) {
            newErrors.work_email = 'Invalid email';
        } else {
            const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'proton.me'];
            const domain = form.work_email.split('@')[1]?.toLowerCase();
            if (personalDomains.includes(domain)) {
                newErrors.work_email = 'Please use a business email';
            }
        }
        if (!form.company_name.trim()) newErrors.company_name = 'Required';
        if (!form.company_size) newErrors.company_size = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setServerError('');

        try {
            const res = await fetch('/api/request-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (res.ok) {
                setSubmitted(true);
            } else {
                setServerError(data.error || 'Something went wrong');
            }
        } catch {
            setServerError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── SUCCESS STATE ──────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-lg w-full text-center animate-fade-in">
                    <div className="w-20 h-20 border-2 border-black mx-auto mb-8 flex items-center justify-center bg-[#F5F5F5]">
                        <CheckCircle className="w-10 h-10 text-[#FF4F00]" />
                    </div>

                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-4">
                        REQUEST_RECEIVED
                    </div>

                    <h1 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                        We&apos;ll be in touch.
                    </h1>

                    <p className="font-mono text-sm text-[#555] leading-relaxed mb-8 max-w-md mx-auto">
                        Thank you, {form.full_name.split(' ')[0]}. A member of our team
                        will reach out to <span className="text-black font-bold">{form.work_email}</span> within
                        24 hours to schedule your personalized demo.
                    </p>

                    <div className="border-t-2 border-black pt-6 mt-8 space-y-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-[#999] mb-4">
                            WHILE_YOU_WAIT
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="font-mono text-xs border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
                            >
                                ← BACK_TO_HOME
                            </Link>
                            <Link
                                href="/pricing"
                                className="font-mono text-xs border-2 border-black px-6 py-3 bg-black text-white hover:bg-[#FF4F00] transition-colors"
                            >
                                VIEW_PLANS →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── FORM STATE ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-white">
            {/* Top Bar */}
            <div className="border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="font-mono text-xs flex items-center gap-2 hover:text-[#FF4F00] transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        LEXOCULUS
                    </Link>
                    <Link href="/auth/login" className="font-mono text-xs text-[#999] hover:text-black transition-colors">
                        EXISTING_USER? LOGIN →
                    </Link>
                </div>
            </div>

            {/* Main Content — Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-57px)]">

                {/* Left — Form */}
                <div className="border-r-0 lg:border-r-2 border-black p-6 md:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="max-w-lg mx-auto w-full">
                        {/* Heading with typewriter */}
                        <div className="mb-10">
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-4">
                                REQUEST_DEMO
                            </div>
                            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 min-h-[2.5rem]">
                                {heading}<span className={`${headingDone ? 'opacity-0' : 'animate-pulse'}`}>▌</span>
                            </h1>
                            <p className="font-mono text-sm text-[#555] leading-relaxed">
                                Tell us about your team and we&apos;ll prepare a tailored walkthrough of our EU AI Act compliance engine.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="full_name" className="font-mono text-[10px] uppercase tracking-widest text-[#999] block mb-2">
                                    Full Name <span className="text-[#FF4F00]">*</span>
                                </label>
                                <input
                                    id="full_name"
                                    type="text"
                                    value={form.full_name}
                                    onChange={e => updateField('full_name', e.target.value)}
                                    onFocus={() => setFocusedField('full_name')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Jane Smith"
                                    className={`w-full border-2 px-4 py-3 font-mono text-sm bg-white
                                        placeholder:text-[#CCC] transition-all
                                        focus:outline-none focus:ring-2 focus:ring-[#FF4F00] focus:ring-offset-1
                                        ${errors.full_name ? 'border-red-500' : focusedField === 'full_name' ? 'border-[#FF4F00]' : 'border-black'}`}
                                />
                                {errors.full_name && <p className="font-mono text-[10px] text-red-500 mt-1">{errors.full_name}</p>}
                            </div>

                            {/* Work Email */}
                            <div>
                                <label htmlFor="work_email" className="font-mono text-[10px] uppercase tracking-widest text-[#999] block mb-2">
                                    Email <span className="text-[#FF4F00]">*</span>
                                </label>
                                <input
                                    id="work_email"
                                    type="email"
                                    value={form.work_email}
                                    onChange={e => updateField('work_email', e.target.value)}
                                    onFocus={() => setFocusedField('work_email')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="jane@company.com"
                                    className={`w-full border-2 px-4 py-3 font-mono text-sm bg-white
                                        placeholder:text-[#CCC] transition-all
                                        focus:outline-none focus:ring-2 focus:ring-[#FF4F00] focus:ring-offset-1
                                        ${errors.work_email ? 'border-red-500' : focusedField === 'work_email' ? 'border-[#FF4F00]' : 'border-black'}`}
                                />
                                {errors.work_email && <p className="font-mono text-[10px] text-red-500 mt-1">{errors.work_email}</p>}
                            </div>

                            {/* Company Name */}
                            <div>
                                <label htmlFor="company_name" className="font-mono text-[10px] uppercase tracking-widest text-[#999] block mb-2">
                                    Company <span className="text-[#FF4F00]">*</span>
                                </label>
                                <input
                                    id="company_name"
                                    type="text"
                                    value={form.company_name}
                                    onChange={e => updateField('company_name', e.target.value)}
                                    onFocus={() => setFocusedField('company_name')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Acme AI Labs"
                                    className={`w-full border-2 px-4 py-3 font-mono text-sm bg-white
                                        placeholder:text-[#CCC] transition-all
                                        focus:outline-none focus:ring-2 focus:ring-[#FF4F00] focus:ring-offset-1
                                        ${errors.company_name ? 'border-red-500' : focusedField === 'company_name' ? 'border-[#FF4F00]' : 'border-black'}`}
                                />
                                {errors.company_name && <p className="font-mono text-[10px] text-red-500 mt-1">{errors.company_name}</p>}
                            </div>

                            {/* Company Size */}
                            <div>
                                <label className="font-mono text-[10px] uppercase tracking-widest text-[#999] block mb-2">
                                    Team Size <span className="text-[#FF4F00]">*</span>
                                </label>
                                <CustomSelect
                                    id="company_size"
                                    value={form.company_size}
                                    onChange={v => updateField('company_size', v)}
                                    options={COMPANY_SIZES}
                                    placeholder="Select team size"
                                />
                                {errors.company_size && <p className="font-mono text-[10px] text-red-500 mt-1">{errors.company_size}</p>}
                            </div>

                            {/* Divider — Optional Section */}
                            <div className="flex items-center gap-3 py-2">
                                <div className="h-px bg-[#E5E5E5] flex-1" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-[#CCC]">Optional</span>
                                <div className="h-px bg-[#E5E5E5] flex-1" />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="font-mono text-[10px] uppercase tracking-widest text-[#999] block mb-2">
                                    Your Role
                                </label>
                                <CustomSelect
                                    id="role"
                                    value={form.role}
                                    onChange={v => updateField('role', v)}
                                    options={ROLES}
                                    placeholder="Select your role"
                                />
                            </div>

                            {/* Use Case */}
                            <div>
                                <label className="font-mono text-[10px] uppercase tracking-widest text-[#999] block mb-2">
                                    What brings you here?
                                </label>
                                <CustomSelect
                                    id="use_case"
                                    value={form.use_case}
                                    onChange={v => updateField('use_case', v)}
                                    options={USE_CASES}
                                    placeholder="Select primary use case"
                                />
                            </div>

                            {/* Server Error */}
                            {serverError && (
                                <div className="border-2 border-red-500 bg-red-50 px-4 py-3 font-mono text-xs text-red-600">
                                    {serverError}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full flex items-center justify-center gap-3 font-mono text-sm uppercase tracking-widest
                                    px-8 py-4 border-2 border-black transition-all
                                    ${submitting
                                        ? 'bg-[#E5E5E5] text-[#999] cursor-wait'
                                        : 'bg-[#FF4F00] text-white hover:bg-black hover:shadow-[4px_4px_0_#FF4F00]'
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        SUBMITTING...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        REQUEST_DEMO
                                    </>
                                )}
                            </button>

                            {/* Privacy Note */}
                            <p className="font-mono text-[10px] text-[#999] text-center leading-relaxed">
                                By submitting, you agree to our{' '}
                                <Link href="/legal/privacy" className="text-[#FF4F00] hover:underline">Privacy Policy</Link>.
                                We&apos;ll never share your data with third parties.
                            </p>
                        </form>
                    </div>
                </div>

                {/* Right — Value Proposition */}
                <div className="bg-[#FAFAFA] p-6 md:p-12 lg:p-16 flex flex-col justify-center border-t-2 lg:border-t-0 border-black">
                    <div className="max-w-lg mx-auto w-full">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#999] mb-8">
                            WHAT_TO_EXPECT
                        </div>

                        {/* Steps */}
                        <div className="space-y-8 mb-12">
                            <StepItem
                                number="01"
                                title="Personalized Walkthrough"
                                description="A 30-minute demo tailored to your use case, risk profile, and technology stack."
                                icon={<Zap className="w-5 h-5" />}
                            />
                            <StepItem
                                number="02"
                                title="Live Compliance Scan"
                                description="We'll run a real scan on one of your repositories so you can see the results firsthand."
                                icon={<Shield className="w-5 h-5" />}
                            />
                            <StepItem
                                number="03"
                                title="Custom Report Preview"
                                description="See what your EU AI Act compliance report looks like — risk classification, Annex III mapping, and action items."
                                icon={<FileText className="w-5 h-5" />}
                            />
                        </div>

                        {/* Response Time */}
                        <div className="border-2 border-black bg-white p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Clock className="w-5 h-5 text-[#FF4F00]" />
                                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                                    RESPONSE_TIME
                                </span>
                            </div>
                            <p className="font-mono text-sm text-[#555] leading-relaxed">
                                We typically respond within <span className="text-black font-bold">24 hours</span>.
                                For urgent compliance needs, flag it in the form and we&apos;ll prioritize your request.
                            </p>
                        </div>

                        {/* Trust Signals */}
                        <div className="mt-8 grid grid-cols-3 gap-4">
                            <TrustSignal label="EU AI Act" sublabel="Full Coverage" />
                            <TrustSignal label="Annex III" sublabel="All 8 Categories" />
                            <TrustSignal label="Reports" sublabel="SHA-256 Signed" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────

function StepItem({ number, title, description, icon }: {
    number: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex gap-4 group">
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0
                bg-white group-hover:bg-[#FF4F00] group-hover:text-white group-hover:border-[#FF4F00] transition-colors">
                {icon}
            </div>
            <div>
                <div className="font-mono text-[10px] text-[#FF4F00] mb-1">{number}</div>
                <h3 className="font-serif text-lg font-bold mb-1">{title}</h3>
                <p className="font-mono text-xs text-[#666] leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function TrustSignal({ label, sublabel }: { label: string; sublabel: string }) {
    return (
        <div className="text-center py-3 border border-[#E5E5E5]">
            <div className="font-mono text-xs font-bold">{label}</div>
            <div className="font-mono text-[10px] text-[#999]">{sublabel}</div>
        </div>
    );
}
