const fs = require('fs');
['ce.json', 'gpai.json', 'tripwire.json', 'refiner.json'].forEach(file => {
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf16le'));
        console.log(`\n=== ${file} ===`);
        data.testResults.forEach(suite => {
            suite.assertionResults.filter(r => r.status === 'failed').forEach(r => {
                console.log(`- FAIL: ${r.title}`);
                const msg = r.failureMessages[0];
                const lines = msg.split('\n').map(l => l.trim()).filter(l => l);
                // Print the first 5 lines of the error message
                console.log(lines.slice(0, 5).join('\n'));
            });
        });
    } catch (e) { console.error(`Error parsing ${file}:`, e.message); }
});
