/**
 * EU AI Act Constraint Engine - Knowledge Base
 * 
 * Source: Regulation (EU) 2024/1689, Official Journal of the European Union
 * URL: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1689
 * 
 * This file contains legally-grounded constraints for risk classification.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type RiskTier = 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';
export type DetectionMethod = 'library' | 'pattern' | 'context' | 'combination';

/**
 * EU AI Act Constraint - Machine-readable regulatory requirement
 */
export interface EUAIConstraint {
    /** Unique identifier (e.g., "art5_1a", "annex3_1a") */
    constraint_id: string;

    /** Legal reference (e.g., "Article 5(1)(a)") */
    regulation_source: string;

    /** Exact quote from Regulation (EU) 2024/1689 */
    official_text: string;

    /** Risk classification tier */
    risk_level: RiskTier;

    /** Human-readable category name */
    category: string;

    /** Short description for UI display */
    description: string;

    /** Code patterns/libraries that trigger this constraint */
    code_indicators: string[];

    /** How to detect this constraint */
    detection_method: DetectionMethod;

    /** Questions to ask user for context verification */
    contextual_questions?: string[];

    /** Exceptions where this constraint doesn't apply */
    exceptions?: {
        description: string;
        verification_questions: string[];
    }[];

    /** Compliance requirements if this constraint applies */
    requirements?: string[];

    /** Real-world examples */
    examples?: string[];
}

/**
 * Legacy interface for backward compatibility
 */
export interface AnnexIIIArticle {
    article: string;
    category: string;
    description: string;
    riskTier: RiskTier;
    requirements: string[];
    examples: string[];
}

// =============================================================================
// ARTICLE 5: PROHIBITED AI PRACTICES (UNACCEPTABLE RISK)
// Source: Regulation (EU) 2024/1689, Article 5
// Enforced: February 2, 2025
// =============================================================================

