import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const dir = "public/images";

// Brand colors for Placehold.co placeholders
const brandColors = {
  pepsi: { text: "003366", bg: "ffffff" },
  "7up": { text: "0099cc", bg: "ffffff" },
  sprite: { text: "1ed760", bg: "ffffff" },
  sting: { text: "ffd700", bg: "000000" },
  "next-cola": { text: "cc0000", bg: "ffffff" },
  water: { text: "0066cc", bg: "e8f4fd" },
};

// Working Unsplash image (generic cocktail/drink photo)
const genericDrinkUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&fm=webp";

const sources = [
  // Brand-specific placeholders via Placehold.co (clean, labelled, fast-loading)
  // These will be replaced with actual brand photos when available
  { name: "pepsi-bottle", type: "placeholder", label: "Pepsi", brand: "pepsi", width: 600, height: 400 },
  { name: "pepsi-1l", type: "placeholder", label: "Pepsi 1L", brand: "pepsi", width: 600, height: 400 },
  { name: "pepsi-1.5l", type: "placeholder", label: "Pepsi 1.5L", brand: "pepsi", width: 600, height: 500 },
  { name: "pepsi-can", type: "placeholder", label: "Pepsi Can", brand: "pepsi", width: 400, height: 400 },
  { name: "7up-bottle", type: "placeholder", label: "7Up", brand: "7up", width: 600, height: 400 },
  { name: "7up-can", type: "placeholder", label: "7Up Can", brand: "7up", width: 400, height: 400 },
  { name: "7up-1l", type: "placeholder", label: "7Up 1L", brand: "7up", width: 600, height: 400 },
  { name: "sprite-bottle", type: "placeholder", label: "Sprite", brand: "sprite", width: 600, height: 400 },
  { name: "sting-bottle", type: "placeholder", label: "Sting", brand: "sting", width: 600, height: 400 },
  { name: "next-cola-bottle", type: "placeholder", label: "Next Cola", brand: "next-cola", width: 600, height: 400 },
  { name: "water-bottle-small", type: "placeholder", label: "Water", brand: "water", width: 400, height: 600 },
  { name: "water-bottle-large", type: "placeholder", label: "Water", brand: "water", width: 400, height: 700 },
  { name: "mint-drink", type: "unsplash", url: genericDrinkUrl },
  { name: "pizup-bottle", type: "placeholder", label: "Pizup", brand: "water", width: 600, height: 400 },
];

async function download() {
  await fs.mkdir(dir, { recursive: true });
  let success = 0, failed = 0;
  for (const src of sources) {
    const out = path.join(dir, src.name + ".webp");
    try {
      let buf;
      if (src.type === "unsplash") {
        const res = await fetch(src.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buf = Buffer.from(await res.arrayBuffer());
      } else {
        const { label, brand, width, height } = src;
        const colors = brandColors[brand] || { text: "666666", bg: "f0f0f0" };
        const phUrl = `https://placehold.co/${width}x${height}/png?text=${encodeURIComponent(label)}&font=noto&text_color=${colors.text}&bg_color=${colors.bg}`;
        const res = await fetch(phUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buf = Buffer.from(await res.arrayBuffer());
      }
      // Convert to WebP with sharp
      const webpBuf = await sharp(buf).webp({ quality: 82, effort: 4 }).toBuffer();
      await fs.writeFile(out, webpBuf);
      const stats = await fs.stat(out);
      console.log(`OK ${src.name}: ${(stats.size / 1024).toFixed(1)} KB WebP`);
      success++;
    } catch (err) {
      console.error(`FAIL ${src.name}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\nDone: ${success} succeeded, ${failed} failed`);
}

download();