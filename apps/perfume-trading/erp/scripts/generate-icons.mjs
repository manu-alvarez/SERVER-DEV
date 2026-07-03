import { writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [192, 384, 512];
const iconsDir = join(process.cwd(), 'public/icons');

sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#f43f5e"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-weight="bold"
        font-size="${size * 0.4}" fill="white">P</text>
  <text x="50%" y="72%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="${size * 0.1}" fill="rgba(255,255,255,0.7)">ERP</text>
</svg>`;
  writeFileSync(join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

console.log('Icons generated in public/icons/');
