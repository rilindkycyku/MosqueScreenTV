import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Scenery is drawn in the Hadith card: 944×525 CSS px on a 1080p screen, ~1888×1050
// device px on a 4K panel at DPR 2. Chromium decodes a WebP at its full resolution
// whatever size it is drawn at, so the camera-sized originals (up to 7011×4881) cost
// up to ~137 MB of bitmap each — on a TV with 1 GB of RAM (Dahua LTV43-SD200) that is
// enough to get the browser's renderer killed, and a crashed tab holds no wake lock,
// so the TV went to sleep some hours later. Every image is scaled to the smallest size
// that still covers 1920×1080 (fit: 'outside'), which keeps the card sharp at any
// resolution and each decode under ~15 MB.
const dir = 'src/assets/scenery/';
const COVER = { width: 1920, height: 1080, fit: 'outside', withoutEnlargement: true };
const QUALITY = 80;

for (const file of fs.readdirSync(dir)) {
    const inputPath = path.join(dir, file);
    try {
        if (/\.(jpg|jpeg|png)$/i.test(file)) {
            const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            await sharp(inputPath).rotate().resize(COVER).webp({ quality: QUALITY }).toFile(outputPath);
            console.log(`Converted ${file} → ${path.basename(outputPath)}`);
            // Delete the original by hand once the .webp looks right — the scenery glob
            // in ActivityBox picks up .jpg/.png too, so leaving both shows it twice.
            // fs.unlinkSync(inputPath); // Temporarily commented out to avoid locking errors
        } else if (/\.webp$/i.test(file)) {
            const { width, height } = await sharp(inputPath).metadata();
            // Already at (or under) the covering size: re-encoding would only lose quality.
            if (Math.min(width / COVER.width, height / COVER.height) <= 1) continue;
            const buffer = await sharp(inputPath).rotate().resize(COVER).webp({ quality: QUALITY }).toBuffer();
            fs.writeFileSync(inputPath, buffer);
            const out = await sharp(buffer).metadata();
            console.log(`Resized ${file}: ${width}×${height} → ${out.width}×${out.height}`);
        }
    } catch (err) {
        console.error(`Failed to convert ${file}:`, err.message);
    }
}
console.log('--- WEBP Conversion Complete ---');
