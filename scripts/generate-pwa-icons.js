// Generate PWA icons for various sizes from the SVG source
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configure the icon sizes needed for a complete PWA experience
const iconSizes = [
  72,    // Small Android devices
  96,    // Medium Android devices
  128,   // Large Android devices
  144,   // Windows tiles
  152,   // iPad
  192,   // Common size for Android
  384,   // Large Android devices
  512    // Maximum recommended size
];

// Apple-specific icon sizes (iOS requires these specific sizes)
const appleIconSizes = [
  120,   // iPhone
  180,   // iPhone Plus
  152,   // iPad
  167    // iPad Pro
];

// Path to the SVG source file
const svgSourcePath = path.join(__dirname, '../client/public/icons/icon-generator.svg');

// Directory where icons will be saved
const outputDir = path.join(__dirname, '../client/public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if ImageMagick is installed
try {
  execSync('convert -version');
} catch (error) {
  console.error('Error: ImageMagick is not installed or not in PATH.');
  console.error('Please install ImageMagick to generate icons.');
  process.exit(1);
}

// Generate regular icons
console.log('Generating PWA icons...');
iconSizes.forEach(size => {
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  
  // Skip if the file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`- Icon ${size}x${size}px already exists, skipping...`);
    return;
  }
  
  try {
    // Convert SVG to PNG at the specified size using ImageMagick
    execSync(`convert -background none -size ${size}x${size} ${svgSourcePath} ${outputPath}`);
    console.log(`- Generated icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`Error generating ${size}x${size} icon:`, error.message);
  }
});

// Generate Apple-specific icons
console.log('Generating Apple touch icons...');
appleIconSizes.forEach(size => {
  const outputPath = path.join(outputDir, `apple-touch-icon-${size}x${size}.png`);
  
  // Skip if the file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`- Apple icon ${size}x${size}px already exists, skipping...`);
    return;
  }
  
  try {
    // Convert SVG to PNG at the specified size using ImageMagick
    execSync(`convert -background none -size ${size}x${size} ${svgSourcePath} ${outputPath}`);
    console.log(`- Generated apple-touch-icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`Error generating ${size}x${size} Apple icon:`, error.message);
  }
});

// Generate a generic apple-touch-icon.png (180x180)
const genericAppleTouchIconPath = path.join(outputDir, `apple-touch-icon.png`);
if (!fs.existsSync(genericAppleTouchIconPath)) {
  try {
    execSync(`convert -background none -size 180x180 ${svgSourcePath} ${genericAppleTouchIconPath}`);
    console.log('- Generated generic apple-touch-icon.png (180x180)');
  } catch (error) {
    console.error('Error generating generic apple touch icon:', error.message);
  }
}

// Generate favicon.ico (multi-size)
const faviconPath = path.join(__dirname, '../client/public/favicon.ico');
if (!fs.existsSync(faviconPath)) {
  try {
    // Create a 16x16 and 32x32 favicon.ico (multi-resolution)
    execSync(`convert -background none -size 16x16 ${svgSourcePath} -size 32x32 ${svgSourcePath} ${faviconPath}`);
    console.log('- Generated favicon.ico (16x16, 32x32)');
  } catch (error) {
    console.error('Error generating favicon:', error.message);
  }
}

// Generate a fallback placeholder image for offline mode
const placeholderPath = path.join(outputDir, 'placeholder.png');
if (!fs.existsSync(placeholderPath)) {
  try {
    // Create a 512x512 placeholder with text
    execSync(`convert -size 512x512 -background "#f3f4f6" -fill "#4f46e5" -gravity center -font Arial -pointsize 32 label:"Image Unavailable\nYou are offline" ${placeholderPath}`);
    console.log('- Generated placeholder.png for offline mode');
  } catch (error) {
    console.error('Error generating placeholder:', error.message);
  }
}

console.log('Icon generation completed!');