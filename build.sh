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

# Build CSS with Tailwind
echo "Building CSS with Tailwind..."
npx tailwindcss -i client/src/index.css -o server/public/assets/index.css --minify

# Copy static assets
cp -r client/public/* server/public/ 2>/dev/null || true

# Build server TypeScript files
echo "Building server TypeScript files..."
npx tsc

# Verify build
if [ -f "server/public/index.html" ] && [ -f "server/public/assets/index.js" ]; then
  echo "✅ Frontend build completed successfully!"
  ls -la server/public/
else
  echo "❌ Frontend build failed"
  exit 1
fi

# Verify server build
if [ -f "server/index.js" ] && [ -f "server/routes.js" ]; then
  echo "✅ Server build completed successfully!"
else
  echo "❌ Server build failed"
  exit 1
fi

echo "=== Build Complete ==="