export const ARTICLE_5_CONSTRAINTS: EUAIConstraint[] = [
    {
        constraint_id: "art5_1a",
        regulation_source: "Article 5(1)(a)",
        official_text: "the placing on the market, the putting into service or the use of an AI system that deploys subliminal techniques beyond a person's consciousness or purposefully manipulative or deceptive techniques, with the objective, or the effect of materially distorting the behaviour of a person or a group of persons by appreciably impairing their ability to make an informed decision, thereby causing them to take a decision that they would not have otherwise taken in a manner that causes or is reasonably likely to cause that person, another person or group of persons significant harm",
        risk_level: "UNACCEPTABLE",
        category: "Subliminal & Manipulative Techniques",
        description: "AI systems deploying subliminal or manipulative techniques to distort behavior",
        code_indicators: [
            "subliminal", "manipulation", "behavioral_distortion", "covert_influence",
            "micro_targeting", "psychological_targeting", "dark_pattern", "nudge"
        ],
        detection_method: "combination",
        contextual_questions: [
            "Is the system designed to influence decisions without conscious awareness?",
            "Does the system use psychological profiling to manipulate behavior?",
            "Could the system cause users to make decisions they wouldn't otherwise make?"
        ],
        requirements: [
            "BANNED - Cannot be placed on market or used in EU"
        ],
        examples: [
            "Hidden persuasion techniques in advertising",
            "Subliminal messaging in applications",
            "Micro-targeting based on psychological vulnerabilities"
        ]
    },

    {
        constraint_id: "art5_1b",
        regulation_source: "Article 5(1)(b)",
        official_text: "the placing on the market, the putting into service or the use of an AI system that exploits any of the vulnerabilities of a natural person or a specific group of persons due to their age, disability or a specific social or economic situation, with the objective, or the effect, of materially distorting the behaviour of that person or a person belonging to that group in a manner that causes or is reasonably likely to cause that person or another person significant harm",
        risk_level: "UNACCEPTABLE",
        category: "Exploitation of Vulnerabilities",
        description: "AI systems exploiting vulnerabilities due to age, disability, or socio-economic status",
        code_indicators: [
            "vulnerable_group", "exploitation", "elderly_targeting", "child_targeting",
            "disability_exploitation", "poverty_targeting", "age_gating_manipulation"
        ],
        detection_method: "context",
        contextual_questions: [
            "Does the system specifically target people based on age, disability, or economic status?",
            "Is the objective to modify their behavior in a way that could cause harm?",
            "Does the system take advantage of reduced capacity to make informed decisions?"
        ],
        requirements: [
            "BANNED - Cannot be placed on market or used in EU"
        ],
        examples: [
            "Targeting children for in-app purchases",
            "Exploiting elderly users with confusing interfaces",
            "Predatory lending targeting low-income groups"
        ]
    },

    {
        constraint_id: "art5_1c",
        regulation_source: "Article 5(1)(c)",
        official_text: "the placing on the market, the putting into service or the use of AI systems for the evaluation or classification of natural persons or groups of persons over a certain period of time based on their social behaviour or known, inferred or predicted personal or personality characteristics, with the social score leading to either or both of the following: (i) detrimental or unfavourable treatment of certain natural persons or groups of persons in social contexts that are unrelated to the contexts in which the data was originally generated or collected; (ii) detrimental or unfavourable treatment of certain natural persons or groups of persons that is unjustified or disproportionate to their social behaviour or its gravity",
        risk_level: "UNACCEPTABLE",
        category: "Social Scoring",
        description: "Social credit scoring systems leading to detrimental treatment",
        code_indicators: [
            "social_score", "social_credit", "citizen_rating", "trustworthiness_score",
            "behavioral_score", "reputation_score", "social_ranking"
        ],
        detection_method: "pattern",
        contextual_questions: [
            "Does the system evaluate persons based on social behavior over time?",
            "Does it generate a score used for detrimental treatment?",
            "Is the score used outside the original context of data collection?"
        ],
        requirements: [
            "BANNED - Cannot be placed on market or used in EU"
        ],
        examples: [
            "Chinese-style social credit systems",
            "Citizen trustworthiness ratings",
            "Cross-platform behavioral scoring affecting access to services"
        ]
    },

    {
        constraint_id: "art5_1d",
        regulation_source: "Article 5(1)(d)",
        official_text: "the placing on the market, the putting into service for this specific purpose, or the use of an AI system for making risk assessments of natural persons in order to assess or predict the risk of a natural person committing a criminal offence, based solely on the profiling of a natural person or on assessing their personality traits and characteristics; this prohibition shall not apply to AI systems used to support the human assessment of the involvement of a person in a criminal activity, which is already based on objective and verifiable facts directly linked to a criminal activity",
        risk_level: "UNACCEPTABLE",
        category: "Predictive Criminal Profiling",
        description: "Predicting criminal risk based solely on profiling or personality traits",
        code_indicators: [
            "predictive_policing", "criminal_prediction", "recidivism_profile",
            "crime_risk_assessment", "offender_profiling", "personality_crime_prediction"
        ],
        detection_method: "context",
        contextual_questions: [
            "Does the system predict criminal behavior based on personality or profiling?",
            "Is the assessment based solely on traits rather than objective criminal facts?",
            "Does it replace human judgment in criminal risk assessment?"
        ],
        exceptions: [
            {
                description: "Supporting human assessment based on objective facts directly linked to criminal activity",
                verification_questions: [
                    "Is this supporting human assessment (not replacing it)?",
                    "Is the assessment based on objective, verifiable facts?",
                    "Are the facts directly linked to actual criminal activity?"
                ]
            }
        ],
        requirements: [
            "BANNED - Cannot be placed on market or used in EU"
        ],
        examples: [
            "Predictive policing based on personality profiles",
            "Pre-crime risk assessment without evidence",
            "Criminal tendency prediction from demographics"
        ]
    },

    {
        constraint_id: "art5_1e",
        regulation_source: "Article 5(1)(e)",
        official_text: "the placing on the market, the putting into service for this specific purpose, or the use of AI systems that create or expand facial recognition databases through the untargeted scraping of facial images from the internet or CCTV footage",
        risk_level: "UNACCEPTABLE",
        category: "Facial Image Scraping",
        description: "Creating/expanding facial recognition databases through untargeted scraping",
        code_indicators: [
            "face_scraping", "facial_database", "cctv_face_extraction",
            "untargeted_face_collection", "web_face_scraping", "mass_facial_collection"
        ],
        detection_method: "library",
        contextual_questions: [
            "Does the system scrape facial images from the internet or CCTV?",
            "Is the collection untargeted (not from specific consenting individuals)?",
            "Is the purpose to build or expand a facial recognition database?"
        ],
        requirements: [
            "BANNED - Cannot be placed on market or used in EU"
        ],
        examples: [
            "Clearview AI-style web scraping",
            "CCTV footage collection for facial databases",
            "Mass facial image harvesting from social media"
        ]
    },

    {
        constraint_id: "art5_1f",
        regulation_source: "Article 5(1)(f)",
        official_text: "the placing on the market, the putting into service for this specific purpose, or the use of AI systems to infer emotions of a natural person in the areas of workplace and education institutions, except where the use of the AI system is intended to be put in place or into the market for medical or safety reasons",
        risk_level: "UNACCEPTABLE",
        category: "Workplace/Education Emotion Recognition",
        description: "Emotion recognition in workplace or education (except medical/safety)",
        code_indicators: [
            "emotion_recognition", "emotion_detection", "facial_expression_analysis",
            "workplace_sentiment", "student_emotion", "employee_mood", "affective_computing"
        ],
        detection_method: "combination",
        contextual_questions: [
            "Is this deployed in a workplace or education institution?",
            "Does it detect or infer emotions from biometric data?",
            "Is it used for reasons other than medical or safety purposes?"
        ],
        exceptions: [
            {
                description: "Medical or safety purposes",
                verification_questions: [
                    "Is the system for medical purposes (e.g., detecting pain in patients)?",
                    "Is the system for safety purposes (e.g., detecting driver drowsiness)?",
                    "Is the deployment outside of general workplace/education monitoring?"
                ]
            }
        ],
        requirements: [
            "BANNED in workplace/education - Allowed only for medical/safety"
        ],
        examples: [
            "Employee monitoring for engagement/mood",
            "Student attention tracking in classrooms",
            "Worker stress detection systems"
        ]
    },

    {
        constraint_id: "art5_1g",
        regulation_source: "Article 5(1)(g)",
        official_text: "the placing on the market, the putting into service for this specific purpose, or the use of biometric categorisation systems that categorise individually natural persons based on their biometric data to deduce or infer their race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation; this prohibition does not cover any labelling or filtering of lawfully acquired biometric datasets, such as images, based on biometric data or categorizing of biometric data in the area of law enforcement",
        risk_level: "UNACCEPTABLE",
        category: "Protected Characteristic Biometric Categorization",
        description: "Biometric categorization to infer race, politics, religion, sexuality, etc.",
        code_indicators: [
            "race_classification", "political_inference", "religion_detection",
            "sexual_orientation_prediction", "biometric_protected_category"
        ],
        detection_method: "library",
        contextual_questions: [
            "Does the system categorize individuals by protected characteristics using biometrics?",
            "Does it infer race, political opinions, religion, or sexual orientation from biometric data?",
            "Is this NOT lawful law enforcement labelling/filtering of datasets?"
        ],
        exceptions: [
            {
                description: "Lawful labelling/filtering of biometric datasets in law enforcement",
                verification_questions: [
                    "Is this for law enforcement purposes?",
                    "Is it labelling/filtering lawfully acquired datasets?",
                    "Is it NOT for individual categorization based on protected characteristics?"
                ]
            }
        ],
        requirements: [
            "BANNED - Cannot be placed on market or used in EU"
        ],
        examples: [
            "Race detection from facial features",
            "Political opinion inference from voice patterns",
            "Sexual orientation prediction from biometrics"
        ]
    },

    {
        constraint_id: "art5_1h",
        regulation_source: "Article 5(1)(h)",
        official_text: "the use of AI systems for real-time remote biometric identification of natural persons in publicly accessible spaces for the purpose of law enforcement, unless and in so far as such use is strictly necessary for one of the following objectives: (a) the search for potential victims of crime, including missing or exploited children; (b) the prevention of a specific, substantive and imminent threat to the life or physical safety of natural persons or of a terrorist attack; (c) the locating or identification of a person suspected of having committed a serious crime",
        risk_level: "UNACCEPTABLE",
        category: "Real-time Public Biometric ID (Law Enforcement)",
        description: "Real-time remote biometric identification in public spaces for law enforcement",
        code_indicators: [
            "real_time_biometric", "live_facial_recognition", "public_space_surveillance",
            "law_enforcement_biometric", "cctv_face_matching", "live_identification"
        ],
        detection_method: "combination",
        contextual_questions: [
            "Is this real-time (not post) biometric identification?",
            "Is it deployed in publicly accessible spaces?",
            "Is it for law enforcement purposes?"
        ],
        exceptions: [
            {
                description: "Narrow exceptions for critical situations",
                verification_questions: [
                    "Is it for searching for victims (missing/exploited children)?",
                    "Is it for preventing imminent threat to life or terrorist attack?",
                    "Is it for locating suspects of serious crimes?",
                    "Has judicial authorization been obtained or requested within 24 hours?"
                ]
            }
        ],
        requirements: [
            "BANNED by default - Narrow exceptions require judicial authorization"
        ],
        examples: [
            "Mass surveillance facial recognition in cities",
            "Real-time face matching in public transit",
            "Live biometric scanning in shopping centers"
        ]
    }
];

