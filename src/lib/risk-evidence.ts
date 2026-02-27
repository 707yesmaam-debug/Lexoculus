export interface RiskEvidence {
    type: 'dependency' | 'file' | 'technology' | 'api_integration';
    name: string;           // e.g., "face_recognition", "openai", "model.pt"
    source_file: string;    // e.g., "requirements.txt", "package.json"  
    version?: string;       // e.g., "1.3.0"
    risk_indicators: string[];  // e.g., ["uses_biometric_processing"]
    triggered_articles: string[];  // e.g., ["Annex III(1)(a)"]
    severity: 'critical' | 'high' | 'medium' | 'info';
}
