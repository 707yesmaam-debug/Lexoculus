/**
 * check_dependency — MCP Tool
 *
 * Scans package names or manifest content for AI/ML libraries and returns
 * risk indicators, detected libraries, and high-risk flags.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
    scanDependencies,
    getScanSummary,
} from '../../../src/lib/analysis/dependency-scanner.js';
import { findLibraryByName } from '../../../src/lib/analysis/ai-library-database.js';

export function registerCheckDependencyTool(server: McpServer): void {
    server.registerTool(
        'check_dependency',
        {
            title: 'Check Dependency',
            description:
                'Check if packages/libraries trigger EU AI Act compliance obligations. ' +
                'Accepts package names or raw manifest content (package.json, requirements.txt, etc.).',
            inputSchema: z.object({
                packages: z
                    .array(z.string())
                    .optional()
                    .describe('List of package names to check (e.g. ["deepface", "openai"])'),
                manifest_content: z
                    .string()
                    .optional()
                    .describe('Raw manifest file content (requirements.txt, Pipfile, etc.)'),
                manifest_type: z
                    .enum([
                        'package.json',
                        'requirements.txt',
                        'pyproject.toml',
                        'setup.py',
                        'pipfile',
                        'environment.yml',
                        'go.mod',
                        'cargo.toml',
                    ])
                    .optional()
                    .describe('Type of manifest file (required when manifest_content is provided)'),
            }),
            annotations: {
                readOnlyHint: true,
            },
        },
        async (args) => {
            // Quick path: if just package names, do a fast lookup
            if (args.packages && args.packages.length > 0 && !args.manifest_content) {
                return handlePackageNames(args.packages);
            }

            // Build a minimal RepoScan-compatible object
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const repoScan: any = {
                requirements_txt_content: null,
                package_json_content: null,
                pyproject_toml_content: null,
                file_tree: null,
                readme_content: null,
            };

            if (args.manifest_content && args.manifest_type) {
                switch (args.manifest_type) {
                    case 'requirements.txt':
                        repoScan.requirements_txt_content = args.manifest_content;
                        break;
                    case 'package.json':
                        try {
                            repoScan.package_json_content = JSON.parse(args.manifest_content);
                        } catch {
                            return {
                                content: [{
                                    type: 'text' as const,
                                    text: JSON.stringify({ error: 'Invalid JSON in manifest_content' }),
                                }],
                                isError: true,
                            };
                        }
                        break;
                    case 'pyproject.toml':
                        repoScan.pyproject_toml_content = { raw: args.manifest_content };
                        break;
                    case 'setup.py':
                        repoScan.setup_py_content = args.manifest_content;
                        break;
                    case 'pipfile':
                        repoScan.pipfile_content = args.manifest_content;
                        break;
                    case 'environment.yml':
                        repoScan.environment_yml_content = args.manifest_content;
                        break;
                    case 'go.mod':
                        repoScan.go_mod_content = args.manifest_content;
                        break;
                    case 'cargo.toml':
                        repoScan.cargo_toml_content = args.manifest_content;
                        break;
                }
            }

            // If packages were also provided, inject them as requirements.txt lines
            if (args.packages && args.packages.length > 0) {
                const existing = repoScan.requirements_txt_content || '';
                repoScan.requirements_txt_content =
                    existing + '\n' + args.packages.join('\n');
            }

            const result = scanDependencies(repoScan);

            const output = {
                is_ai_system: result.is_ai_system,
                confidence_score: result.confidence_score,
                detected_libraries: result.detected_libraries.map((l) => ({
                    name: l.library.name,
                    category: l.library.category,
                    risk_indicators: l.library.risk_indicators,
                    high_risk: l.library.high_risk_flag || false,
                    ecosystem: l.library.ecosystem,
                    source: l.source,
                })),
                candidate_libraries: result.candidate_libraries.map((c) => ({
                    name: c.name,
                    matched_pattern: c.matched_pattern,
                    inferred_category: c.inferred_category,
                    confidence: c.pattern_confidence,
                })),
                risk_indicators: result.risk_indicators,
                high_risk_libraries: result.high_risk_libraries,
                detected_categories: result.detected_categories,
                frameworks: result.frameworks,
                summary: getScanSummary(result),
            };

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
            };
        },
    );
}

/**
 * Fast path for checking individual package names without constructing a full scan.
 */
function handlePackageNames(packages: string[]) {
    const results = packages.map((pkg) => {
        const lib = findLibraryByName(pkg);
        if (!lib) {
            return {
                package: pkg,
                found: false,
                is_ai_library: false,
            };
        }
        return {
            package: pkg,
            found: true,
            is_ai_library: true,
            name: lib.name,
            category: lib.category,
            risk_indicators: lib.risk_indicators,
            high_risk: lib.high_risk_flag || false,
            ecosystem: lib.ecosystem,
            use_cases: lib.use_cases,
            confidence: lib.confidence,
        };
    });

    const highRisk = results.filter((r) => r.found && 'high_risk' in r && r.high_risk);
    const aiLibs = results.filter((r) => r.is_ai_library);

    let warning: string | undefined;
    if (highRisk.length > 0) {
        const names = highRisk.map((r) => r.package).join(', ');
        warning =
            `${names} triggers HIGH_RISK classification under EU AI Act Annex III. ` +
            `This requires conformity assessment with potential Notified Body involvement.`;
    }

    const output = {
        is_ai_system: aiLibs.length > 0,
        packages: results,
        high_risk_libraries: highRisk.map((r) => r.package),
        ...(warning ? { warning } : {}),
    };

    return {
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
    };
}
