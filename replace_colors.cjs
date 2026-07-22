const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');

const replacements = [
  { search: /#0a1628/g, replace: '#f4f7fa' },
  { search: /#1e3a5f/g, replace: '#e2e8f0' },
  { search: /#f0f4f8/g, replace: '#1e293b' },
  { search: /#1a4a8a/g, replace: '#2563eb' },
  { search: /rgba\(26,\s*74,\s*138,\s*0\.1\)/g, replace: '#f1f5f9' },
  { search: /rgba\(26,\s*74,\s*138,\s*0\.15\)/g, replace: '#f8fafc' },
  { search: /rgba\(30,\s*58,\s*95,\s*0\.4\)/g, replace: '#cbd5e1' },
  { search: /#0f2040/g, replace: '#ffffff' },
  { search: /rgba\(26,\s*74,\s*138,\s*0\.08\)/g, replace: '#ffffff' },
  { search: /rgba\(30,\s*58,\s*95,\s*0\.3\)/g, replace: '#e2e8f0' },
  { search: /#1a3560/g, replace: '#ffffff' }
];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

walkDir(directoryPath);
console.log('Done replacing colors in pages');
