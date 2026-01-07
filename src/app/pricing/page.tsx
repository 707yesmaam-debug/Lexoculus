'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Shield, Rocket, Globe } from 'lucide-react';
import StarBackground from '@/components/StarBackground';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const tiers = [
    {
        name: 'Orbital',
        description: 'For individuals and small open-source projects.',
        price: 'Free',
        icon: Rocket,
        features: [
            '1 Repository Scan / Month',
            'Basic Risk Classification',
            'Community Support',
            'Public Badge'
        ],
        cta: 'Start Orbital',
        href: '/auth/signup',
        popular: false
    },
    {
        name: 'Interstellar',
        description: 'For growing teams needing regular compliance checks.',
        price: '€49',
        period: '/month',
        icon: Shield,
        features: [
            '10 Repository Scans / Month',
            'Full Annex III Analysis',
            'PDF Compliance Reports',
            'Priority Support',
            'Email Notifications'
        ],
        cta: 'Go Interstellar',
        href: '/auth/signup?plan=pro',
        popular: true
    },
    {
        name: 'Universal',
        description: 'For enterprises requiring automated governance at scale.',
        price: 'Custom',
        icon: Globe,
        features: [
            'Unlimited Scans',
            'Custom Regulatory Rule Sets',
            'API Access',
            'Dedicated Success Manager',
            'SSO & Audit Logs'
        ],
        cta: 'Contact Sales',
        href: 'mailto:sales@complianceai.com',
        popular: false
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen flex flex-col selection:bg-white selection:text-black text-white relative">
            <StarBackground />

            {/* Header */}
            <header className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center backdrop-blur-sm bg-black/5 border-b border-white/5">
                <Link href="/" className="font-heading font-bold tracking-tighter text-xl flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    ComplianceAI
                </Link>
                <nav className="flex gap-4 items-center">
                    <Link href="/auth/login" className="text-sm font-medium hover:text-white/80 transition-colors">Log In</Link>
                    <Link href="/auth/signup" className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-all">
                        Get Started
                    </Link>
                </nav>
            </header>

            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <motion.h1
                            custom={0}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            className="font-heading text-5xl md:text-6xl font-bold tracking-tighter mb-6"
                        >
                            Compliance at <br /> <span className="text-zinc-500">Light Speed.</span>
                        </motion.h1>
                        <motion.p
                            custom={1}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            className="text-xl text-zinc-400"
                        >
                            Choose the trajectory that fits your mission. <br className="hidden md:block" />
                            From single repositories to galactic-scale operations.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-start">
                        {tiers.map((tier, index) => (
                            <motion.div
                                key={tier.name}
                                custom={2 + index}
                                initial="hidden"
                                animate="visible"
                                variants={fadeUp}
                                className={`relative rounded-2xl p-8 border backdrop-blur-sm transition-all duration-300 hover:-translate-y-2
                                    ${tier.popular
                                        ? 'bg-white/[0.05] border-white/20 shadow-2xl shadow-blue-500/10'
                                        : 'bg-black/20 border-white/10 hover:bg-black/40'
                                    }`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full border border-white/20 uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/10
                                        ${tier.popular ? 'bg-white/10 text-white' : 'bg-black/40 text-zinc-400'}`}>
                                        <tier.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-heading text-2xl font-bold">{tier.name}</h3>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                                        {tier.period && <span className="text-zinc-500">{tier.period}</span>}
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-2">{tier.description}</p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={tier.href}
                                    className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all
                                        ${tier.popular
                                            ? 'bg-white text-black hover:bg-zinc-200'
                                            : 'border border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    {tier.cta}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="py-12 text-center text-zinc-600 text-sm border-t border-white/5">
                <div className="mb-4 flex justify-center gap-6">
                    <Link href="/" className="hover:text-zinc-400">Home</Link>
                    <Link href="#" className="hover:text-zinc-400">Terms</Link>
                    <Link href="#" className="hover:text-zinc-400">Privacy</Link>
                </div>
                ComplianceAI © 2026. Built for the European Union.
            </footer>
        </div>
    );
}
