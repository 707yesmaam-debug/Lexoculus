import { 
    generateDocument, 
    DOCUMENT_TYPES, 
    DocumentType,
    ScanData
} from '@/lib/output/document-generator';

describe('Document Generator', () => {
    const mockData: ScanData = {
        aiSystem: {
            id: 'test-system-id',
            name: 'Test AI System',
            description: 'A test system for unit testing.',
            risk_classification: 'HIGH_RISK',
            risk_score: 85,
            last_scanned_at: new Date('2026-03-23T10:00:00Z'),
        },
        llmAnalysis: {
            capabilities: ['NLP', 'Sense Making'],
            libraries: ['transformers', 'scikit-learn'],
            intended_purpose: 'Automated legal compliance checking.',
        },
        riskAssessment: {
            risk_narrative: 'High risk detected due to biometric data processing.',
            matched_annex_iii_articles: [
                { article_id: 'Article 6', title: 'High-risk AI systems' }
            ],
        },
        user: {
            email: 'test@example.com',
            full_name: 'Test User',
        }
    };

    it('should load and generate technical documentation', () => {
        const result = generateDocument('technical_doc', mockData);
        
        expect(result.title).toBe(DOCUMENT_TYPES.technical_doc.title);
        expect(result.content).toContain('Test AI System');
        expect(result.content).toContain('Annex IV');
        expect(result.missingFields.length).toBeGreaterThanOrEqual(0);
        expect(result.completionPercent).toBeGreaterThan(0);
    });

    it('should load and generate risk management plan', () => {
        const result = generateDocument('risk_management', mockData);
        
        expect(result.title).toBe(DOCUMENT_TYPES.risk_management.title);
        expect(result.content).toContain('Test AI System');
        expect(result.content).toContain('Article 9');
    });

    it('should load and generate data governance document', () => {
        const result = generateDocument('data_governance', mockData);
        
        expect(result.title).toBe(DOCUMENT_TYPES.data_governance.title);
        expect(result.content).toContain('Article 10');
    });

    it('should load and generate instructions for use', () => {
        const result = generateDocument('instructions_for_use', mockData);
        
        expect(result.title).toBe(DOCUMENT_TYPES.instructions_for_use.title);
        expect(result.content).toContain('Article 13');
    });

    it('should load and generate declaration of conformity', () => {
        const result = generateDocument('declaration_of_conformity', mockData);
        
        expect(result.title).toBe(DOCUMENT_TYPES.declaration_of_conformity.title);
        expect(result.content).toContain('EU Declaration of Conformity');
    });

    it('should correctly replace placeholders', () => {
        const result = generateDocument('technical_doc', mockData);
        
        // Check if certain placeholders are replaced
        expect(result.content).not.toContain('{{system_name}}');
        expect(result.content).toContain('Test AI System');
        
        expect(result.content).not.toContain('{{provider_name}}');
        expect(result.content).toContain('Test User');
    });
});