// =============================================================================
// ANNEX III: HIGH-RISK AI SYSTEMS
// Source: Regulation (EU) 2024/1689, Annex III
// Fully Enforceable: August 2, 2026
// =============================================================================

export const ANNEX_III_CONSTRAINTS: EUAIConstraint[] = [
    // Category 1: Biometrics
    {
        constraint_id: "annex3_1a",
        regulation_source: "Annex III(1)(a)",
        official_text: "remote biometric identification systems. This shall not include AI systems intended to be used for biometric verification the sole purpose of which is to confirm that a specific natural person is the person he or she claims to be",
        risk_level: "HIGH_RISK",
        category: "Remote Biometric Identification",
        description: "Systems that identify unknown persons from biometric data",
        code_indicators: [
            "face_recognition", "facial_matching", "biometric_identification",
            "face_search", "person_identification", "biometric_search"
        ],
        detection_method: "library",
        contextual_questions: [
            "Does the system identify unknown persons (not verify claimed identity)?",
            "Is it remote (not in-person fingerprint/iris scan)?",
            "Does it search against a database of faces?"
        ],
        exceptions: [
            {
                description: "Biometric VERIFICATION (confirming claimed identity) is NOT high-risk",
                verification_questions: [
                    "Is the sole purpose to confirm someone is who they claim to be?",
                    "Is it 1:1 matching rather than 1:N search?",
                    "Does the person knowingly present themselves for verification?"
                ]
            }
        ],
        requirements: [
            "Conformity assessment required",
            "Registration in EU database",
            "Human oversight mandatory",
            "Logging of all operations"
        ],
        examples: [
            "Unknown person identification from CCTV",
            "Face search against photo database",
            "Remote identification without consent"
        ]
    },

    {
        constraint_id: "annex3_1b",
        regulation_source: "Annex III(1)(b)",
        official_text: "AI systems intended to be used for biometric categorisation, according to sensitive or protected attributes or characteristics based on the inference of those attributes or characteristics",
        risk_level: "HIGH_RISK",
        category: "Biometric Categorization",
        description: "Categorizing persons by sensitive attributes using biometric data",
        code_indicators: [
            "gender_classification", "age_detection", "ethnicity_detection",
            "biometric_categorization", "demographic_inference"
        ],
        detection_method: "library",
        requirements: [
            "Transparency to users",
            "Human oversight",
            "Non-discrimination testing"
        ],
        examples: [
            "Age verification from facial features",
            "Gender detection systems",
            "Demographic profiling"
        ]
    },

    {
        constraint_id: "annex3_1c",
        regulation_source: "Annex III(1)(c)",
        official_text: "AI systems intended to be used for emotion recognition",
        risk_level: "HIGH_RISK",
        category: "Emotion Recognition",
        description: "All emotion recognition systems (outside workplace/education ban)",
        code_indicators: [
            "emotion_recognition", "emotion_detection", "sentiment_biometric",
            "affective_computing", "mood_detection", "facial_expression_analysis"
        ],
        detection_method: "library",
        contextual_questions: [
            "Does the system detect emotions from biometric data?",
            "Is it used outside workplace/education (which is UNACCEPTABLE)?"
        ],
        requirements: [
            "Transparency - inform users emotions are being detected",
            "Human oversight",
            "Right to object"
        ],
        examples: [
            "Customer sentiment analysis",
            "Engagement detection (non-workplace)",
            "Mood tracking applications"
        ]
    },

    // Category 2: Critical Infrastructure
    {
        constraint_id: "annex3_2",
        regulation_source: "Annex III(2)",
        official_text: "AI systems intended to be used as safety components in the management and operation of critical digital infrastructure, road traffic, or in the supply of water, gas, heating or electricity",
        risk_level: "HIGH_RISK",
        category: "Critical Infrastructure",
        description: "Safety components in critical infrastructure management",
        code_indicators: [
            "scada", "power_grid", "water_treatment", "gas_distribution",
            "traffic_control", "electricity_management", "critical_infrastructure",
            "industrial_control", "grid_management"
        ],
        detection_method: "context",
        contextual_questions: [
            "Is this embedded in critical infrastructure management?",
            "Could malfunction cause physical harm or supply disruption?",
            "Is it a safety-critical component?"
        ],
        requirements: [
            "Risk management system",
            "Quality management system",
            "Technical documentation",
            "Conformity assessment",
            "Post-market monitoring"
        ],
        examples: [
            "Power grid optimization AI",
            "Traffic signal control systems",
            "Water treatment automation",
            "Railway signaling systems"
        ]
    },

    // Category 3: Education
    {
        constraint_id: "annex3_3",
        regulation_source: "Annex III(3)",
        official_text: "AI systems intended to be used for: (a) determining or assisting in determining access or admission to educational and vocational training institutions; (b) assessing students in educational or vocational training institutions; (c) assigning students to educational or vocational training institutions; (d) monitoring and detecting prohibited behaviour of students",
        risk_level: "HIGH_RISK",
        category: "Education & Vocational Training",
        description: "AI for educational access, assessment, assignment, or behavior monitoring",
        code_indicators: [
            "student_assessment", "admission_decision", "grade_prediction",
            "educational_ai", "student_evaluation", "academic_monitoring",
            "plagiarism_detection", "proctoring", "student_placement"
        ],
        detection_method: "context",
        contextual_questions: [
            "Does it determine access to education or training?",
            "Does it assess or grade students?",
            "Does it monitor student behavior?",
            "Could it affect student prospects or eligibility?"
        ],
        requirements: [
            "Transparency to students",
            "Human oversight in decisions",
            "Right to explanation",
            "Non-discrimination testing"
        ],
        examples: [
            "University admission scoring",
            "Automated essay grading",
            "Exam proctoring AI",
            "Academic dishonesty detection"
        ]
    },

    // Category 4: Employment
    {
        constraint_id: "annex3_4",
        regulation_source: "Annex III(4)",
        official_text: "AI systems intended to be used for: (a) recruitment or selection of persons; (b) work-related decisions such as promotion, termination, task allocation, performance monitoring or pay setting; (c) worker surveillance and monitoring",
        risk_level: "HIGH_RISK",
        category: "Employment & Worker Management",
        description: "AI for recruitment, work decisions, or worker monitoring",
        code_indicators: [
            "resume_screening", "hiring_ai", "recruitment", "performance_evaluation",
            "employee_monitoring", "worker_surveillance", "promotion_decision",
            "termination_prediction", "task_allocation", "productivity_tracking"
        ],
        detection_method: "context",
        contextual_questions: [
            "Is this for recruitment or candidate selection?",
            "Does it affect promotion, termination, or pay?",
            "Does it monitor worker behavior or productivity?"
        ],
        requirements: [
            "Transparency to applicants/workers",
            "Human oversight mandatory",
            "Right to explanation",
            "Bias testing and mitigation"
        ],
        examples: [
            "Resume screening systems",
            "Interview analysis AI",
            "Performance monitoring software",
            "Productivity tracking tools"
        ]
    },

    // Category 5: Essential Services
    {
        constraint_id: "annex3_5",
        regulation_source: "Annex III(5)",
        official_text: "AI systems intended to be used for evaluating the eligibility of natural persons for essential private and public services and benefits, as well as for granting, reducing, revoking or reclaiming such services and benefits",
        risk_level: "HIGH_RISK",
        category: "Essential Services Access",
        description: "AI for determining eligibility for essential services and benefits",
        code_indicators: [
            "credit_scoring", "loan_decision", "insurance_underwriting",
            "benefit_eligibility", "mortgage_decision", "welfare_assessment",
            "housing_allocation", "utility_access"
        ],
        detection_method: "context",
        contextual_questions: [
            "Does it determine access to essential services?",
            "Does it affect credit, insurance, or benefits eligibility?",
            "Could denial cause significant harm to individuals?"
        ],
        requirements: [
            "Transparency to consumers",
            "Right to explanation",
            "Human review option",
            "Non-discrimination testing"
        ],
        examples: [
            "Credit scoring systems",
            "Loan approval algorithms",
            "Insurance risk assessment",
            "Social benefit eligibility"
        ]
    },

    // Category 6: Law Enforcement
    {
        constraint_id: "annex3_6",
        regulation_source: "Annex III(6)",
        official_text: "AI systems intended to be used by law enforcement for: (a) individual risk assessment; (b) polygraphs and similar tools; (c) to assess reliability of evidence; (d) to detect the emotional state of a natural person; (e) for predicting the occurrence or reoccurrence of criminal or administrative offences; (f) profiling of natural persons",
        risk_level: "HIGH_RISK",
        category: "Law Enforcement",
        description: "AI for law enforcement risk assessment, evidence, or profiling",
        code_indicators: [
            "law_enforcement", "police_ai", "recidivism_assessment",
            "evidence_analysis", "criminal_profiling", "risk_assessment_le",
            "polygraph", "deception_detection"
        ],
        detection_method: "context",
        contextual_questions: [
            "Is this for law enforcement use?",
            "Does it assess criminal risk or analyze evidence?",
            "Does it profile individuals for law enforcement?"
        ],
        requirements: [
            "Strict human oversight",
            "Logging of all uses",
            "Regular auditing",
            "Judicial oversight for some uses"
        ],
        examples: [
            "Recidivism risk assessment",
            "Evidence reliability analysis",
            "Criminal profiling systems"
        ]
    },

    // Category 7: Migration & Asylum
    {
        constraint_id: "annex3_7",
        regulation_source: "Annex III(7)",
        official_text: "AI systems intended to be used by competent public authorities for migration, asylum and border control management for: (a) polygraphs and similar tools; (b) to assess security, irregular migration, or health risks; (c) to assist in the examination of applications for asylum, visa or residence permits; (d) for verifying authenticity of travel documents",
        risk_level: "HIGH_RISK",
        category: "Migration, Asylum & Border Control",
        description: "AI for immigration, asylum, or border control decisions",
        code_indicators: [
            "visa_processing", "asylum_assessment", "border_control",
            "immigration_ai", "document_verification", "migration_risk"
        ],
        detection_method: "context",
        contextual_questions: [
            "Is this for immigration or border control?",
            "Does it assess visa, asylum, or residence applications?",
            "Does it verify travel documents?"
        ],
        requirements: [
            "Human review of all decisions",
            "Right to appeal",
            "Transparency requirements",
            "Non-discrimination safeguards"
        ],
        examples: [
            "Visa application screening",
            "Asylum claim assessment",
            "Border security biometrics",
            "Document authenticity checking"
        ]
    },

    // Category 8: Justice & Democratic Processes
    {
        constraint_id: "annex3_8",
        regulation_source: "Annex III(8)",
        official_text: "AI systems intended to assist a judicial authority in researching and interpreting facts and the law and in applying the law to a concrete set of facts, or to be used in a similar way in alternative dispute resolution",
        risk_level: "HIGH_RISK",
        category: "Administration of Justice",
        description: "AI assisting judicial authorities or dispute resolution",
        code_indicators: [
            "legal_research", "judicial_ai", "case_prediction",
            "sentencing_recommendation", "dispute_resolution", "legal_analysis"
        ],
        detection_method: "context",
        contextual_questions: [
            "Does it assist judicial authorities?",
            "Does it interpret or apply law?",
            "Is it used in dispute resolution?"
        ],
        requirements: [
            "Transparency to affected parties",
            "Human judge oversight",
            "Right to explanation",
            "Appeal mechanisms"
        ],
        examples: [
            "Legal research AI",
            "Case outcome prediction",
            "Sentencing recommendation systems"
        ]
    },
    {
        constraint_id: "annex3_8b",
        regulation_source: "Annex III(8)(b)",
        official_text: "AI systems intended to be used for influencing the outcome of an election or referendum or the voting behaviour of natural persons in the exercise of their rights in the context of elections or referenda",
        risk_level: "HIGH_RISK",
        category: "Administration of Justice",
        description: "AI intended to influence elections or voting behavior",
        code_indicators: [
            "election_influence", "voting_behavior", "voter_targeting",
            "political_campaigning", "voter_profiling", "opinion_manipulation"
        ],
        detection_method: "context",
        contextual_questions: [
            "Is the system used to influence election or referendum outcomes?",
            "Does it target individuals to influence their voting behavior?",
            "Is it used in the context of political campaigns?"
        ],
        requirements: [
            "Transparency to voters",
            "High robustness / cybersecurity",
            "Human oversight",
            "Logging of all operations"
        ],
        examples: [
            "Micro-targeting based on political leanings",
            "AI-driven political message optimization",
            "Voter behavior prediction for campaigning"
        ]
    },

    // Category 9: Autonomous Vehicles (Article 26 equivalent)
    {
        constraint_id: "annex3_av",
        regulation_source: "Article 26", // Specific citation kept for classifier match
        official_text: "AI systems intended to be used as safety components in autonomous road vehicles",
        risk_level: "HIGH_RISK",
        category: "Autonomous Vehicles",
        description: "Safety components in autonomous vehicles",
        code_indicators: [
            "autonomous_driving", "lane_detection", "object_detection_vehicle",
            "self_driving", "autopilot", "vehicle_control"
        ],
        detection_method: "context",
        requirements: ["Conformity assessment", "Technical documentation"],
        examples: ["Self-driving car software", "Lane keep assist"]
    }
];

