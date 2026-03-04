/**
 * Document Generator - Phase 2.2
 * Generates EU AI Act compliance documents from templates + scan data
 */

import fs from 'fs';
import path from 'path';

// Document type definitions
export const DOCUMENT_TYPES = {
    technical_doc: {
        title: 'Technical Documentation',
        template: 'technical_documentation.md',
        article: 'Article 11',
    },
    risk_management: {
        title: 'Risk Management Plan',
        template: 'risk_management_plan.md',
        article: 'Article 9',
    },
    data_governance: {
        title: 'Data Governance Documentation',
        template: 'data_governance.md',
        article: 'Article 10',
    },
    instructions_for_use: {
        title: 'Instructions for Use',
        template: 'instructions_for_use.md',
        article: 'Article 13',
    },
    declaration_of_conformity: {
        title: 'EU Declaration of Conformity',
        template: 'declaration_of_conformity.md',
        article: 'EU AI Act',
    },
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

// Field mappings from scan data to template placeholders
export interface ScanData {
    aiSystem: {
        id: string;
        name: string;
        description?: string | null;
        risk_classification?: string | null;
        risk_score?: number | null;
        last_scanned_at?: Date | null;
        capabilities?: Record<string, unknown> | null;
        matched_articles?: Record<string, unknown>[] | null;
    };
    llmAnalysis?: {
        capabilities?: string[];
        libraries?: string[];
        intended_purpose?: string;
    } | null;
    riskAssessment?: {
        risk_narrative?: string;
        matched_annex_iii_articles?: Record<string, unknown>[];
    } | null;
    contextAnswers?: Record<string, string> | null;
    user?: {
        email?: string;
        full_name?: string;
    } | null;
}

/**
 * Load template from file system
 */
export function loadTemplate(documentType: DocumentType): string {
    const templateInfo = DOCUMENT_TYPES[documentType];
    const templatePath = path.join(
        process.cwd(),
        'src/lib/document-templates',
        templateInfo.template
    );

    try {
        return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
        console.error(`Failed to load template: ${templateInfo.template}`, error);
        throw new Error(`Template not found: ${documentType}`);
    }
}

/**
 * Build the placeholder mapping from scan data
 */
export function buildPlaceholderMap(data: ScanData): Record<string, string> {
    const { aiSystem, llmAnalysis, riskAssessment, contextAnswers, user } = data;

    // Format capabilities list
    const capabilitiesList = llmAnalysis?.capabilities?.length
        ? llmAnalysis.capabilities.map(c => `- ${c}`).join('\n')
        : '{{MISSING: capabilities_list}}';

    // Format libraries list
    const librariesList = llmAnalysis?.libraries?.length
        ? llmAnalysis.libraries.map(l => `- ${l}`).join('\n')
        : '{{MISSING: libraries_list}}';

    // Format matched articles
    const matchedArticles = riskAssessment?.matched_annex_iii_articles?.length
        ? riskAssessment.matched_annex_iii_articles
            .map((a: Record<string, unknown>) => `- **${a.article_id}:** ${a.title}`)
            .join('\n')
        : '{{MISSING: matched_articles}}';

    // Instructional Placeholders for "Audit-Ready Scaffolding"
    // These guide the user to fill in the data rather than showing "MISSING" errors.

    const instructionalDefaults = {
        architecture_diagram: '> [ACTION REQUIRED: Insert system architecture diagram here. Reference internal design doc ID.]',
        ui_description: '> [ACTION REQUIRED: Describe the UI presented to the user. Include key screens/inputs.]',
        interoperability: '> [ACTION REQUIRED: List APIs, hardware, or software this system connects to.]',
        algo_logic: '> [ACTION REQUIRED: Explain the algorithmic approach (e.g., Transformer-based LLM, Random Forest).]',
        accuracy_results: '> [ACTION REQUIRED: Insert final validation metrics (e.g., F1 Score, Accuracy %).] -- See Test Report TR-001.',
    };

    return {
        // --- Header / Component Data ---
        system_name: aiSystem.name,
        system_id: aiSystem.id,
        version: '1.0 (Draft)',
        confidentiality_level: 'Internal Use Only', // Default for generated docs
        risk_classification: aiSystem.risk_classification || 'Assessment Pending',
        risk_score: aiSystem.risk_score?.toString() || 'N/A',
        last_scanned_at: aiSystem.last_scanned_at
            ? new Date(aiSystem.last_scanned_at).toLocaleDateString()
            : new Date().toLocaleDateString(),
        system_description: aiSystem.description || '> [ACTION REQUIRED: Provide a detailed description of the AI system and its intended use case.]',

        // --- Provider Info ---
        provider_name: contextAnswers?.provider_name || user?.full_name || '[Provider Name]',
        provider_address: contextAnswers?.provider_address || '[Provider Address]',
        contact_person: user?.full_name || '[Authorized Representative]',
        contact_email: user?.email || '[Email Address]',

        // --- Technical Capabilities ---
        capabilities_list: capabilitiesList,
        libraries_list: librariesList,
        intended_purpose: llmAnalysis?.intended_purpose || contextAnswers?.intended_purpose || '> [ACTION REQUIRED: Define the exact intended purpose of the system.]',

        // --- Development & Data (Annex IV) ---
        // Using "Instructional Defaults" instead of "MISSING"
        training_data_sources: contextAnswers?.training_data || '> [ACTION REQUIRED: Describe training data sources, provenance, and scope. Reference Data Governance Policy.]',
        preprocessing_steps: '> [ACTION REQUIRED: Describe data cleaning, normalization, and pre-processing steps.]',
        data_labeling_procedures: '> [ACTION REQUIRED: Describe how data was labeled and quality controlled.]',
        bias_mitigation: '> [ACTION REQUIRED: Describe measures taken to identify and mitigate bias in the dataset.]',
        validation_metrics: '> [ACTION REQUIRED: List the metrics used for validation (e.g., Robustness, Fairness).]',

        // --- Instructional Placeholders (New) ---
        architecture_diagram_placeholder: instructionalDefaults.architecture_diagram,
        ui_description_placeholder: instructionalDefaults.ui_description,
        interoperability_placeholder: instructionalDefaults.interoperability,
        algo_logic_placeholder: instructionalDefaults.algo_logic,
        accuracy_results_placeholder: instructionalDefaults.accuracy_results,

        // --- Risk Management (Article 9) ---
        rms_methodology_placeholder: '> [ACTION REQUIRED: Describe risk management methodology (ISO 31000/14971) and acceptance criteria.]',
        rms_frequency_placeholder: '> [ACTION REQUIRED: Define frequency of risk reviews (e.g., Quarterly, Post-Release).]',
        high_priority_risks_list: '> [ACTION REQUIRED: List high-priority risks identified during automated scanning.]',
        foreseeable_misuse_placeholder: '> [ACTION REQUIRED: Analyze reasonably foreseeable misuse scenarios.]',
        risk_matrix_placeholder: '> [ACTION REQUIRED: Insert Risk Matrix (Probability vs Severity).]',
        post_market_risk_placeholder: '> [ACTION REQUIRED: Analyze risks emerging from post-market monitoring data.]',
        mitigation_list_placeholder: '> [ACTION REQUIRED: List mitigation measures and their verification results.]',
        residual_risk_statement_placeholder: '> [ACTION REQUIRED: Statement accepting overall residual risk.]',
        vulnerable_groups_placeholder: '> [ACTION REQUIRED: Assessment of impact on children and vulnerable groups.]',

        // --- Data Governance (Article 10) ---
        data_strategy_placeholder: '> [ACTION REQUIRED: Explain design choices and data collection strategy.]',
        data_provenance_list: '> [ACTION REQUIRED: List all datasets, sources, and provenance info.]',
        training_data_stats: '> [ACTION REQUIRED: Statistical characteristics of the training dataset.]',
        validation_data_stats: '> [ACTION REQUIRED: Statistical characteristics of validation/testing datasets.]',
        data_preparation_placeholder: '> [ACTION REQUIRED: Details on cleaning, filtration, and normalization.]',
        data_labeling_placeholder: '> [ACTION REQUIRED: Labeling procedures and quality control measures.]',
        bias_analysis_placeholder: '> [ACTION REQUIRED: Methodology for detecting bias (gender, race, etc.).]',
        bias_mitigation_placeholder: '> [ACTION REQUIRED: Strategy for mitigating identified biases.]',
        gdpr_compliance_statement: '> [ACTION REQUIRED: Justification for processing personal data (GDPR Art. 6/9).]',
        privacy_measures_placeholder: '> [ACTION REQUIRED: Privacy-preserving techniques (anonymization, encryption).]',

        // --- Instructions for Use (Article 13) ---
        performance_metrics_placeholder: '> [ACTION REQUIRED: Accuracy, Robustness, and Cybersecurity metrics.]',
        misuse_warning_placeholder: '> [ACTION REQUIRED: Warnings against reasonably foreseeable misuse.]',
        hardware_requirements_placeholder: '> [ACTION REQUIRED: Required hardware (CPU/GPU, RAM, Disk).]',
        expected_lifetime_placeholder: '> [ACTION REQUIRED: Expected lifetime and end-of-life procedure.]',
        output_interpretation_placeholder: '> [ACTION REQUIRED: Guide on interpreting system outputs and confidence scores.]',
        human_override_placeholder: '> [ACTION REQUIRED: Instructions for human override/intervention.]',
        logging_instructions_placeholder: '> [ACTION REQUIRED: How to access and interpret system logs.]',

        // --- Declaration of Conformity (Annex V) ---
        other_legislation_placeholder: '> [Itemize other applicable Union legislation (e.g., Machinery Directive).]',
        standards_placeholder: '> [List harmonised standards or common specifications applied.]',
        notified_body_name: '[Notified Body Name - if applicable]',
        notified_body_number: '[NB Number]',
        conformity_assessment_procedure: 'Annex VII (Internal Control) OR Annex VII (Assessment of QMS)',
        certificate_number: '[Certificate Number - if applicable]',
        place_of_issue: '[City, Country]',
        date_of_issue: new Date().toLocaleDateString(),

        // --- Hardware/Software ---
        hardware_requirements: '> [ACTION REQUIRED: Specify computing resources required (GPU/CPU/RAM).]',
        software_dependencies: '> [ACTION REQUIRED: List OS, libraries, and runtime dependencies.]',

        // --- Risk & Oversight ---
        known_limitations: contextAnswers?.limitations || '> [ACTION REQUIRED: List known limitations, edge cases, and areas where performance may degrade.]',
        human_oversight_measures: contextAnswers?.human_oversight || '> [ACTION REQUIRED: Describe Article 14 measures (e.g., "Human-in-the-loop" for critical decisions).]',
        security_measures: '> [ACTION REQUIRED: Describe cybersecurity measures (encryption, access control, etc.).]',
        logging_description: '> [ACTION REQUIRED: Describe logging for traceability (Article 12).]',

        // --- Risk Assessment ---
        risk_narrative: riskAssessment?.risk_narrative || '> [ACTION REQUIRED: Summarize the risk assessment findings.]',
        matched_articles: matchedArticles,
        high_priority_risks: '> [ACTION REQUIRED: List high-priority risks identified in the Risk Assessment.]',
        residual_risk_assessment: '> [ACTION REQUIRED: Confirm that residual risks are acceptable.]',

        // --- Maintenance ---
        update_procedures: '> [ACTION REQUIRED: Describe the post-market monitoring and update process.]',

        // --- Dates & Legal ---
        created_at: new Date().toLocaleDateString(),
        declaration_date: '[Date of Signature]',
        declaration_place: '[Place of Signature]',
        signatory_name: user?.full_name || '[Signatory Name]',
        signatory_title: '[Title]',
    };
}

/**
 * Replace placeholders in template with actual values
 */
export function fillTemplate(template: string, placeholders: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, value);
    }

    return result;
}

