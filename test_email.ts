import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sendDemoRequestNotification, sendEnterpriseInquiryNotification } from './src/lib/email';

async function test() {
    console.log("Testing demo request sender...");
    const successDemo = await sendDemoRequestNotification({
        full_name: 'Test Setup',
        work_email: 'test@lexoculus.com',
        company_name: 'LexOculus',
        company_size: '1-10',
        use_case: 'testing'
    });
    console.log("Demo Email Sent?", successDemo);

    console.log("Testing enterprise inquiry sender...");
    const successEnterprise = await sendEnterpriseInquiryNotification({
        full_name: 'Test Enterprise Setup',
        work_email: 'test@lexoculus.com',
        company_name: 'LexOculus',
        company_size: '1-10',
        use_case: 'testing'
    });
    console.log("Enterprise Email Sent?", successEnterprise);
}

test();