// =============================================================================
// LIMITED RISK CONSTRAINTS (Article 50 - Transparency)
// =============================================================================

export const LIMITED_RISK_CONSTRAINTS: EUAIConstraint[] = [
    {
        constraint_id: "art50_chatbot",
        regulation_source: "Article 50(1)",
        official_text: "Providers shall ensure that AI systems intended to interact directly with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system",
        risk_level: "LIMITED_RISK",
        category: "Chatbots & Conversational AI",
        description: "AI systems that interact directly with users must disclose AI nature",
        code_indicators: [
            "chatbot", "conversational_ai", "chat_interface", "virtual_assistant",
            "openai", "anthropic", "langchain", "chatgpt", "claude"
        ],
        detection_method: "library",
        requirements: [
            "Inform users they are interacting with AI",
            "Disclosure must be clear and timely"
        ],
        examples: [
            "Customer service chatbots",
            "Virtual assistants",
            "AI-powered support systems"
        ]
    },

    {
        constraint_id: "art50_synthetic",
        regulation_source: "Article 50(4)",
        official_text: "Deployers of an AI system that generates or manipulates image, audio or video content constituting a deep fake, shall disclose that the content has been artificially generated or manipulated",
        risk_level: "LIMITED_RISK",
        category: "Synthetic Content / Deepfakes",
        description: "AI-generated or manipulated media must be disclosed",
        code_indicators: [
            "deepfake", "synthetic_media", "image_generation", "video_generation",
            "dalle", "stable_diffusion", "midjourney", "voice_synthesis", "face_swap"
        ],
        detection_method: "library",
        requirements: [
            "Disclose that content is AI-generated",
            "Label synthetic content appropriately"
        ],
        examples: [
            "AI-generated images",
            "Voice synthesis/cloning",
            "Deepfake videos",
            "AI art generation"
        ]
    },

    {
        constraint_id: "art50_generative",
        regulation_source: "Article 50(2)",
        official_text: "Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content, shall ensure that the outputs of the AI system are marked in a machine-readable format and detectable as artificially generated or manipulated",
        risk_level: "LIMITED_RISK",
        category: "Generative AI",
        description: "Generative AI outputs must be marked as AI-generated",
        code_indicators: [
            "generative_ai", "llm", "text_generation", "code_generation",
            "gpt", "llama", "mistral", "gemini", "copilot"
        ],
        detection_method: "library",
        requirements: [
            "Mark outputs as AI-generated (machine-readable)",
            "Ensure outputs are detectable as synthetic"
        ],
        examples: [
            "Code generation tools",
            "Text generation (ChatGPT, Claude)",
            "AI writing assistants"
        ]
    }
];

