const { exec } = require('child_process');
const localtunnel = require('localtunnel');

console.log('Starting backend server...');
const backend = exec('npm start', { cwd: './server' });
backend.stdout.on('data', data => console.log(`[Backend]: ${data.trim()}`));
backend.stderr.on('data', data => console.error(`[Backend Error]: ${data.trim()}`));

console.log('Starting frontend server...');
// Strict port prevents it from switching to 5174
const frontend = exec('npx vite --port 5173 --strictPort');
frontend.stdout.on('data', data => console.log(`[Frontend]: ${data.trim()}`));
frontend.stderr.on('data', data => console.error(`[Frontend Error]: ${data.trim()}`));

setTimeout(async () => {
  try {
    const tunnel = await localtunnel({ port: 5173 });
    console.log('\n======================================================');
    console.log('✅ WEBSITE-KAAGU WAA ONLINE!');
    console.log(`🔗 LINK-GA: ${tunnel.url}`);
    console.log('======================================================\n');
    console.log('Fiiro gaar ah: Haddii uu ku weydiiyo "Tunnel Password", iska daa oo guji "Click to Continue".');

    tunnel.on('close', () => {
      console.log('Tunnel is closed.');
    });
  } catch (err) {
    console.error('Localtunnel Error:', err);
  }
}, 5000);
