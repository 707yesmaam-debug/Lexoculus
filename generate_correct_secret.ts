
import { config } from 'dotenv';
import path from 'path';
import { deriveRepoSecret } from '@/lib/github-security';

// Load env
config({ path: path.resolve(process.cwd(), '.env.local') });

// Assume this repo
const REPO = 'CURSED-ME/wordcraft';

if (!process.env.GITHUB_WEBHOOK_SECRET) {
    console.error('GITHUB_WEBHOOK_SECRET missing in .env.local');
    process.exit(1);
}

const secret = deriveRepoSecret(REPO);
console.log(`SECRET:${secret}`);
