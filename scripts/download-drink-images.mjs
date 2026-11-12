import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const dir = "public/images";

// Brand colors for Placehold.co placeholders (matching actual brand colors)
const brandColors = {
  pepsi: { text: "003366", bg: "ffffff" },
  "7up": { text: "0099cc", bg: "ffffff" },
  sprite: { text: "1ed760", bg: "ffffff" },
  sting: { text: "ffd700", bg: "000000" },
  "next-cola": { text: "cc0000", bg: "ffffff" },
  water: { text: "0066cc", bg: "e8f4fd" },
  pizup: { text: "003366", bg: "ffffff" },
};

// Working Unsplash image (real cocktail/mint drink photo)
const mintDrinkUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&fm=webp";

// All drink images needed for the 16 Cold Drinks products
const sources = [
  // Real Unsplash photo for Mint Margarita
  { name: "mint-drink", type: "unsplash", url: mintDrinkUrl },

  // Pepsi products
  { name: "pepsi-1l", type: "placeholder", label: "Pepsi 1L", brand: "pepsi", width: 600, height: 400 },
  { name: "pepsi-1.5l", type: "placeholder", label: "Pepsi 1.5L", brand: "pepsi", width: 600, height: 500 },
  { name: "pepsi-can", type: "placeholder", label: "Pepsi Can", brand: "pepsi", width: 400, height: 400 },
  { name: "pepsi-unclear", type: "placeholder", label: "Pepsi", brand: "pepsi", width: 600, height: 400 },

  // 7Up products
  { name: "7up-regular", type: "placeholder", label: "7Up Regular", brand: "7up", width: 600, height: 400 },
  { name: "7up-can", type: "placeholder", label: "7Up Can", brand: "7up", width: 400, height: 400 },
  { name: "7up-1l", type: "placeholder", label: "7Up 1L", brand: "7up", width: 600, height: 400 },

  // Sprite
  { name: "sprite-bottle", type: "placeholder", label: "Sprite", brand: "sprite", width: 600, height: 400 },

  // Sting
  { name: "sting-bottle", type: "placeholder", label: "Sting", brand: "sting", width: 600, height: 400 },

  // Next Cola products
  { name: "next-cola-small", type: "placeholder", label: "Next Cola Small", brand: "next-cola", width: 600, height: 400 },
  { name: "next-cola-regular", type: "placeholder", label: "Next Cola Regular", brand: "next-cola", width: 600, height: 400 },
  { name: "next-cola-large", type: "placeholder", label: "Next Cola Large", brand: "next-cola", width: 600, height: 500 },

  // Water products
  { name: "water-small", type: "placeholder", label: "Water Small", brand: "water", width: 400, height: 600 },
  { name: "water-large", type: "placeholder", label: "Water Large", brand: "water", width: 400, height: 700 },

  // Pizup
  { name: "pizup-bottle", type: "placeholder", label: "Pizup", brand: "pizup", width: 600, height: 400 },
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