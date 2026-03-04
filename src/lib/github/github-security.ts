import crypto from 'crypto';

/**
 * Derives a deterministic secret for a specific repository using the master webhook secret.
 * 
 * Algorithm: HMAC-SHA256(repoFullName, MASTER_SECRET) -> Hex String
 * 
 * This allows us to have unique secrets per repository without storing them in the database.
 * The webhook handler can re-derive the secret just by knowing the repository name
 * from the payload.
 */
export function deriveRepoSecret(repoFullName: string): string {
    const masterSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!masterSecret) {
        throw new Error('GITHUB_WEBHOOK_SECRET is not configured');
    }

    // Sanitize input just in case
    const cleanRepoName = repoFullName.trim(); // Case sensitive as per GitHub

    const hmac = crypto.createHmac('sha256', masterSecret);
    hmac.update(cleanRepoName);
    return 'gh_sec_' + hmac.digest('hex').substring(0, 32); // Prefix for readability
}
