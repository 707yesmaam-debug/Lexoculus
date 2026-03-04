fetch('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'varad.kh17@gmail.com' }),
}).then(async res => {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}).catch(console.error);
