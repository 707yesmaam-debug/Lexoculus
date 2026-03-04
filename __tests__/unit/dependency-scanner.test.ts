/**
 * Unit Tests for Dependency Scanner
 * 
 * Tests the deterministic AI/ML library detection without LLM.
 */

import {
    scanDependencies,
    getScanSummary,
} from '../../src/lib/analysis/dependency-scanner';

import {
    findLibraryByName,
    getHighRiskLibraries,
    getLibrariesByCategory,
    isModelFile,
    LIBRARY_STATS,
} from '../../src/lib/analysis/ai-library-database';

// Mock RepoScan data for testing
const createMockRepoScan = (overrides: Record<string, unknown> = {}) => ({
    id: 'test-id',
    user_id: 'user-id',
    github_repo_url: 'https://github.com/test/repo',
    repo_owner: 'test',
    repo_name: 'repo',
    repo_description: null,
    readme_content: null,
    package_json_content: null,
    requirements_txt_content: null,
    pyproject_toml_content: null,
    file_tree: null,
    total_files: 0,
    primary_language: null,
    license_type: null,
    stars_count: 0,
    forks_count: 0,
    watchers_count: 0,
    scanned_at: new Date(),
    expires_at: new Date(),
    scan_token: null,
    ...overrides,
});

describe('AI Library Database', () => {
    test('should have substantial library coverage', () => {
        expect(LIBRARY_STATS.total).toBeGreaterThan(90);
        expect(LIBRARY_STATS.python).toBeGreaterThan(50);
        expect(LIBRARY_STATS.javascript).toBeGreaterThan(10);
    });

    test('should find torch by exact name', () => {
        const lib = findLibraryByName('torch');
        expect(lib).toBeDefined();
        expect(lib?.category).toBe('deep_learning');
        expect(lib?.ecosystem).toBe('python');
    });

    test('should find torch by alias pytorch', () => {
        const lib = findLibraryByName('pytorch');
        expect(lib).toBeDefined();
        expect(lib?.name).toBe('torch');
    });

    test('should categorize opencv as computer_vision', () => {
        const lib = findLibraryByName('opencv-python');
        expect(lib).toBeDefined();
        expect(lib?.category).toBe('computer_vision');
        expect(lib?.risk_indicators).toContain('uses_computer_vision');
    });

    test('should flag face_recognition as high-risk', () => {
        const lib = findLibraryByName('face_recognition');
        expect(lib).toBeDefined();
        expect(lib?.high_risk_flag).toBe(true);
        expect(lib?.risk_indicators).toContain('uses_biometric_processing');
    });

    test('should return all high-risk libraries', () => {
        const highRisk = getHighRiskLibraries();
        expect(highRisk.length).toBeGreaterThan(3);
        expect(highRisk.every(l => l.high_risk_flag)).toBe(true);
    });

    test('should get libraries by category', () => {
        const nlpLibs = getLibrariesByCategory('nlp');
        expect(nlpLibs.length).toBeGreaterThan(5);
        expect(nlpLibs.some(l => l.name === 'transformers')).toBe(true);
    });
});

describe('Model File Detection', () => {
    test('should detect .pt files as model files', () => {
        expect(isModelFile('model.pt')).toBe(true);
        expect(isModelFile('weights/model.pt')).toBe(true);
    });

    test('should detect .safetensors files', () => {
        expect(isModelFile('model.safetensors')).toBe(true);
    });

    test('should detect .gguf files', () => {
        expect(isModelFile('llama-7b.gguf')).toBe(true);
    });

    test('should not detect regular files', () => {
        expect(isModelFile('main.py')).toBe(false);
        expect(isModelFile('package.json')).toBe(false);
        expect(isModelFile('README.md')).toBe(false);
    });
});

