
import { config } from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { deriveRepoSecret } from './src/lib/github-security';

config({ path: path.resolve(process.cwd(), '.env.local') });

const REPO_NAME = 'CURSED-ME/wordcraft';
const SECRET = process.env.GITHUB_WEBHOOK_SECRET;

if (!SECRET) {
    console.error('GITHUB_WEBHOOK_SECRET missing');
    process.exit(1);
}

// 1. Derive Secret
const derivedSecret = deriveRepoSecret(REPO_NAME);
console.log(`Derived Secret: ${derivedSecret}`);

// 2. Generate Payload
const payload = JSON.stringify({
    action: 'synchronize', // Or 'opened'
    number: 1,
    pull_request: {
        id: 1,
        number: 1,
        title: 'Test PR',
        html_url: 'https://github.com/CURSED-ME/wordcraft/pull/1',
        head: { sha: 'test_sha', ref: 'test_branch' },
        base: { sha: 'base_sha', ref: 'main' },
        user: { login: 'test_user' },
        diff_url: 'https://api.github.com/repos/CURSED-ME/wordcraft/pulls/1', // Will fail fetch but that's ok, code should start
    },
    repository: {
        id: 123,
        name: 'wordcraft',
        full_name: REPO_NAME,
        owner: { login: 'CURSED-ME' }
    }
});

// 3. calculate HMAC
const hmac = crypto.createHmac('sha256', derivedSecret);
const signature = 'sha256=' + hmac.update(payload).digest('hex');


// 4. Send Request
console.log('Sending request to localhost:3000...');
fetch('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature,
        'x-github-event': 'pull_request'
    },
    body: payload
})
    .then(async res => {
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text}`);
    })
    .catch(err => console.error(err));