/**
 * Extract missing fields from generated content
 */
export function extractMissingFields(content: string): string[] {
    const regex = /\{\{MISSING:\s*([^}]+)\}\}/g;
    const missing: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        if (!missing.includes(match[1])) {
            missing.push(match[1]);
        }
    }

    return missing;
}

/**
 * Calculate completion percentage
 */
export function calculateCompletion(content: string, totalPlaceholders: number): number {
    const missingCount = extractMissingFields(content).length;
    const filledCount = totalPlaceholders - missingCount;
    return Math.round((filledCount / totalPlaceholders) * 100);
}

/**
 * Generate a document from template and data
 */
export function generateDocument(
    documentType: DocumentType,
    data: ScanData
): {
    content: string;
    missingFields: string[];
    completionPercent: number;
    title: string;
} {
    const template = loadTemplate(documentType);
    const placeholders = buildPlaceholderMap(data);
    const content = fillTemplate(template, placeholders);
    const missingFields = extractMissingFields(content);

    // Count total unique placeholders in template
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const templatePlaceholders = new Set<string>();
    let match;
    while ((match = placeholderRegex.exec(template)) !== null) {
        templatePlaceholders.add(match[1]);
    }

    const completionPercent = calculateCompletion(content, templatePlaceholders.size);

    return {
        content,
        missingFields,
        completionPercent,
        title: DOCUMENT_TYPES[documentType].title,
    };
}
