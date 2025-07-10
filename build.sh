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
    <link rel="stylesheet" href="/dropdown-fix.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# Build JavaScript with esbuild (without CSS)
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
  --minify \
  --external:*.css

# Build CSS with improved build script
echo "Building CSS..."
if [ -f "build-css.sh" ]; then
  chmod +x build-css.sh
  ./build-css.sh
else
  echo "❌ build-css.sh not found, using fallback CSS build"
  # Fallback CSS build
  echo "@tailwind base; @tailwind components; @tailwind utilities;" > /tmp/basic.css
  NODE_ENV=production npx tailwindcss -i /tmp/basic.css -o server/public/assets/index.css --minify
fi

# Verify CSS was built
if [ -f "server/public/assets/index.css" ]; then
  echo "✅ CSS built successfully"
  echo "CSS file size: $(ls -lh server/public/assets/index.css | awk '{print $5}')"
else
  echo "❌ CSS build failed!"
  exit 1
fi

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