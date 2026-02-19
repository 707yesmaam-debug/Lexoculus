
import { config } from 'dotenv';
import path from 'path';

config();
config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 15) || 'Missing');
