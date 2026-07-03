const fs = require('fs');
const file = '/Users/manu/Desktop/SERVER-DEV/apps/cuentos-magicos/frontend/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/icons: \{\n\s+icon: \[\n\s+\{ url: "\/app\/cuentos-magicos\/icons\/icon-192.png"[\s\S]*?\n\s+\],\n\s+\},/g, '');
fs.writeFileSync(file, content);
