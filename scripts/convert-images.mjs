import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const dir = "public/images";
const files = await fs.readdir(dir);
const jpgFiles = files.filter((f) => f.toLowerCase().endsWith(".jpg"));

console.log(`Found ${jpgFiles.length} JPG images to convert`);

let success = 0;
let failed = 0;

for (const file of jpgFiles) {
  const inputPath = path.join(dir, file);
  const outputPath = path.join(dir, file.replace(/\.jpg$/i, ".webp"));

  try {
    const stats = await fs.stat(inputPath);
    const originalSizeKB = (stats.size / 1024).toFixed(1);

    await sharp(inputPath)
      .webp({ quality: 82, effort: 4 })
      .toFile(outputPath);

    const outStats = await fs.stat(outputPath);
    const newSizeKB = (outStats.size / 1024).toFixed(1);
    const savings = ((1 - outStats.size / stats.size) * 100).toFixed(1);

    console.log(`✓ ${file}: ${originalSizeKB}KB → ${newSizeKB}KB (${savings}% smaller)`);
    success++;
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${success} succeeded, ${failed} failed`);