'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle2, Loader2, Send } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface EnterpriseInquiryFormProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'intro' | 'details' | 'success';

interface FormData {
    full_name: string;
    work_email: string;
    company_name: string;
    company_size: string;
    role: string;
    message?: string;
}

export function EnterpriseInquiryForm({ isOpen, onClose }: EnterpriseInquiryFormProps) {
    const [step, setStep] = useState<Step>('intro');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        full_name: '',
        work_email: '',
        company_name: '',
        company_size: '',
        role: '',
        message: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/enterprise-inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStep('success');
            } else {
                alert('Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 outline-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-white border border-black shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-black text-white p-6 flex justify-between items-start">
                            <div>
                                <div className="font-mono text-[10px] text-[#FF4F00] uppercase tracking-widest mb-2">
                                    ENTERPRISE_GATEWAY
                                </div>
                                <h2 className="font-serif text-2xl font-bold">
                                    {step === 'success' ? 'Transmission Complete' : 'Initialize Contact'}
                                </h2>
                            </div>
                            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-8 flex-1 flex flex-col relative">
                            <AnimatePresence mode="wait">
                                {step === 'intro' && (
                                    <motion.div
                                        key="intro"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex flex-col h-full"
                                    >
                                        <p className="text-[#555] mb-8 font-light text-lg">
                                            Enterprise enforcement requires precision. Tell us who you are, and we will configure a secure channel.
                                        </p>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center gap-3 text-sm text-[#333]">
                                                <CheckCircle2 className="w-4 h-4 text-[#FF4F00]" />
                                                <span className="font-mono">Headless API Access</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-[#333]">
                                                <CheckCircle2 className="w-4 h-4 text-[#FF4F00]" />
                                                <span className="font-mono">Custom Policy Engine</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-[#333]">
                                                <CheckCircle2 className="w-4 h-4 text-[#FF4F00]" />
                                                <span className="font-mono">Unlimited Team Seats</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <button
                                                onClick={() => setStep('details')}
                                                className="w-full bg-black text-white px-6 py-4 font-mono text-xs uppercase tracking-widest hover:bg-[#FF4F00] transition-colors flex items-center justify-center gap-2 group"
                                            >
                                                Start Configuration <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'details' && (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex flex-col h-full"
                                    >
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Full Name</label>
                                                    <input
                                                        required
                                                        name="full_name"
                                                        value={formData.full_name}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-[#f5f5f5] border-0 p-3 font-mono text-sm focus:ring-1 focus:ring-black outline-none placeholder:text-gray-400"
                                                        placeholder="Jane Doe"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Role</label>
                                                    <input
                                                        required
                                                        name="role"
                                                        value={formData.role}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-[#f5f5f5] border-0 p-3 font-mono text-sm focus:ring-1 focus:ring-black outline-none placeholder:text-gray-400"
                                                        placeholder="CTO / Legal"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Email</label>
                                                <input
                                                    required
                                                    type="email"
                                                    name="work_email"
                                                    value={formData.work_email}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-[#f5f5f5] border-0 p-3 font-mono text-sm focus:ring-1 focus:ring-black outline-none placeholder:text-gray-400"
                                                    placeholder="jane@company.com"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Company</label>
                                                    <input
                                                        required
                                                        name="company_name"
                                                        value={formData.company_name}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-[#f5f5f5] border-0 p-3 font-mono text-sm focus:ring-1 focus:ring-black outline-none placeholder:text-gray-400"
                                                        placeholder="Acme Corp"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Team Size</label>
                                                    <select
                                                        required
                                                        name="company_size"
                                                        value={formData.company_size}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-[#f5f5f5] border-0 p-3 font-mono text-sm focus:ring-1 focus:ring-black outline-none appearance-none"
                                                    >
                                                        <option value="" disabled>Select...</option>
                                                        <option value="1-10">1-10</option>
                                                        <option value="11-50">11-50</option>
                                                        <option value="51-200">51-200</option>
                                                        <option value="201-500">201-500</option>
                                                        <option value="500+">500+</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1 pt-2">
                                                <label className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Message (Optional)</label>
                                                <textarea
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleInputChange}
                                                    rows={2}
                                                    className="w-full bg-[#f5f5f5] border-0 p-3 font-mono text-sm focus:ring-1 focus:ring-black outline-none resize-none placeholder:text-gray-400"
                                                    placeholder="Specific compliance needs..."
                                                />
                                            </div>

                                            <div className="pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full bg-black text-white px-6 py-4 font-mono text-xs uppercase tracking-widest hover:bg-[#FF4F00] transition-colors flex items-center justify-center gap-2"
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Transmitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Send Request <Send className="w-3 h-3" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}

                                {step === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col h-full items-center justify-center text-center py-8"
                                    >
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <h3 className="font-serif text-2xl font-bold mb-2">Request Received</h3>
                                        <p className="text-[#555] max-w-xs mx-auto mb-8">
                                            Our compliance engineers have received your signal. We will initiate contact shortly.
                                        </p>
                                        <button
                                            onClick={onClose}
                                            className="bg-black text-white px-8 py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#FF4F00] transition-colors"
                                        >
                                            Return to Base
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>


                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
