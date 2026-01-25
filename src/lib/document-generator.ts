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

    return {
        // System identification
        system_name: aiSystem.name,
        system_id: aiSystem.id,
        version: '1.0',
        risk_classification: aiSystem.risk_classification || '{{MISSING: risk_classification}}',
        risk_score: aiSystem.risk_score?.toString() || '{{MISSING: risk_score}}',
        last_scanned_at: aiSystem.last_scanned_at
            ? new Date(aiSystem.last_scanned_at).toLocaleDateString()
            : '{{MISSING: last_scanned_at}}',
        system_description: aiSystem.description || '{{MISSING: system_description}}',

        // Provider info (from user or context)
        provider_name: contextAnswers?.provider_name || user?.full_name || '{{MISSING: provider_name}}',
        provider_address: contextAnswers?.provider_address || '{{MISSING: provider_address}}',
        contact_person: user?.full_name || '{{MISSING: contact_person}}',
        contact_email: user?.email || '{{MISSING: contact_email}}',

        // Capabilities and technical
        capabilities_list: capabilitiesList,
        libraries_list: librariesList,
        intended_purpose: llmAnalysis?.intended_purpose || contextAnswers?.intended_purpose || '{{MISSING: intended_purpose}}',

        // Risk assessment
        risk_narrative: riskAssessment?.risk_narrative || '{{MISSING: risk_narrative}}',
        matched_articles: matchedArticles,

        // Dates
        created_at: new Date().toLocaleDateString(),
        declaration_date: new Date().toLocaleDateString(),

        // Default placeholders that need user input
        training_data_description: contextAnswers?.training_data || '{{MISSING: training_data_description}}',
        input_data_specs: '{{MISSING: input_data_specs}}',
        output_data_specs: '{{MISSING: output_data_specs}}',
        hardware_requirements: '{{MISSING: hardware_requirements}}',
        software_dependencies: '{{MISSING: software_dependencies}}',
        known_limitations: contextAnswers?.limitations || '{{MISSING: known_limitations}}',
        human_oversight_measures: contextAnswers?.human_oversight || '{{MISSING: human_oversight_measures}}',
        security_measures: '{{MISSING: security_measures}}',
        logging_description: '{{MISSING: logging_description}}',

        // Risk management
        high_priority_risks: '{{MISSING: high_priority_risks}}',
        medium_priority_risks: '{{MISSING: medium_priority_risks}}',
        low_priority_risks: '{{MISSING: low_priority_risks}}',
        residual_risk_assessment: '{{MISSING: residual_risk_assessment}}',
        monitoring_approach: '{{MISSING: monitoring_approach}}',
        review_schedule: '{{MISSING: review_schedule}}',
        incident_response_plan: '{{MISSING: incident_response_plan}}',
        escalation_procedures: '{{MISSING: escalation_procedures}}',

        // Data governance
        training_data_sources: '{{MISSING: training_data_sources}}',
        data_collection_methods: '{{MISSING: data_collection_methods}}',
        data_quality_requirements: '{{MISSING: data_quality_requirements}}',
        preprocessing_steps: '{{MISSING: preprocessing_steps}}',
        data_labeling_procedures: '{{MISSING: data_labeling_procedures}}',
        bias_mitigation: '{{MISSING: bias_mitigation}}',
        validation_dataset_description: '{{MISSING: validation_dataset_description}}',
        validation_metrics: '{{MISSING: validation_metrics}}',
        gdpr_compliance_status: '{{MISSING: gdpr_compliance_status}}',
        data_subject_rights: '{{MISSING: data_subject_rights}}',
        data_retention_policy: '{{MISSING: data_retention_policy}}',
        data_access_controls: '{{MISSING: data_access_controls}}',
        encryption_standards: '{{MISSING: encryption_standards}}',
        data_breach_procedures: '{{MISSING: data_breach_procedures}}',

        // Instructions for use
        required_competencies: '{{MISSING: required_competencies}}',
        training_requirements: '{{MISSING: training_requirements}}',
        operating_environment: '{{MISSING: operating_environment}}',
        prohibited_uses: '{{MISSING: prohibited_uses}}',
        monitoring_requirements: '{{MISSING: monitoring_requirements}}',
        override_capabilities: '{{MISSING: override_capabilities}}',
        decision_review_process: '{{MISSING: decision_review_process}}',
        update_procedures: '{{MISSING: update_procedures}}',
        support_email: user?.email || '{{MISSING: support_email}}',
        documentation_url: '{{MISSING: documentation_url}}',

        // Declaration
        registration_number: '{{MISSING: registration_number}}',
        conformity_procedure: 'Internal Conformity Assessment (Annex VI)',
        notified_body: 'N/A',
        signatory_name: user?.full_name || '{{MISSING: signatory_name}}',
        signatory_title: '{{MISSING: signatory_title}}',
        declaration_place: '{{MISSING: declaration_place}}',
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
