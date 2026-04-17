import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function applyRLS() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is missing');
        process.exit(1);
    }

    const pool = new Pool({ connectionString });
    const sqlPath = path.join(process.cwd(), 'prisma', 'rls_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying RLS policies to database...');
    
    try {
        await pool.query(sql);
        console.log('✅ RLS Policies applied successfully!');
    } catch (err) {
        console.error('❌ Failed to apply RLS policies:', err);
    } finally {
        await pool.end();
    }
}

applyRLS();