describe('Dependency Scanner', () => {
    test('should detect PyTorch from requirements.txt', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'torch==2.0.0\nnumpy>=1.21',
        });

        const result = scanDependencies(scan);

        expect(result.is_ai_system).toBe(true);
        expect(result.detected_libraries.some(l => l.library.name === 'torch')).toBe(true);
        expect(result.frameworks).toContain('PyTorch');
    });

    test('should detect TensorFlow from package.json', () => {
        const scan = createMockRepoScan({
            package_json_content: {
                dependencies: {
                    '@tensorflow/tfjs': '^4.0.0',
                    'express': '^4.18.0'
                }
            }
        });

        const result = scanDependencies(scan);

        expect(result.is_ai_system).toBe(true);
        expect(result.detected_libraries.some(l => l.library.name === '@tensorflow/tfjs')).toBe(true);
    });

    test('should detect face_recognition as high-risk', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'face_recognition==1.3.0\nopencv-python',
        });

        const result = scanDependencies(scan);

        expect(result.high_risk_libraries).toContain('face_recognition');
        expect(result.risk_indicators.uses_biometric_processing).toBe(true);
        expect(result.risk_indicators.uses_computer_vision).toBe(true);
    });

    test('should return empty result for non-AI repo', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'flask\nrequests\nbeautifulsoup4',
            package_json_content: {
                dependencies: {
                    'express': '^4.18.0',
                    'lodash': '^4.17.0'
                }
            }
        });

        const result = scanDependencies(scan);

        expect(result.is_ai_system).toBe(false);
        expect(result.detected_libraries.length).toBe(0);
        expect(result.confidence_score).toBe(0);
    });

    test('should handle multiple dependency sources', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'torch\ntransformers',
            package_json_content: {
                dependencies: {
                    'openai': '^4.0.0',
                }
            }
        });

        const result = scanDependencies(scan);

        expect(result.is_ai_system).toBe(true);
        expect(result.detected_libraries.length).toBe(3);
        expect(result.detected_categories).toContain('deep_learning');
        expect(result.detected_categories).toContain('generative_ai');
    });

    test('should compute risk indicators correctly', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'openai\nlangchain\nchromadb',
        });

        const result = scanDependencies(scan);

        expect(result.risk_indicators.uses_generative_ai).toBe(true);
        expect(result.risk_indicators.uses_nlp).toBe(true);
    });

    test('should deduplicate libraries from multiple sources', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'torch\ntorchvision',
            package_json_content: null, // No duplicate from package.json
        });

        const result = scanDependencies(scan);

        // Each library should appear only once
        const torchCount = result.detected_libraries.filter(l => l.library.name === 'torch').length;
        expect(torchCount).toBe(1);
    });

    test('should track scan duration', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'torch\ntensorflow\nkeras',
        });

        const result = scanDependencies(scan);

        expect(result.scan_duration_ms).toBeGreaterThanOrEqual(0);
        expect(result.scan_duration_ms).toBeLessThan(1000); // Should be fast
    });
});

describe('Scan Summary', () => {
    test('should generate human-readable summary for AI repo', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'torch\ntransformers\nopencv-python',
        });

        const result = scanDependencies(scan);
        const summary = getScanSummary(result);

        expect(summary).toContain('AI/ML libraries');
        expect(summary).toContain('torch');
    });

    test('should indicate no AI for non-AI repo', () => {
        const scan = createMockRepoScan({
            requirements_txt_content: 'flask\nrequests',
        });

        const result = scanDependencies(scan);
        const summary = getScanSummary(result);

        expect(summary).toContain('No AI/ML libraries detected');
    });
});

