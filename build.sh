#!/bin/bash

# Railway production build script
echo "=== Railway Production Build ==="
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci || npm install

# Install platform-specific modules
echo "Installing required modules..."
npm install @rollup/rollup-linux-x64-gnu || true

# Reinstall Sharp for Linux
echo "Configuring Sharp for Linux..."
npm uninstall sharp
npm install sharp --platform=linux --arch=x64

# Use emergency build method due to Vite timeout issues
echo "Using fast build method with esbuild..."

# Install esbuild
npm install esbuild --save-dev --force

# Create server/public directory
rm -rf server/public
mkdir -p server/public/assets

# Create index.html
cat > server/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Restaurant Wine Management System</title>
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="stylesheet" href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# Build JavaScript with esbuild
echo "Building JavaScript bundle..."
npx esbuild client/src/main.tsx \
  --bundle \
  --outfile=server/public/assets/index.js \
  --format=esm \
  --platform=browser \
  --target=es2020 \
  --loader:.tsx=tsx \
  --loader:.ts=ts \
  --loader:.svg=text \
  --loader:.png=dataurl \
  --loader:.jpg=dataurl \
  --jsx=automatic \
  --define:process.env.NODE_ENV=\"production\" \
  --minify

# Process theme configuration
echo "Processing theme configuration..."
node -e "
const fs = require('fs');
const theme = require('./theme.json');

// Convert hex to HSL
function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return \`\${Math.round(h * 360)} \${Math.round(s * 100)}% \${Math.round(l * 100)}%\`;
}

// Convert theme to CSS variables
const cssVars = \`
:root {
  --primary: \${hexToHSL(theme.primary)};
  --radius: \${theme.radius}rem;
}

[data-theme='professional'] {
  --background: 0 0% 100%;
  --foreground: 224 71.4% 4.1%;
  --card: 0 0% 100%;
  --card-foreground: 224 71.4% 4.1%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 71.4% 4.1%;
  --primary-foreground: 210 20% 98%;
  --secondary: 220 14.3% 95.9%;
  --secondary-foreground: 220.9 39.3% 11%;
  --muted: 220 14.3% 95.9%;
  --muted-foreground: 220 8.9% 46.1%;
  --accent: 220 14.3% 95.9%;
  --accent-foreground: 220.9 39.3% 11%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 20% 98%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 262.1 83.3% 57.8%;
  
  /* Chart colors */
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
  
  /* Sidebar colors */
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}
\`;

// Create a complete CSS file with theme vars
const fullCss = cssVars + fs.readFileSync('client/src/index.css', 'utf8');
fs.writeFileSync('client/src/index-with-theme.css', fullCss);
"

# Build CSS with Tailwind including theme vars and scanning all components
echo "Building CSS with Tailwind..."
NODE_ENV=production npx tailwindcss -i client/src/index-with-theme.css -o server/public/assets/index.css --minify

# Clean up temp file
rm -f client/src/index-with-theme.css

# Copy static assets
cp -r client/public/* server/public/ 2>/dev/null || true

# Verify build
if [ -f "server/public/index.html" ] && [ -f "server/public/assets/index.js" ]; then
  echo "✅ Build completed successfully!"
  ls -la server/public/
else
  echo "❌ Build failed"
  exit 1
fi

echo "=== Build Complete ==="