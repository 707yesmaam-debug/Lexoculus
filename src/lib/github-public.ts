/**
 * Public GitHub Repository Scanner
 * 
 * Allows scanning public repositories without an OAuth token.
 * Uses GitHub's unauthenticated public API (Subject to 60 req/hour rate limit per IP).
 */

import { RepoScanData, FileTreeNode, JsonValue, JsonObject } from './github';

const GITHUB_API_BASE = 'https://api.github.com';

// =============================================================================
// TYPES
// =============================================================================

interface PublicRepoDetails {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    default_branch: string;
    license: { spdx_id: string } | null;
    visibility: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate if a repository is public and accessible
 */
export async function validatePublicRepo(owner: string, repo: string): Promise<boolean> {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
            headers: { 'User-Agent': 'ComplianceAI-Scanner' }
        });

        if (response.status === 404) return false;
        if (!response.ok) return false;

        const data = await response.json();
        return data.visibility === 'public';
    } catch (error) {
        console.error('Error validating public repo:', error);
        return false;
    }
}

/**
 * Parse GitHub URL or "owner/repo" string
 */
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
    try {
        // Handle full URL
        if (input.startsWith('https://github.com/')) {
            const path = input.replace('https://github.com/', '').split('/');
            if (path.length >= 2) {
                return { owner: path[0], repo: path[1].replace('.git', '') };
            }
        }

        // Handle "owner/repo" format
        const parts = input.split('/');
        if (parts.length === 2) {
            return { owner: parts[0].trim(), repo: parts[1].trim() };
        }
    } catch (e) {
        return null; // Invalid format
    }
    return null;
}

// =============================================================================
// CORE SCANNING LOGIC
// =============================================================================

async function fetchPublicFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
        // Use raw.githubusercontent.com for file content to save API rate limits
        // This is a common strategy for unauthenticated scraping
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`;
        const response = await fetch(url);

        if (!response.ok) return null;
        return await response.text();
    } catch (error) {
        return null;
    }
}

async function fetchPublicRepoTree(owner: string, repo: string, defaultBranch: string): Promise<{ tree: FileTreeNode, totalFiles: number }> {
    try {
        // We still need API for the tree, which is the main bottleneck
        // Limit recursive depth or use non-recursive if repo is huge?
        // For free tier, we'll try recursive=1. If it fails (too large), user gets partial tree.
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'ComplianceAI-Scanner' }
        });

        if (!response.ok) {
            console.warn(`Failed to fetch tree: ${response.status}`);
            return { tree: { name: 'root', type: 'dir', children: [] }, totalFiles: 0 };
        }

        const data = await response.json();
        if (data.truncated) {
            console.warn('Repo tree truncated by GitHub (too large)');
        }

        const items = data.tree as { path: string; type: 'blob' | 'tree'; size?: number }[];

        // Build tree structure
        const root: FileTreeNode = { name: 'root', type: 'dir', children: [] };

        for (const item of items) {
            // FILTER: Skip junk directories to save size and noise
            if (item.path.includes('node_modules') ||
                item.path.includes('.git/') ||
                item.path.includes('__pycache__') ||
                item.path.includes('.next') ||
                item.path.includes('dist') ||
                item.path.includes('build')) {
                continue;
            }

            const parts = item.path.split('/');
            let current = root;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!current.children) current.children = [];

                // Last part is the file/dir itself
                if (i === parts.length - 1) {
                    current.children.push({
                        name: part,
                        type: item.type === 'blob' ? 'file' : 'dir',
                        children: item.type === 'tree' ? [] : undefined
                    });
                } else {
                    // Navigate down
                    let next = current.children.find(c => c.name === part);
                    if (!next) {
                        next = { name: part, type: 'dir', children: [] };
                        current.children.push(next);
                    }
                    current = next;
                }
            }
        }

        return { tree: root, totalFiles: items.length };

    } catch (error) {
        console.error('Tree fetch error:', error);
        return { tree: { name: 'root', type: 'dir', children: [] }, totalFiles: 0 };
    }
}

/**
 * Scan a public repository
 */
export async function scanPublicRepository(owner: string, repo: string): Promise<RepoScanData> {
    // 1. Get Repo Details
    const detailsRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers: { 'User-Agent': 'ComplianceAI-Scanner' }
    });

    if (!detailsRes.ok) {
        throw new Error('Repository not found or API rate limit exceeded');
    }

    const details: PublicRepoDetails = await detailsRes.json();

    // 2. Fetch Critical Files (Parallel)
    const [readme, pkgJson, reqTxt, pyproject, treeData] = await Promise.all([
        fetchPublicFileContent(owner, repo, 'README.md'),
        fetchPublicFileContent(owner, repo, 'package.json'),
        fetchPublicFileContent(owner, repo, 'requirements.txt'),
        fetchPublicFileContent(owner, repo, 'pyproject.toml'),
        fetchPublicRepoTree(owner, repo, details.default_branch)
    ]);

    // 3. Parse JSON files safely
    let parsedPkgJson: JsonValue | null = null;
    let parsedPyProject: JsonValue | null = null;

    try { if (pkgJson) parsedPkgJson = JSON.parse(pkgJson); } catch { }
    try { if (pyproject) parsedPyProject = JSON.parse(pyproject); } catch { }

    // 4. Construct Return Object
    return {
        repo_owner: owner,
        repo_name: repo,
        repo_description: details.description,
        readme_content: readme,
        package_json_content: parsedPkgJson,
        requirements_txt_content: reqTxt,
        pyproject_toml_content: parsedPyProject,
        file_tree: treeData.tree as unknown as JsonObject, // Cast for compatibility
        total_files: treeData.totalFiles,
        primary_language: details.language,
        license_type: details.license?.spdx_id || null,
        stars_count: details.stargazers_count,
        forks_count: details.forks_count,
        watchers_count: details.watchers_count
    };
}
