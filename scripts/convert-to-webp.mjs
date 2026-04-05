import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const dir = 'public/images/';
const files = fs.readdirSync(dir);

for (const file of files) {
    // Only convert scenery backgrounds, not the UI textures or icons
    if (file.match(/\.(jpg|jpeg|png)$/) && !file.includes('background-opacity') && !file.includes('logo')) {
        const inputPath = path.join(dir, file);
        const outputPath = path.join(dir, file.replace(/\.(jpg|jpeg|png)$/, '.webp'));
        
        try {
            console.log(`Successfully converted ${file} to WEBP`);
            await sharp(inputPath)
                .webp({ quality: 80 })
                .toFile(outputPath);
            
            // fs.unlinkSync(inputPath); // Temporarily commented out to avoid locking errors
        } catch (err) {
            console.error(`Failed to convert ${file}:`, err.message);
        }
    }
}
console.log('--- WEBP Conversion Complete ---');
