/**
 * Purpose-Category Mapping for EU AI Act Risk Classification
 * 
 * Shared module used by both risk-classifier.ts and constraint-engine.ts.
 * Maps user-declared intended purposes to eligible Annex III high-risk categories.
 * 
 * - Empty array → NO high-risk categories can match (e.g. developer tools)
 * - null → ALL categories eligible (no filtering)
 * - LIMITED_RISK (Article 50) and UNACCEPTABLE (Article 5) are NEVER filtered
 */

export const PURPOSE_CATEGORY_MAP: Record<string, string[] | null> = {
    'developer_tool': [],
    'api_middleware': [],
    'chatbot': [],
    'data_analytics': [],
    'content_generation': [],
    'critical_infrastructure': ['Critical Infrastructure'],
    'financial_services': ['Essential Services Access'],
    'healthcare': ['Critical Infrastructure'],
    'hr_recruitment': ['Employment & Worker Management'],
    'law_enforcement': ['Law Enforcement'],
    'education': ['Education & Vocational Training'],
    'biometrics': ['Remote Biometric Identification', 'Biometric Categorization', 'Emotion Recognition'],
    'migration_border': ['Migration, Asylum & Border Control'],
    'justice_legal': ['Administration of Justice'],
    'autonomous_vehicles': ['Autonomous Vehicles'],
    'general': null,
};

/** UI-friendly labels for purpose options */
export const PURPOSE_OPTIONS = [
    { value: '', label: 'General Purpose / Other (Default)' },
    { value: 'developer_tool', label: 'Developer Tool / API Middleware' },
    { value: 'chatbot', label: 'Chatbot / Virtual Assistant' },
    { value: 'data_analytics', label: 'Data Analytics / Visualization' },
    { value: 'content_generation', label: 'Content / Code Generation' },
    { value: 'financial_services', label: 'Financial Services (Credit/Loans/Insurance)' },
    { value: 'healthcare', label: 'Healthcare / Medical' },
    { value: 'hr_recruitment', label: 'HR / Recruitment / Employment' },
    { value: 'education', label: 'Education / Student Assessment' },
    { value: 'law_enforcement', label: 'Law Enforcement / Justice' },
    { value: 'biometrics', label: 'Biometrics / Emotion Recognition' },
    { value: 'migration_border', label: 'Migration / Border Control' },
    { value: 'autonomous_vehicles', label: 'Autonomous Vehicles / Safety Components' },
] as const;

/** Check if a high-risk category should be skipped based on intended purpose */
export function shouldSkipHighRiskCategory(category: string, intendedPurpose?: string): boolean {
    if (!intendedPurpose) return false;
    const eligible = PURPOSE_CATEGORY_MAP[intendedPurpose];
    if (eligible === undefined || eligible === null) return false;
    return !eligible.includes(category);
}
