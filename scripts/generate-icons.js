import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Generating app icons...');

// Install sharp if needed
exec('npm list sharp || npm install --no-save sharp', async (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing dependencies: ${error}`);
    return;
  }
  
  const sharp = (await import('sharp')).default;
  const iconSizes = [192, 512];
  const svgPath = path.join(__dirname, '../client/public/icons/icon-generator.svg');
  const outputDir = path.join(__dirname, '../client/public/icons');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate icons for each size
  iconSizes.forEach(size => {
    sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
      .then(() => {
        console.log(`Generated ${size}x${size} icon`);
      })
      .catch(err => {
        console.error(`Error generating ${size}x${size} icon:`, err);
      });
  });
});