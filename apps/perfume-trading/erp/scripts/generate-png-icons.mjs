import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [192, 384, 512];
const iconsDir = join(process.cwd(), 'public/icons');

async function generate() {
  // Create an SVG base for each size
  for (const size of sizes) {
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f43f5e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#003D6B;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui, -apple-system, sans-serif" font-weight="800"
            font-size="${size * 0.38}" fill="white">P</text>
      <text x="50%" y="74%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui, -apple-system, sans-serif" font-weight="600"
            font-size="${size * 0.1}" fill="rgba(255,255,255,0.8)">ERP</text>
    </svg>`);

    const png = await sharp(svg).png().toBuffer();
    writeFileSync(join(iconsDir, `icon-${size}x${size}.png`), png);
    console.log(`Created icon-${size}x${size}.png (${(png.length / 1024).toFixed(1)} KB)`);
  }

  // Generate favicon (32x32)
  const faviconSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="5" fill="#f43f5e"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
          font-family="system-ui, sans-serif" font-weight="bold"
          font-size="16" fill="white">P</text>
  </svg>`);
  const favicon = await sharp(faviconSvg).png().toBuffer();
  writeFileSync(join(process.cwd(), 'public/favicon.ico'), favicon);
  console.log('Created favicon.ico');
}

generate().catch(console.error);
