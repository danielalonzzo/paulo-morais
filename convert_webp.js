const sharp = require('sharp');
const fs = require('fs');

const images = [
  'images/logo/logo_bw_loading.png',
  'images/sobre-mim/paulo-morais.png',
  'images/sobre-mim/o-paulo-1.jpg',
  'images/sobre-mim/o-paulo-2.jpg',
  'images/sobre-mim/o-paulo-3.jpg',
  'images/sobre-mim/o-paulo-4.jpg',
  'images/osteopatia/ipad-model.png'
];

async function convert() {
  for (const img of images) {
    if (fs.existsSync(img)) {
      const out = img.replace(/\.(png|jpg)$/, '.webp');
      await sharp(img).webp({ quality: 80 }).toFile(out);
      console.log(`Converted ${img} to ${out}`);
    } else {
      console.log(`Not found: ${img}`);
    }
  }
}
convert();
