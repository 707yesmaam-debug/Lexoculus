import { sendPasswordResetEmail } from './src/lib/email';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log("Testing email with sender:", process.env.SMTP_FROM);
    const success = await sendPasswordResetEmail('varad.kh17@gmail.com', 'http://localhost:3000/auth/update-password');
    console.log("Success:", success);
}
test().catch(console.error);