describe('Layer 2: Pattern Matching', () => {
    test('should detect LLM-related packages by pattern', () => {
        const scan = createMockRepoScan({
            package_json_content: {
                dependencies: {
                    'custom-llm-client': '^1.0.0',
                    'my-gpt-wrapper': '^2.0.0',
                    'express': '^4.18.0'
                }
            }
        });

        const result = scanDependencies(scan);

        // These are not in our database but should be detected by pattern
        expect(result.candidate_libraries.some(c => c.name === 'custom-llm-client')).toBe(true);
        expect(result.candidate_libraries.some(c => c.name === 'my-gpt-wrapper')).toBe(true);
    });

    test('should detect agent frameworks by pattern', () => {
        const scan = createMockRepoScan({
            package_json_content: {
                dependencies: {
                    '@mariozechner/pi-ai': '^0.52.7',
                    '@mariozechner/pi-agent-core': '^0.52.7',
                    'express': '^4.18.0'
                }
            }
        });

        const result = scanDependencies(scan);

        expect(result.is_ai_system).toBe(true);
        expect(result.candidate_libraries.some(c => c.name.includes('pi-ai'))).toBe(true);
        expect(result.candidate_libraries.some(c => c.name.includes('agent'))).toBe(true);
    });

    test('should detect AWS AI services by pattern', () => {
        const scan = createMockRepoScan({
            package_json_content: {
                dependencies: {
                    '@aws-sdk/client-bedrock': '^3.0.0',
                    '@aws-sdk/client-s3': '^3.0.0'
                }
            }
        });

        const result = scanDependencies(scan);

        // Bedrock is AI, S3 is not
        expect(result.candidate_libraries.some(c => c.name === '@aws-sdk/client-bedrock')).toBe(true);
        expect(result.candidate_libraries.some(c => c.name === '@aws-sdk/client-s3')).toBe(false);
    });

    test('should detect HuggingFace namespace packages', () => {
        const scan = createMockRepoScan({
            package_json_content: {
                dependencies: {
                    '@huggingface/inference': '^2.0.0',
                }
            }
        });

        const result = scanDependencies(scan);

        expect(result.candidate_libraries.some(c => c.name === '@huggingface/inference')).toBe(true);
    });

    test('should not duplicate Layer 1 libraries in Layer 2', () => {
        const scan = createMockRepoScan({
            package_json_content: {
                dependencies: {
                    'ollama': '^1.0.0', // Known in database (Layer 1)
                    'my-llm-helper': '^1.0.0', // Pattern matched (Layer 2) - ends with -llm
                }
            }
        });

        const result = scanDependencies(scan);

        // ollama should be in detected_libraries (Layer 1), not candidate_libraries
        expect(result.detected_libraries.some(l => l.library.name === 'ollama')).toBe(true);
        expect(result.candidate_libraries.some(c => c.name === 'ollama')).toBe(false);

        // my-llm-helper should be in candidate_libraries (Layer 2) - has 'llm' in name
        expect(result.candidate_libraries.some(c => c.name === 'my-llm-helper')).toBe(true);
    });

    test('should track all packages for Layer 3 LLM review', () => {
        const scan = createMockRepoScan({
            package_json_content: {
                dependencies: {
                    'express': '^4.18.0',
                    'lodash': '^4.17.0',
                    'random-package': '^1.0.0'
                }
            }
        });

        const result = scanDependencies(scan);

        // All packages should be in all_packages for LLM to review
        expect(result.all_packages).toContain('express');
        expect(result.all_packages).toContain('lodash');
        expect(result.all_packages).toContain('random-package');
    });
});

describe('Layer 3.5: Context Signals (API Wrapper Detection)', () => {
    test('should detect AI keywords in README', () => {
        const scan = createMockRepoScan({
            readme_content: 'This app uses OpenAI GPT-4 for text generation and LLM-based analysis.',
        });

        const result = scanDependencies(scan);

        expect(result.context_signals.readme_ai_keywords.length).toBeGreaterThan(0);
        expect(result.context_signals.readme_ai_keywords).toContain('openai');
        expect(result.context_signals.likely_api_usage).toBe(true);
    });

    test('should detect AI file names in file tree', () => {
        const scan = createMockRepoScan({
            file_tree: {
                name: 'src',
                type: 'directory',
                children: [
                    { name: 'groq.ts', type: 'file' },
                    { name: 'ai.ts', type: 'file' },
                    { name: 'utils.ts', type: 'file' },
                ]
            }
        });

        const result = scanDependencies(scan);

        expect(result.context_signals.ai_file_names.length).toBe(2);
        expect(result.context_signals.ai_file_names.some(f => f.includes('groq.ts'))).toBe(true);
        expect(result.context_signals.ai_file_names.some(f => f.includes('ai.ts'))).toBe(true);
    });

    test('should mark as AI system when context signals are strong', () => {
        const scan = createMockRepoScan({
            readme_content: 'AI-powered compliance tool using Groq LLM for analysis.',
            file_tree: {
                name: 'src',
                type: 'directory',
                children: [
                    { name: 'groq.ts', type: 'file' },
                    { name: 'llm.ts', type: 'file' },
                ]
            }
        });

        const result = scanDependencies(scan);

        expect(result.is_ai_system).toBe(true);
        expect(result.context_signals.context_confidence).toBeGreaterThan(0.5);
    });

    test('should not flag non-AI repos by context', () => {
        const scan = createMockRepoScan({
            readme_content: 'A simple web server for serving static files.',
            file_tree: {
                name: 'src',
                type: 'directory',
                children: [
                    { name: 'server.ts', type: 'file' },
                    { name: 'index.ts', type: 'file' },
                ]
            }
        });

        const result = scanDependencies(scan);

        expect(result.context_signals.context_confidence).toBeLessThan(0.5);
    });
});
