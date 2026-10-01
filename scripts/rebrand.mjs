import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.next') && !full.includes('.git')) {
        results = results.concat(walk(full));
      }
    } else {
      if (/\.(tsx|ts|js|jsx|json|md|html|css)$/.test(file)) {
        results.push(full);
      }
    }
  });
  return results;
}

const files = walk('./src');
let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;
  if (content.includes("VR Men's Collection")) {
    content = content.replaceAll("VR Men's Collection", "VR Men's Wear");
    changed = true;
  }
  if (content.includes("VR MEN'S COLLECTION")) {
    content = content.replaceAll("VR MEN'S COLLECTION", "VR MEN'S WEAR");
    changed = true;
  }
  if (content.includes("vrmenscollection.in")) {
    content = content.replaceAll("vrmenscollection.in", "vrmenswear.in");
    changed = true;
  }
  if (content.includes("support@vrmenscollection.in")) {
    content = content.replaceAll("support@vrmenscollection.in", "support@vrmenswear.in");
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    count++;
  }
}
console.log(`Updated ${count} files to "VR Men's Wear" branding.`);
