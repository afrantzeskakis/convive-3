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

# Build CSS with Tailwind - ensuring all imports are processed
echo "Building CSS with Tailwind..."
# First, create a combined CSS file that includes all imports
cat > /tmp/combined.css << 'EOF'
/* Import theme variables first */
@import "./client/src/theme-vars.css";

/* Then import the main CSS */
@import "./client/src/index.css";

/* Additional fixes for production dropdown issues */
.data-\[state\=open\]\:animate-in {
  animation: accordion-down 0.2s ease-out;
}

/* Ensure dropdown backgrounds are not transparent */
[role="menu"],
[role="listbox"],
[data-radix-popper-content-wrapper] > * {
  background-color: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
}

/* Fix for dropdown text visibility */
[role="menuitem"],
[role="option"] {
  color: hsl(var(--popover-foreground));
}

/* Ensure proper z-index for dropdowns */
[data-radix-popper-content-wrapper] {
  z-index: 50;
}
EOF

# Build with the combined CSS
NODE_ENV=production npx tailwindcss -i /tmp/combined.css -o server/public/assets/index.css --minify

# Clean up
rm /tmp/combined.css

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