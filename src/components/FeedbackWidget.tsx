'use client';

import { useState } from 'react';
import { MessageSquare, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment, url: window.location.href }),
            });

            if (res.ok) {
                setMessage('FEEDBACK_RECEIVED');
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage(null);
                    setRating(null);
                    setComment('');
                }, 2000);
            } else {
                setMessage('ERROR_SENDING');
            }
        } catch (error) {
            setMessage('CONNECTION_ERROR');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* TRIGGER: Vertical Tab on Right Edge */}
            <button
                onClick={() => setIsOpen(true)}
                className={`
                    fixed right-0 top-1/2 -translate-y-1/2 z-40 
                    bg-white border-2 border-r-0 border-black py-3 px-1 
                    hover:bg-black hover:text-white transition-all duration-300
                    shadow-[0px_4px_0px_0px_rgba(0,0,0,0.2)]
                    ${isOpen ? 'translate-x-full' : 'translate-x-0'}
                `}
                style={{ writingMode: 'vertical-rl' }}
                aria-label="Feedback"
            >
                <span className="font-mono text-xs uppercase tracking-widest font-bold rotate-180">
                    FEEDBACK
                </span>
            </button>

            {/* MODAL / DRAWER */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Content */}
                    <div className="fixed top-1/2 right-0 -translate-y-1/2 z-50 w-80 bg-white border-2 border-r-0 border-black shadow-[-8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-black bg-[#F5F5F5]">
                            <h3 className="font-serif font-bold text-sm">System Feedback</h3>
                            <button onClick={() => setIsOpen(false)} className="text-black hover:text-[#FF4F00]">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6">
                            {message === 'FEEDBACK_RECEIVED' ? (
                                <div className="flex flex-col items-center justify-center py-8 text-[#FF4F00]">
                                    <Check className="w-8 h-8 mb-2" />
                                    <span className="font-mono text-xs uppercase tracking-widest">Received</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] uppercase text-[#999] tracking-widest">
                                            Experience
                                        </label>
                                        <div className="flex justify-between">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className={`w-8 h-8 flex items-center justify-center border font-mono text-sm transition-colors ${rating === star
                                                        ? 'bg-black text-white border-black'
                                                        : 'border-[#E5E5E5] text-[#555] hover:border-black'
                                                        }`}
                                                >
                                                    {star}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] uppercase text-[#999] tracking-widest">
                                            Observations
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Report glitches or suggest features..."
                                            className="w-full bg-[#FAFAFA] border border-[#E5E5E5] p-3 font-mono text-xs focus:ring-0 focus:border-black min-h-[80px] resize-none placeholder:text-[#BBB]"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!rating || isSubmitting}
                                        className="w-full bg-black text-white hover:bg-[#FF4F00] rounded-none font-mono text-xs uppercase py-4"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'TRANSMIT_DATA'}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
