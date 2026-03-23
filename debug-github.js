const { PrismaClient } = require('@prisma/client');
const { decrypt } = require('./src/lib/security/encryption');
const prisma = new PrismaClient();

async function debug() {
    const clientId = 'cmn2zb9lh000004jmp13iv8b2';
    const client = await prisma.firmClient.findUnique({
        where: { id: clientId },
        include: { access: true }
    });

    if (!client || !client.access) {
        console.error('Client or Access record not found');
        return;
    }

    const token = decrypt(client.access.github_oauth_token);
    console.log('Token decrypted successfully');

    const target = 'CURSED-ME/complianceAI';
    const [owner, repo] = target.split('/');

    console.log(`Testing access to ${target}...`);
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    if (res.ok) {
        const data = await res.json();
        console.log('SUCCESS: Repository found');
        console.log('Visibility:', data.visibility);
        console.log('Permissions:', data.permissions);
    } else {
        const error = await res.json().catch(() => ({}));
        console.error(`FAILURE: Status ${res.status}`, error);
    }

    await prisma.$disconnect();
}

debug().catch(console.error);
