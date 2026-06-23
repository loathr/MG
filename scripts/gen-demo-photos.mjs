// Generates 9 distinct demo photos (full 1280x1600 + small 200x250 thumb) used
// by the crash-safety proof (?demo=photos9). Real JPEGs so the browser performs
// a genuine full-resolution decode per slide — exactly the load that crashed the
// old app — letting the test prove the §3 architecture under realistic memory.
import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "demo");
mkdirSync(outDir, { recursive: true });

const hues = [350, 25, 50, 130, 175, 205, 250, 290, 320];

function svg(W, H, hue, n) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
       <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="hsl(${hue},65%,42%)"/>
         <stop offset="1" stop-color="hsl(${(hue + 40) % 360},70%,18%)"/>
       </linearGradient></defs>
       <rect width="${W}" height="${H}" fill="url(#g)"/>
       <circle cx="${W * 0.7}" cy="${H * 0.3}" r="${W * 0.28}" fill="hsl(${hue},80%,60%)" opacity="0.35"/>
       <circle cx="${W * 0.25}" cy="${H * 0.72}" r="${W * 0.34}" fill="hsl(${(hue + 180) % 360},60%,30%)" opacity="0.3"/>
       <text x="50%" y="50%" font-family="Georgia, serif" font-size="${Math.round(W * 0.5)}"
             fill="rgba(255,255,255,0.18)" text-anchor="middle" dominant-baseline="middle">${n}</text>
     </svg>`,
  );
}

for (let i = 0; i < 9; i++) {
  const hue = hues[i];
  await sharp(svg(1280, 1600, hue, i + 1)).jpeg({ quality: 80 }).toFile(join(outDir, `photo-${i + 1}.jpg`));
  await sharp(svg(200, 250, hue, i + 1)).jpeg({ quality: 70 }).toFile(join(outDir, `thumb-${i + 1}.jpg`));
}
console.log("wrote 9 demo photos + thumbs to public/demo/");
