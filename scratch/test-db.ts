
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
  console.log('Testing DB connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');
  
  const prisma = new PrismaClient();
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Connection successful in', Date.now() - start, 'ms');
    console.log('Result:', result);
    
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
