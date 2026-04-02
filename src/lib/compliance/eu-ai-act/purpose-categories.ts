/**
 * EU AI Act — Intended Purpose Category Mapping
 *
 * Source: Regulation (EU) 2024/1689
 * Annex III (High-Risk AI Systems) — Article 6(1) (Annex I Products) — Article 5 (Prohibited)
 *
 * LAST AUDITED: 2026-04-03 against official EUR-Lex text
 *
 * PURPOSE:
 * Maps a user-declared intended purpose key to the Annex III HIGH_RISK constraint
 * categories that apply. The constraint engine then only evaluates constraints
 * within those categories, preventing false positives from unrelated rules.
 *
 * SPECIAL VALUES:
 *   null   → evaluate ALL categories (general / unknown purpose)
 *   []     → skip ALL high-risk annex III categories (dev tools, chatbots, etc.)
 *            NOTE: Article 5 (UNACCEPTABLE) and Article 50 (LIMITED_RISK) are
 *            NEVER filtered — they always apply regardless of purpose.
 *
 * BUG FIXES (vs previous version):
 *   #1 — Added 'emergency_response' (Annex III(5)(d)) — was completely missing
 *   #2 — Fixed 'elections_democracy' category name: was 'Administration of Justice',
 *         now 'Democratic Processes & Elections' (separate Annex point)
 *   #3 — 'social_scoring' now maps to ['FORCE_UNACCEPTABLE'] sentinel to trigger
 *         direct Article 5(1)(c) check in risk-classifier.ts
 *   #4 — Added Article 6(1) Annex I product purpose keys (medical device, machinery, etc.)
 *   #5 — Fixed 'medical_device' to use Article 6(1) pathway, not Annex III(2)/(5)
 *   #6 — Separated 'justice_legal' from 'elections_democracy' as distinct Annex points
 *   #7 — Added granular sub-purpose keys for employment and essential services
 *   #8 — Added 'real_time_biometric_id' as direct UNACCEPTABLE trigger
 */

// =============================================================================
// SENTINEL VALUE for Article 5 direct escalation
// =============================================================================

/** Sentinel value — when a purpose maps to this, risk-classifier.ts immediately
 *  sets risk_classification = 'UNACCEPTABLE' and cites the relevant Article 5 clause.
 *  The constraint engine's HIGH_RISK filter is also set to evaluate nothing. */
export const FORCE_UNACCEPTABLE = 'FORCE_UNACCEPTABLE' as const;

// =============================================================================
// PURPOSE → ANNEX III CATEGORY MAP
// =============================================================================

/**
 * Maps intended purpose keys to eligible Annex III category names.
 * The constraint engine uses these to filter which HIGH_RISK constraints to evaluate.
 *
 * null  → all categories evaluated (unknown / general purpose)
 * []    → no HIGH_RISK categories (dev tools, chatbots, analytics tools)
 * ['X'] → only evaluate constraints in category 'X'
 */