// =============================================================================
// GPAI CONSTRAINTS (Chapter V: Articles 51-55)
// Source: Regulation (EU) 2024/1689, Chapter V
// Entry into force: 2 August 2025
// =============================================================================

export const GPAI_CONSTRAINTS: EUAIConstraint[] = [
    {
        constraint_id: "art53_tech_docs",
        regulation_source: "Article 53(1)(a)",
        official_text: "draw up and keep up-to-date the technical documentation of the model, including its training and testing process and the results of its evaluation, which shall contain, at a minimum, the information set out in Annex XI for the purpose of providing it, upon request, to the AI Office and the national competent authorities",
        risk_level: "LIMITED_RISK",
        category: "GPAI Technical Documentation",
        description: "GPAI model providers must maintain technical documentation per Annex XI",
        code_indicators: [
            "openai", "anthropic", "langchain", "llm", "gpt", "claude",
            "generative_ai", "foundation_model", "text_generation"
        ],
        detection_method: "library",
        requirements: [
            "Technical documentation per Annex XI",
            "Training and testing process documentation",
            "Evaluation results documentation",
            "Available to AI Office upon request"
        ],
        examples: [
            "OpenAI GPT model training documentation",
            "Anthropic Claude model card",
            "Model evaluation benchmark results"
        ]
    },
    {
        constraint_id: "art53_downstream_info",
        regulation_source: "Article 53(1)(b)",
        official_text: "draw up, keep up-to-date and make available information and documentation to providers of AI systems who intend to integrate the general-purpose AI model into their AI systems, containing at a minimum the elements set out in Annex XII",
        risk_level: "LIMITED_RISK",
        category: "GPAI Downstream Provider Information",
        description: "GPAI providers must provide integration documentation to downstream AI system providers per Annex XII",
        code_indicators: [
            "openai", "anthropic", "langchain", "llm_api", "model_api"
        ],
        detection_method: "library",
        requirements: [
            "Capabilities and limitations documentation per Annex XII",
            "Integration guidance for downstream providers",
            "Intellectual property protections maintained"
        ],
        examples: [
            "API documentation for GPT integration",
            "Model capabilities and limitations guides"
        ]
    },
    {
        constraint_id: "art53_copyright",
        regulation_source: "Article 53(1)(c)",
        official_text: "put in place a policy to comply with Union law on copyright and related rights, and in particular to identify and comply with, including through state-of-the-art technologies, a reservation of rights expressed pursuant to Article 4(3) of Directive (EU) 2019/790",
        risk_level: "LIMITED_RISK",
        category: "GPAI Copyright Compliance",
        description: "GPAI providers must have copyright compliance policy respecting reservations of rights",
        code_indicators: [
            "training_data", "web_scraping", "data_collection", "corpus"
        ],
        detection_method: "context",
        requirements: [
            "Copyright compliance policy",
            "State-of-the-art technology for rights identification",
            "Respect for reservations of rights under Directive 2019/790"
        ],
        examples: [
            "Training data sourcing with copyright checks",
            "Opt-out mechanism for content creators"
        ]
    },
    {
        constraint_id: "art53_training_summary",
        regulation_source: "Article 53(1)(d)",
        official_text: "draw up and make publicly available a sufficiently detailed summary about the content used for training of the general-purpose AI model, according to a template provided by the AI Office",
        risk_level: "LIMITED_RISK",
        category: "GPAI Training Data Summary",
        description: "GPAI providers must publish training data summary using AI Office template",
        code_indicators: [
            "training_data", "dataset", "model_training"
        ],
        detection_method: "context",
        requirements: [
            "Publicly available training data summary",
            "Follows AI Office template format"
        ],
        examples: [
            "Published training data summary document",
            "Publicly accessible model data card"
        ]
    },
    {
        constraint_id: "art55_adversarial_testing",
        regulation_source: "Article 55(1)(a)",
        official_text: "perform model evaluation in accordance with standardised protocols and tools reflecting the state of the art, including conducting and documenting adversarial testing of the model with a view to identifying and mitigating systemic risks",
        risk_level: "HIGH_RISK",
        category: "GPAI Systemic Risk - Adversarial Testing",
        description: "Systemic risk GPAI providers must conduct adversarial testing using standardised protocols",
        code_indicators: [
            "gpt-4", "claude-3-opus", "gemini-ultra", "systemic_risk"
        ],
        detection_method: "context",
        requirements: [
            "Model evaluation per standardised protocols",
            "Adversarial testing documentation",
            "Systemic risk identification and mitigation"
        ],
        examples: [
            "Red-teaming of large language models",
            "Safety evaluation of foundation models"
        ]
    },
    {
        constraint_id: "art55_incident_reporting",
        regulation_source: "Article 55(1)(c)",
        official_text: "keep track of, document, and report, without undue delay, to the AI Office and, as appropriate, to national competent authorities, relevant information about serious incidents and possible corrective measures to address them",
        risk_level: "HIGH_RISK",
        category: "GPAI Systemic Risk - Incident Reporting",
        description: "Systemic risk GPAI providers must report serious incidents to AI Office without undue delay",
        code_indicators: [
            "incident_report", "safety_incident", "systemic_risk"
        ],
        detection_method: "context",
        requirements: [
            "Incident tracking and documentation",
            "Reporting to AI Office without undue delay",
            "Corrective measures documentation"
        ],
        examples: [
            "Model safety incident log",
            "AI Office incident notification"
        ]
    }
];

