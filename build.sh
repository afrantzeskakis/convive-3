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

# Build JavaScript with esbuild and inline CSS imports
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
  --loader:.css=text \
  --jsx=automatic \
  --define:process.env.NODE_ENV=\"production\" \
  --minify

# Build CSS with Tailwind - complete rebuild with all fixes
echo "Building CSS with Tailwind..."

# First, combine all CSS files into one
echo "Creating combined CSS file..."
cat > /tmp/full-styles.css << 'EOF'
/* CSS Variables and Theme */
:root {
  --background: 0 0% 100%;
  --foreground: 224 71.4% 4.1%;
  --card: 0 0% 100%;
  --card-foreground: 224 71.4% 4.1%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 71.4% 4.1%;
  --primary: 262 83% 58%;
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
  --radius: 0.5rem;
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}

/* Critical Production Fixes for UI Components */

/* Fix all dropdown and popover issues */
[data-radix-popper-content-wrapper] > div,
[role="menu"],
[role="listbox"],
[data-state="open"][data-radix-collection-item],
div[cmdk-list],
div[data-radix-select-content],
div[data-radix-select-viewport] {
  background-color: hsl(var(--popover)) !important;
  color: hsl(var(--popover-foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
  backdrop-filter: none !important;
  opacity: 1 !important;
}

/* Ensure dropdown items are visible */
[role="menuitem"],
[role="option"],
[cmdk-item],
div[data-radix-select-item] {
  background-color: transparent !important;
  color: hsl(var(--popover-foreground)) !important;
  padding: 0.5rem 1rem;
}

[role="menuitem"]:hover,
[role="option"]:hover,
[cmdk-item]:hover,
div[data-radix-select-item]:hover {
  background-color: hsl(var(--accent)) !important;
  color: hsl(var(--accent-foreground)) !important;
}

/* Fix select trigger buttons */
button[role="combobox"],
button[data-state][aria-haspopup="listbox"] {
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--input)) !important;
}

/* Dialog/Modal styling */
div[role="dialog"],
div[data-state="open"][data-radix-dialog-content] {
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
}

/* Overlay backgrounds */
div[data-radix-dialog-overlay],
div[data-radix-presence-slot] {
  background-color: rgb(0 0 0 / 0.8) !important;
}

/* Toast styling */
li[data-sonner-toast],
div[data-sonner-toast] {
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
}

/* Ensure proper z-indexing */
[data-radix-popper-content-wrapper] {
  z-index: 9999 !important;
}

[data-radix-dialog-overlay] {
  z-index: 9998 !important;
}

[data-radix-dialog-content] {
  z-index: 9999 !important;
}

/* Fix input and form controls */
input,
textarea,
select {
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--input)) !important;
}

/* Button states */
button {
  transition: opacity 0.2s;
}

button:hover:not(:disabled) {
  opacity: 0.9;
}

/* Focus visible states */
*:focus-visible {
  outline: 2px solid hsl(var(--ring)) !important;
  outline-offset: 2px !important;
}

/* Animations */
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}

/* Font smoothing */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
EOF

# Build CSS with PostCSS and Tailwind
echo "Processing with Tailwind..."
NODE_ENV=production npx tailwindcss -i /tmp/full-styles.css -o server/public/assets/index.css --minify

# Verify CSS was built
if [ -f "server/public/assets/index.css" ]; then
  echo "✅ CSS built successfully"
  echo "CSS file size: $(ls -lh server/public/assets/index.css | awk '{print $5}')"
else
  echo "❌ CSS build failed!"
  exit 1
fi

# Clean up
rm -f /tmp/full-styles.css

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