export const PURPOSE_CATEGORY_MAP: Record<string, string[] | null | typeof FORCE_UNACCEPTABLE> = {

    // =====================================================================
    // NON-REGULATED / DEVELOPER-FACING TOOLS
    // HIGH_RISK Annex III filtering: skip all (return [])
    // Article 50 transparency still applies if chatbot/generative AI detected
    // =====================================================================
    'developer_tool':       [],
    'api_middleware':       [],
    'data_analytics':       [],
    'general':              null,  // null = evaluate ALL — most conservative for unknown purpose

    // =====================================================================
    // ARTICLE 5 — PROHIBITED PRACTICES
    // DO NOT evaluate Annex III — directly escalate to UNACCEPTABLE
    // =====================================================================

    /** Article 5(1)(c) — Social credit scoring systems */
    'social_scoring':           FORCE_UNACCEPTABLE,

    /** Article 5(1)(h) — Real-time biometric ID in public spaces */
    'real_time_biometric_id':   FORCE_UNACCEPTABLE,

    // =====================================================================
    // ANNEX III(1) — BIOMETRICS
    // =====================================================================

    /** Annex III(1)(a) — Remote biometric identification of unknown persons */
    'biometric_id':             ['Remote Biometric Identification'],

    /** Annex III(1)(b) — Biometric categorization by sensitive attributes */
    'biometric_categorization': ['Biometric Categorization'],

    /** Annex III(1)(c) — Emotion recognition */
    'emotion_recognition':      ['Emotion Recognition'],

    // =====================================================================
    // ANNEX III(2) — CRITICAL INFRASTRUCTURE
    // =====================================================================

    /** Safety components in water, gas, power, road traffic, digital infra */
    'critical_infrastructure':  ['Critical Infrastructure'],

    // =====================================================================
    // ANNEX III(3) — EDUCATION & VOCATIONAL TRAINING
    // =====================================================================

    /** General education purpose — covers all sub-points (a)–(d) */
    'education':                ['Education & Vocational Training'],

    /** Access/admission decisions for educational institutions — Annex III(3)(a) */
    'education_access':         ['Education & Vocational Training'],

    /** Student assessment/grading — Annex III(3)(b) */
    'student_assessment':       ['Education & Vocational Training'],

    /** Student placement / assignment to institutions — Annex III(3)(c) */
    'student_placement':        ['Education & Vocational Training'],

    /** Proctoring / prohibited behaviour detection — Annex III(3)(d) */
    'student_monitoring':       ['Education & Vocational Training'],

    // =====================================================================
    // ANNEX III(4) — EMPLOYMENT & WORKER MANAGEMENT
    // =====================================================================

    /** General HR / employment — covers all sub-points (a)–(c) */
    'hr_recruitment':           ['Employment & Worker Management'],

    /** Recruitment, CV screening, candidate selection — Annex III(4)(a) */
    'recruitment':              ['Employment & Worker Management'],

    /** Promotion, termination, pay, task allocation — Annex III(4)(b) */
    'worker_management':        ['Employment & Worker Management'],

    /** Worker surveillance, productivity tracking — Annex III(4)(c) */
    'worker_monitoring':        ['Employment & Worker Management'],

    // =====================================================================
    // ANNEX III(5) — ACCESS TO ESSENTIAL PRIVATE & PUBLIC SERVICES
    // =====================================================================

    /** General essential services — covers all sub-points */
    'financial_services':       ['Essential Services Access'],

    /** Public assistance, welfare benefits, housing — Annex III(5)(a) — official ordering confirmed via EUR-Lex */
    'public_benefits':          ['Essential Services Access'],

    /** Credit scoring, loan decisions, mortgage — Annex III(5)(b) */
    'credit_scoring':           ['Essential Services Access'],

    /**
     * BUG #1 FIX — Emergency dispatch & patient triage
     * Official EUR-Lex text: Annex III(5)(c)
     * "AI systems intended to be used for the purpose of evaluating and classifying emergency
     * calls by natural persons or to be used to dispatch, or to establish priority in the
     * dispatching of, emergency first response services, including by police, fire and medical
     * aid, as well as for emergency healthcare patient triage systems"
     */
    'emergency_response':       ['Essential Services Access'],

    /** Life and health insurance premium & payout decisions — Annex III(5)(d) */
    'insurance_pricing':        ['Essential Services Access'],

    // =====================================================================
    // ANNEX III(6) — LAW ENFORCEMENT
    // =====================================================================

    /** Individual risk assessment, profiling, evidence reliability, recidivism */
    'law_enforcement':          ['Law Enforcement'],

    // =====================================================================
    // ANNEX III(7) — MIGRATION, ASYLUM & BORDER CONTROL
    // =====================================================================

    /** Visa/asylum applications, border risk assessment, document verification */
    'migration_border':         ['Migration, Asylum & Border Control'],

    // =====================================================================
    // ANNEX III(8) — ADMINISTRATION OF JUSTICE & DEMOCRATIC PROCESSES
    // =====================================================================

    /**
     * BUG #6 FIX — Judicial assistance is Annex III(8)(a)
     * Separate from elections which is Annex III(8)(b)
     */
    'justice_legal':            ['Administration of Justice'],

    /**
     * BUG #2 FIX — Elections is Annex III(8)(b), NOT "Administration of Justice"
     * The regulation text is clear: these are two distinct sub-points:
     * (8)(a) = assisting judicial authorities
     * (8)(b) = influencing elections/referenda
     */
    'elections_democracy':      ['Democratic Processes & Elections'],

    // =====================================================================
    // ARTICLE 6(1) — ANNEX I PRODUCT SAFETY COMPONENTS
    // These are AI systems embedded in products regulated by EU harmonised
    // product safety legislation. They require MODULE B+C conformity assessment
    // (notified body), NOT Module A (self-assessment).
    // =====================================================================

    /**
     * BUG #4 & #5 FIX — Medical device AI is Article 6(1), NOT Annex III(2)/(5)
     * Governed by Medical Devices Regulation (MDR 2017/745) / IVDR (2017/746)
     */
    'medical_device':           ['Article 6(1) — Medical Device'],

    /** Machinery Regulation (EU) 2023/1230 */
    'machinery_safety':         ['Article 6(1) — Machinery'],

    /** Toy Safety Directive 2009/48/EC */
    'toy_safety':               ['Article 6(1) — Consumer Product'],

    /** Civil aviation — Regulation (EU) 2018/1139 */
    'civil_aviation':           ['Article 6(1) — Transport'],

    /** Rail systems — Directive (EU) 2016/797 */
    'rail_systems':             ['Article 6(1) — Transport'],

    /** Motor vehicles — Regulation (EU) 2019/2144 */
    'autonomous_vehicles':      ['Autonomous Vehicles'],

    /** Industrial safety components (general) */
    'product_safety_industrial': ['Article 6(1) — Machinery', 'Critical Infrastructure'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns true if the HIGH_RISK constraint in the given category should be
 * SKIPPED for the declared intended purpose.
 *
 * NEVER skips UNACCEPTABLE (Article 5) or LIMITED_RISK (Article 50) constraints.
 *
 * @param annex3Category  The `category` field on the EUAIConstraint
 * @param intendedPurpose The user-declared purpose key
 */
export function shouldSkipHighRiskCategory(
    annex3Category: string,
    intendedPurpose?: string
): boolean {
    if (!intendedPurpose) return false;  // no purpose declared → evaluate everything

    const mapping = PURPOSE_CATEGORY_MAP[intendedPurpose];

    // FORCE_UNACCEPTABLE: do NOT skip — Article 5 is handled separately
    if (mapping === FORCE_UNACCEPTABLE) return false;

    // null → evaluate ALL categories
    if (mapping === null) return false;

    // [] → skip ALL HIGH_RISK categories (non-regulated tool)
    if (mapping.length === 0) return true;

    // Skip if category not in the eligible list
    return !mapping.includes(annex3Category);
}

/**
 * Returns true if the declared purpose maps directly to an Article 5
 * UNACCEPTABLE prohibition without needing pattern matching.
 *
 * Used by risk-classifier.ts to immediately escalate these purposes to UNACCEPTABLE.
 */
export function isDirectlyProhibitedPurpose(intendedPurpose?: string): boolean {
    if (!intendedPurpose) return false;
    return PURPOSE_CATEGORY_MAP[intendedPurpose] === FORCE_UNACCEPTABLE;
}

/**
 * Returns true if the declared purpose triggers the Article 6(1) / Annex I
 * product-safety pathway (requires Module B+C notified body assessment).
 */
export function isArticle6_1Purpose(intendedPurpose?: string): boolean {
    if (!intendedPurpose) return false;
    const mapping = PURPOSE_CATEGORY_MAP[intendedPurpose];
    if (!Array.isArray(mapping)) return false;
    return mapping.some(cat => cat.startsWith('Article 6(1)'));
}

// =============================================================================
// UI OPTIONS — Grouped by Annex III category for the dropdown
// =============================================================================

export interface PurposeOption {
    value: string;
    label: string;
    group: string;
    /** Short regulatory reference for tooltip */
    regulation_ref: string;
    /** One-line description of what this means */
    description: string;
}

export const PURPOSE_OPTIONS: PurposeOption[] = [
    // --- General / Non-regulated ---
    {
        value: 'developer_tool',
        label: 'Developer Tool / Internal Tooling',
        group: 'General Purpose',
        regulation_ref: 'No Annex III category',
        description: 'Used by developers or internally; not deployed to end-users in a regulated context',
    },
    {
        value: 'data_analytics',
        label: 'Data Analytics / Business Intelligence',
        group: 'General Purpose',
        regulation_ref: 'No Annex III category',
        description: 'Data analysis and dashboards with no high-stakes decisions on individuals',
    },
    {
        value: 'api_middleware',
        label: 'API / Middleware / Infrastructure Layer',
        group: 'General Purpose',
        regulation_ref: 'No Annex III category',
        description: 'Backend integration layer; risk determined by the deploying application',
    },
    {
        value: 'general',
        label: 'General / Unknown Purpose',
        group: 'General Purpose',
        regulation_ref: 'All categories evaluated (conservative)',
        description: 'Purpose not yet determined; all Annex III constraints will be evaluated',
    },

    // --- Article 5 — PROHIBITED (direct UNACCEPTABLE) ---
    {
        value: 'social_scoring',
        label: 'Social Credit / Citizen Scoring',
        group: 'Article 5 — Prohibited Practices',
        regulation_ref: 'Article 5(1)(c)',
        description: 'Evaluating citizens over time based on behavior to produce a social score — PROHIBITED',
    },
    {
        value: 'real_time_biometric_id',
        label: 'Real-Time Biometric Identification in Public',
        group: 'Article 5 — Prohibited Practices',
        regulation_ref: 'Article 5(1)(h)',
        description: 'Live biometric identification in publicly accessible spaces — PROHIBITED (narrow LE exceptions only)',
    },

    // --- Annex III(1) — Biometrics ---
    {
        value: 'biometric_id',
        label: 'Biometric Identification (Post-Processing)',
        group: 'Annex III(1) — Biometrics',
        regulation_ref: 'Annex III(1)(a)',
        description: 'Identifying unknown natural persons from biometric data (not real-time verification)',
    },
    {
        value: 'biometric_categorization',
        label: 'Biometric Categorization by Sensitive Attributes',
        group: 'Annex III(1) — Biometrics',
        regulation_ref: 'Annex III(1)(b)',
        description: 'Inferring sensitive attributes (gender, age, ethnicity) from biometric data',
    },
    {
        value: 'emotion_recognition',
        label: 'Emotion Recognition System',
        group: 'Annex III(1) — Biometrics',
        regulation_ref: 'Annex III(1)(c)',
        description: 'Detecting or inferring emotions from faces, voice, or biometric data',
    },

    // --- Annex III(2) — Critical Infrastructure ---
    {
        value: 'critical_infrastructure',
        label: 'Critical Infrastructure Safety Component',
        group: 'Annex III(2) — Critical Infrastructure',
        regulation_ref: 'Annex III(2)',
        description: 'Safety components in water, gas, power grid, road traffic, or digital infrastructure management',
    },

    // --- Annex III(3) — Education ---
    {
        value: 'education_access',
        label: 'Education — Admission / Access Decisions',
        group: 'Annex III(3) — Education',
        regulation_ref: 'Annex III(3)(a)',
        description: 'Determining or assisting access/admission to educational or vocational training institutions',
    },
    {
        value: 'student_assessment',
        label: 'Education — Student Assessment / Grading',
        group: 'Annex III(3) — Education',
        regulation_ref: 'Annex III(3)(b)',
        description: 'Assessing students, marking work, or predicting academic outcomes',
    },
    {
        value: 'student_placement',
        label: 'Education — Student Placement / Assignment',
        group: 'Annex III(3) — Education',
        regulation_ref: 'Annex III(3)(c)',
        description: 'Assigning students to institutions, tracks, or vocational programs',
    },
    {
        value: 'student_monitoring',
        label: 'Education — Exam Proctoring / Behaviour Monitoring',
        group: 'Annex III(3) — Education',
        regulation_ref: 'Annex III(3)(d)',
        description: 'Monitoring students during exams or detecting prohibited behaviour (cheating detection)',
    },

    // --- Annex III(4) — Employment ---
    {
        value: 'recruitment',
        label: 'Employment — Recruitment & Candidate Selection',
        group: 'Annex III(4) — Employment',
        regulation_ref: 'Annex III(4)(a)',
        description: 'Placing job ads, screening CVs, filtering or evaluating candidates in hiring processes',
    },
    {
        value: 'worker_management',
        label: 'Employment — Promotion, Termination & Task Allocation',
        group: 'Annex III(4) — Employment',
        regulation_ref: 'Annex III(4)(b)',
        description: 'Making or supporting decisions on promotions, pay, task allocation, or termination',
    },
    {
        value: 'worker_monitoring',
        label: 'Employment — Worker Surveillance & Performance Monitoring',
        group: 'Annex III(4) — Employment',
        regulation_ref: 'Annex III(4)(c)',
        description: 'Monitoring workers during work, tracking productivity, or evaluating performance in real-time',
    },

    // --- Annex III(5) — Essential Services ---
    // Official EUR-Lex order (confirmed from europa.eu source):
    // (a) = public assistance / benefits, (b) = credit scoring,
    // (c) = emergency dispatch & triage, (d) = insurance pricing
    {
        value: 'public_benefits',
        label: 'Essential Services — Public Assistance & Benefits Eligibility',
        group: 'Annex III(5) — Essential Services',
        regulation_ref: 'Annex III(5)(a)',
        description: 'Evaluating eligibility for public assistance, welfare payments, housing benefits, or social services, by or on behalf of public authorities',
    },
    {
        value: 'credit_scoring',
        label: 'Essential Services — Credit Scoring & Lending',
        group: 'Annex III(5) — Essential Services',
        regulation_ref: 'Annex III(5)(b)',
        description: 'Evaluating creditworthiness or establishing individual credit scores (excluding systems used solely for financial fraud detection)',
    },
    {
        value: 'emergency_response',
        label: 'Essential Services — Emergency Dispatch & Patient Triage',
        group: 'Annex III(5) — Essential Services',
        regulation_ref: 'Annex III(5)(c)',
        description: 'Evaluating/classifying emergency calls, dispatching first responders (police, fire, medical aid), or triaging emergency healthcare patients',
    },
    {
        value: 'insurance_pricing',
        label: 'Essential Services — Life & Health Insurance Pricing',
        group: 'Annex III(5) — Essential Services',
        regulation_ref: 'Annex III(5)(d)',
        description: 'Determining life and health insurance premiums and payouts for natural persons',
    },

    // --- Annex III(6) — Law Enforcement ---
    {
        value: 'law_enforcement',
        label: 'Law Enforcement — Risk Assessment & Profiling',
        group: 'Annex III(6) — Law Enforcement',
        regulation_ref: 'Annex III(6)',
        description: 'Used by law enforcement for individual risk assessment, recidivism prediction, evidence analysis, or profiling',
    },

    // --- Annex III(7) — Migration ---
    {
        value: 'migration_border',
        label: 'Migration — Visa, Asylum & Border Control',
        group: 'Annex III(7) — Migration',
        regulation_ref: 'Annex III(7)',
        description: 'Assessing visa/asylum applications, risk at borders, or verifying travel documents',
    },

    // --- Annex III(8) — Justice & Democracy ---
    {
        value: 'justice_legal',
        label: 'Justice — Assisting Judicial Authorities',
        group: 'Annex III(8) — Justice & Democracy',
        regulation_ref: 'Annex III(8)(a)',
        description: 'Assisting courts in researching facts/law, applying law to facts, or dispute resolution',
    },
    {
        value: 'elections_democracy',
        label: 'Democracy — Influencing Elections & Voting',
        group: 'Annex III(8) — Justice & Democracy',
        regulation_ref: 'Annex III(8)(b)',
        description: 'Intended to influence the outcome of elections, referenda, or the voting behaviour of natural persons',
    },

    // --- Article 6(1) — Annex I Products ---
    {
        value: 'medical_device',
        label: 'Medical Device / AI as Safety Component (MDR)',
        group: 'Article 6(1) — Harmonised Product Safety',
        regulation_ref: 'Article 6(1) + MDR 2017/745',
        description: 'AI system embedded in a medical device subject to the Medical Devices Regulation — requires Notified Body assessment',
    },
    {
        value: 'machinery_safety',
        label: 'Machinery Safety Component',
        group: 'Article 6(1) — Harmonised Product Safety',
        regulation_ref: 'Article 6(1) + Machinery Regulation 2023/1230',
        description: 'AI safety component in machinery subject to the EU Machinery Regulation',
    },
    {
        value: 'autonomous_vehicles',
        label: 'Autonomous Vehicle / ADAS Safety Component',
        group: 'Article 6(1) — Harmonised Product Safety',
        regulation_ref: 'Article 6(1) + Regulation (EU) 2019/2144',
        description: 'AI in the safety system of autonomous or assisted-driving road vehicles',
    },
    {
        value: 'civil_aviation',
        label: 'Civil Aviation Safety Component',
        group: 'Article 6(1) — Harmonised Product Safety',
        regulation_ref: 'Article 6(1) + Regulation (EU) 2018/1139',
        description: 'AI safety component in civil aviation systems regulated by EASA',
    },
];

// Flat list of values for validation
export const VALID_PURPOSE_VALUES = PURPOSE_OPTIONS.map(o => o.value);
