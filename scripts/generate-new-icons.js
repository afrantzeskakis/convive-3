import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.join(__dirname, '../client/public/icons/new-icon-generator.svg');
const outputDir = path.join(__dirname, '../client/public/icons');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// PWA icon sizes
const sizes = [
  72,   // Small home screen icon
  96,   // Medium home screen icon
  128,  // Large home screen icon
  144,  // Chrome store icon
  152,  // iPad touch icon
  167,  // iPad Pro touch icon
  180,  // iPhone touch icon
  192,  // Standard Android icon
  512,  // Large app icon for stores
  1024  // Extra large for App Store
];

// Generate each size
sizes.forEach(size => {
  const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
  
  const command = `
    npx svg-to-png ${sourceFile} ${outputFile} \
    --width ${size} \
    --height ${size}
  `;

  console.log(`Generating ${size}x${size} icon...`);
  
  exec(command.trim(), (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating ${size}x${size} icon: ${error}`);
      return;
    }
    
    console.log(`Successfully generated ${outputFile}`);
  });
});

// Generate maskable versions with padding (for Android adaptive icons)
const maskableSizes = [192, 512];

maskableSizes.forEach(size => {
  const outputFile = path.join(outputDir, `maskable-icon-${size}x${size}.png`);
  
  // For maskable icons, we need to add some padding, about 15% on each side
  // so the important content is in the safe area (central 80%)
  const safeAreaSize = Math.floor(size * 0.8); // 80% of the total size
  const padding = Math.floor((size - safeAreaSize) / 2);
  
  const command = `
    npx svg-to-png ${sourceFile} ${outputFile} \
    --width ${safeAreaSize} \
    --height ${safeAreaSize} \
    --padding ${padding}
  `;

  console.log(`Generating maskable ${size}x${size} icon...`);
  
  exec(command.trim(), (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating maskable ${size}x${size} icon: ${error}`);
      return;
    }
    
    console.log(`Successfully generated ${outputFile}`);
  });
});

console.log('Icon generation initiated. If you see errors about svg-to-png, you might need to install it with: npm install -g svg-to-png');