// =============================================================================
// COMBINED EXPORTS
// =============================================================================

/** All EU AI Act constraints for the constraint engine.
 * NOTE: GPAI_CONSTRAINTS are intentionally EXCLUDED here because they are
 * provider-only obligations (Articles 53, 55). The GPAI classifier in
 * gpai-classifier.ts handles them separately with proper provider/deployer
 * distinction. Including them here would incorrectly flag deployers/integrators
 * who merely use APIs from OpenAI, Anthropic, etc.
 */
export const ALL_CONSTRAINTS: EUAIConstraint[] = [
    ...ARTICLE_5_CONSTRAINTS,
    ...ANNEX_III_CONSTRAINTS,
    ...LIMITED_RISK_CONSTRAINTS,
    // GPAI_CONSTRAINTS excluded — handled by gpai-classifier.ts
];

/** Get all UNACCEPTABLE (banned) constraints */
export function getUnacceptableConstraints(): EUAIConstraint[] {
    return ARTICLE_5_CONSTRAINTS;
}

/** Get all HIGH_RISK constraints */
export function getHighRiskConstraints(): EUAIConstraint[] {
    return ANNEX_III_CONSTRAINTS;
}

/** Get all LIMITED_RISK constraints */
export function getLimitedRiskConstraints(): EUAIConstraint[] {
    return LIMITED_RISK_CONSTRAINTS;
}

