const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, 'apps');

const nextApps = [
  { path: 'mapfre/frontend/src/app', title: 'MAPFRE — MSBross' },
  { path: 'elitescout/src/app', title: 'EliteScout — MSBross' },
  { path: 'jartosdto/client/src/app', title: 'JartosDTo — MSBross' },
  { path: 'txa-fitness-pro/src/app', title: 'TxaFitness — MSBross' },
  { path: 'cuentos-magicos/frontend/app', title: 'Cuentos Mágicos — MSBross' },
  { path: 'perfume-trading/erp/src/app', title: 'Perfume Trading — MSBross' }
];

nextApps.forEach(app => {
  const layoutPath = path.join(appsDir, app.path, 'layout.tsx');
  if (fs.existsSync(layoutPath)) {
    let layout = fs.readFileSync(layoutPath, 'utf8');
    
    // Replace title string
    // e.g. title: "JartosDTo" -> title: "JartosDTo — MSBross"
    layout = layout.replace(/title:\s*["'][^"']*["']/g, `title: "${app.title}"`);
    
    // Check if icons exists, if not, add it to metadata object
    if (!layout.includes('icons:')) {
      layout = layout.replace(/(export const metadata:\s*Metadata\s*=\s*{)/, `$1\n  icons: { icon: "/icon.png" },`);
    } else {
      // If it exists, replace the icons object
      layout = layout.replace(/icons:\s*{[^}]*}/g, `icons: { icon: "/icon.png" }`);
      // If it was icons: [{...}] format
      layout = layout.replace(/icons:\s*\[[^\]]*\]/g, `icons: { icon: "/icon.png" }`);
    }
    
    fs.writeFileSync(layoutPath, layout);
    console.log(`Updated: ${app.path}/layout.tsx`);
  } else {
    console.log(`Not found: ${layoutPath}`);
  }
});
