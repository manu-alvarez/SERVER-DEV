const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, 'apps');

const viteApps = [
  { path: 'app-generator', title: 'App Generator — MSBross' },
  { path: 'moko-tools', title: 'Moko Tools — MSBross' },
  { path: 'taskflow-pro', title: 'TaskFlow Pro — MSBross' },
  { path: 'gas-station', title: 'Gas Station — MSBross' },
  { path: 'cv-portfolio', title: 'CV Portfolio — MSBross' },
  { path: 'traductor-pro/client', title: 'Traductor PRO — MSBross' },
  { path: 'logisearch', title: 'LogiSearch AI — MSBross' },
  { path: 'it-english-coach-frontend', title: 'IT English Coach — MSBross' },
  { path: 'it-english-coach', title: 'IT English Coach — MSBross' },
  { path: 'iaputa-os/frontend', title: 'IAPuta OS — MSBross' },
  { path: 'livekit-nikolina/frontend', title: 'Nikolina AI — MSBross' },
  { path: 'edelweiss', title: 'Edelweiss — MSBross' },
  { path: 'expositator-rte', title: 'Expositator RTE — MSBross' },
  { path: 'industrialpro', title: 'IndustrialPro — MSBross' },
  { path: 'combipro', title: 'CombiPro — MSBross' },
  { path: 'msbross-frontend', title: 'MSBross Ecosystem — MSBross' },
  { path: 'msbross/public', title: 'MSBross Platform — MSBross' }
];

viteApps.forEach(app => {
  const htmlPath = path.join(appsDir, app.path, 'index.html');
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Replace <title>
    html = html.replace(/<title>.*?<\/title>/gi, `<title>${app.title}</title>`);
    
    // Replace <link rel="icon"...>
    html = html.replace(/<link[^>]*rel=["']?icon["']?[^>]*>/gi, `<link rel="icon" type="image/svg+xml" href="/logo-icon.svg" />`);
    
    // If it didn't have an icon tag, inject it before </head>
    if (!html.includes('logo-icon.svg')) {
      html = html.replace('</head>', `  <link rel="icon" type="image/svg+xml" href="/logo-icon.svg" />\n</head>`);
    }
    
    fs.writeFileSync(htmlPath, html);
    console.log(`Updated: ${app.path}/index.html`);
  } else {
    console.log(`Not found: ${htmlPath}`);
  }
});
