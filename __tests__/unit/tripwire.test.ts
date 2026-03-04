import { scanDiffs, getHighestRisk, TRIPWIRE_FILES, IGNORED_EXTENSIONS } from '../../src/lib/security/tripwire';

describe('Tripwire Scanner', () => {

    describe('File Extension Filtering', () => {
        it('should skip image and documentation files', () => {
            const changes = [
                { filename: 'src/assets/logo.png', diff: 'face_recognition' },
                { filename: 'README.md', diff: 'social_score' },
                { filename: 'docs/architecture.txt', diff: 'emotion_recognition' }
            ];

            const result = scanDiffs(changes);

            // It did run, but didn't analyze these files
            expect(result.files_analyzed.length).toBe(0);
            expect(result.risk_found).toBe(false);
        });

        it('should properly identify core files to scan', () => {
            const changes = [
                { filename: 'src/app/api/route.ts', diff: 'console.log("hello")' },
                { filename: 'package.json', diff: '"face_recognition": "1.0.0"' }
            ];

            const result = scanDiffs(changes);

            expect(result.files_analyzed.length).toBe(2);
            expect(result.triggered).toBe(true);
        });
    });

    describe('Risk Detection Engine', () => {
        it('should detect UNACCEPTABLE risks (Article 5)', () => {
            const changes = [
                { filename: 'src/lib/scoring.py', diff: 'def calculate_social_score(user_data):' }
            ];

            const result = scanDiffs(changes);

            expect(result.risk_found).toBe(true);
            expect(result.highest_risk).toBe('UNACCEPTABLE');
            expect(result.detections.length).toBeGreaterThan(0);
            expect(result.detections[0].heuristic_match).toBe('social_score');
        });

        it('should detect HIGH_RISK constraints (Annex III)', () => {
            const changes = [
                { filename: 'src/camera.js', diff: 'import face_recognition from "face_recognition";' }
            ];

            const result = scanDiffs(changes);

            expect(result.risk_found).toBe(true);
            expect(result.highest_risk).toBe('HIGH_RISK');
            expect(result.detections.length).toBeGreaterThan(0);
        });

        it('should capture snippet context around the match', () => {
            const diffContent = 'function main() {\n  const result = emotion_recognition();\n  return result;\n}';
            const changes = [
                { filename: 'src/index.ts', diff: diffContent }
            ];

            const result = scanDiffs(changes);

            expect(result.risk_found).toBe(true);
            const detection = result.detections[0];
            expect(detection.snippet).toContain('emotion_recognition');
        });
    });

    describe('Risk Aggregation', () => {
        it('should rank UNACCEPTABLE higher than LIMITED_RISK and HIGH_RISK', () => {
            const risks = getHighestRisk(['LIMITED_RISK', 'UNACCEPTABLE', 'HIGH_RISK']);
            expect(risks).toBe('UNACCEPTABLE');
        });

        it('should scan single diff with multiple varied risk signals correctly', () => {
            const changes = [
                { filename: 'package.json', diff: '"face_recognition": "1.0", "social_score": "2.0"' }
            ];

            const result = scanDiffs(changes);

            expect(result.risk_found).toBe(true);
            // Expect it found both UNACCEPTABLE and HIGH_RISK
            expect(result.detections.length).toBeGreaterThan(1);
            expect(result.highest_risk).toBe('UNACCEPTABLE');
        });
    });

});
