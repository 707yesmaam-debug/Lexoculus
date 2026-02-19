
import { config } from 'dotenv';
import path from 'path';
import crypto from 'crypto';

config({ path: path.resolve(process.cwd(), '.env.local') });

const secret = process.env.GITHUB_WEBHOOK_SECRET;
if (!secret) {
    console.log('MISSING');
} else {
    const hash = crypto.createHash('sha256').update(secret).digest('hex').substring(0, 8);
    console.log(`LOCAL_HASH:${hash}`);
}
