const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth';

interface GitHubUser {
    login: string;
    id: number;
    avatar_url: string;
    name: string | null;
    email: string | null;
}

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    license: { spdx_id: string } | null;
    default_branch: string;
    updated_at: string;
}

interface GitHubTreeItem {
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

interface FileTreeNode {
    name: string;
    type: 'file' | 'dir';
    children?: FileTreeNode[];
}

export interface RepoScanData {
    repo_owner: string;
    repo_name: string;
    repo_description: string | null;
    readme_content: string | null;
    package_json_content: JsonValue | null;
    requirements_txt_content: string | null;
    pyproject_toml_content: JsonValue | null;
    file_tree: JsonObject;
    total_files: number;
    primary_language: string | null;
    license_type: string | null;
    stars_count: number;
    forks_count: number;
    watchers_count: number;
}

/**
 * Generate the GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(state: string): string {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
        scope: 'repo read:user',
        state,
    });

    return `${GITHUB_OAUTH_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch(`${GITHUB_OAUTH_URL}/access_token`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error_description || data.error);
    }

    return data.access_token;
}

/**
 * Get authenticated user's GitHub info
 */
export async function getUserInfo(token: string): Promise<GitHubUser> {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch GitHub user info');
    }

    return response.json();
}

/**
 * List user's accessible repositories
 */
export async function getUserRepos(token: string): Promise<GitHubRepo[]> {
    const allRepos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const response = await fetch(
            `${GITHUB_API_BASE}/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('GitHub token expired or invalid');
            }
            if (response.status === 403) {
                const remaining = response.headers.get('X-RateLimit-Remaining');
                if (remaining === '0') {
                    throw new Error('GitHub API rate limit exceeded');
                }
                throw new Error('Access denied to GitHub repositories');
            }
            throw new Error('Failed to fetch repositories');
        }

        const repos: GitHubRepo[] = await response.json();
        allRepos.push(...repos);

        // Check if there are more pages
        if (repos.length < perPage) {
            break;
        }

        page++;

        // Safety limit to prevent infinite loops
        if (page > 10) {
            break;
        }
    }

    return allRepos;
}

/**
 * Get repository details
 */
export async function getRepoDetails(
    token: string,
    owner: string,
    repo: string
): Promise<GitHubRepo> {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Repository not found');
        }
        throw new Error('Failed to fetch repository details');
    }

    return response.json();
}

/**
 * Get file content from repository
 */
export async function getRepoContent(
    token: string,
    owner: string,
    repo: string,
    path: string
): Promise<string | null> {
    try {
        const response = await fetch(
            `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            }
        );

        if (!response.ok) {
            return null; // File doesn't exist
        }

        const data = await response.json();

        if (data.encoding === 'base64' && data.content) {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Get repository file tree
 */
export async function getRepoTree(
    token: string,
    owner: string,
    repo: string,
    branch: string
): Promise<{ tree: FileTreeNode; totalFiles: number }> {
    const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch repository tree');
    }

    const data = await response.json();
    const items: GitHubTreeItem[] = data.tree || [];

    // Build tree structure
    const root: FileTreeNode = { name: repo, type: 'dir', children: [] };
    let totalFiles = 0;

    for (const item of items) {
        if (item.type === 'blob') {
            totalFiles++;
        }

        const parts = item.path.split('/');
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            const nodeType = isLast ? (item.type === 'blob' ? 'file' : 'dir') : 'dir';

            if (!current.children) {
                current.children = [];
            }

            let child = current.children.find((c) => c.name === part);

            if (!child) {
                child = { name: part, type: nodeType };
                if (nodeType === 'dir') {
                    child.children = [];
                }
                current.children.push(child);
            }

            if (!isLast) {
                current = child;
            }
        }
    }

    return { tree: root, totalFiles };
}

/**
 * Scan a complete repository and return structured data for Feature 2
 */
export async function scanRepository(
    token: string,
    owner: string,
    repo: string
): Promise<RepoScanData> {
    // Get repo details
    const repoDetails = await getRepoDetails(token, owner, repo);

    // Fetch all content in parallel
    const [readme, packageJson, requirementsTxt, pyprojectToml, treeData] = await Promise.all([
        getRepoContent(token, owner, repo, 'README.md'),
        getRepoContent(token, owner, repo, 'package.json'),
        getRepoContent(token, owner, repo, 'requirements.txt'),
        getRepoContent(token, owner, repo, 'pyproject.toml'),
        getRepoTree(token, owner, repo, repoDetails.default_branch),
    ]);

    // Parse JSON content if available
    let packageJsonContent: JsonValue | null = null;
    if (packageJson) {
        try {
            packageJsonContent = JSON.parse(packageJson);
        } catch {
            // Invalid JSON, keep as null
        }
    }

    let pyprojectTomlContent: JsonValue | null = null;
    if (pyprojectToml) {
        // Basic TOML to JSON conversion for common cases
        // In production, use a proper TOML parser
        try {
            // Simple extraction of dependencies section
            pyprojectTomlContent = { raw: pyprojectToml };
        } catch {
            // Keep as null
        }
    }

    return {
        repo_owner: owner,
        repo_name: repo,
        repo_description: repoDetails.description,
        readme_content: readme,
        package_json_content: packageJsonContent,
        requirements_txt_content: requirementsTxt,
        pyproject_toml_content: pyprojectTomlContent,
        file_tree: treeData.tree as unknown as JsonObject,
        total_files: treeData.totalFiles,
        primary_language: repoDetails.language,
        license_type: repoDetails.license?.spdx_id || null,
        stars_count: repoDetails.stargazers_count,
        forks_count: repoDetails.forks_count,
        watchers_count: repoDetails.watchers_count,
    };
}

/**
 * Check if token has expired
 * GitHub classic tokens don't expire, but this is ready for GitHub Apps
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) {
        return false; // No expiration set
    }
    return new Date() >= expiresAt;
}