/** Find constraint by ID */
export function findConstraintById(id: string): EUAIConstraint | undefined {
    return ALL_CONSTRAINTS.find(c => c.constraint_id === id);
}

/** Find constraints by risk level */
export function findConstraintsByRiskLevel(level: RiskTier): EUAIConstraint[] {
    return ALL_CONSTRAINTS.filter(c => c.risk_level === level);
}

// =============================================================================
// LEGACY EXPORTS (Backward Compatibility)
// =============================================================================

export const HIGH_RISK_ARTICLES: AnnexIIIArticle[] = ANNEX_III_CONSTRAINTS.map(c => ({
    article: c.regulation_source,
    category: c.category,
    description: c.description,
    riskTier: c.risk_level,
    requirements: c.requirements || [],
    examples: c.examples || []
}));

export const LIMITED_RISK_ARTICLES: AnnexIIIArticle[] = LIMITED_RISK_CONSTRAINTS.map(c => ({
    article: c.regulation_source,
    category: c.category,
    description: c.description,
    riskTier: c.risk_level,
    requirements: c.requirements || [],
    examples: c.examples || []
}));

export const UNACCEPTABLE_RISKS = ARTICLE_5_CONSTRAINTS.map(c => ({
    category: c.category,
    description: c.description,
    examples: c.examples || []
}));

export function getAllArticles(): AnnexIIIArticle[] {
    return [...HIGH_RISK_ARTICLES, ...LIMITED_RISK_ARTICLES];
}

export function findArticleByCategory(keyword: string): AnnexIIIArticle | undefined {
    const allArticles = getAllArticles();
    const lowerKeyword = keyword.toLowerCase();

    return allArticles.find(article =>
        article.category.toLowerCase().includes(lowerKeyword) ||
        article.description.toLowerCase().includes(lowerKeyword)
    );
}
