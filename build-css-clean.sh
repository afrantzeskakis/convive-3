#!/bin/bash

echo "=== Building Clean CSS for Production ==="

# Create a temporary CSS file that includes everything in the right order
cat > /tmp/main.css << 'EOF'
/* Theme variables */
@import "./client/src/theme-vars.css";

/* Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Base customizations */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}

/* Component customizations using Tailwind @apply */
@layer components {
  /* Ensure dropdowns use theme colors */
  [data-radix-popper-content-wrapper] > * {
    @apply bg-popover text-popover-foreground border border-border rounded-md shadow-lg;
  }
  
  [role="menu"],
  [role="listbox"],
  [data-radix-collection-item] {
    @apply bg-popover text-popover-foreground;
  }
  
  [role="menuitem"]:hover,
  [role="option"]:hover {
    @apply bg-accent text-accent-foreground;
  }
  
  /* Select components */
  [data-radix-select-viewport] {
    @apply bg-popover text-popover-foreground;
  }
  
  button[role="combobox"] {
    @apply bg-background text-foreground border-input;
  }
  
  /* Dialogs */
  [role="dialog"] {
    @apply bg-background text-foreground border-border;
  }
  
  /* Toast notifications */
  [data-sonner-toast] {
    @apply bg-background text-foreground border-border;
  }
}

/* Import production fixes last */
@import "./client/src/production-fixes.css";
EOF

# Process with PostCSS and Tailwind
echo "Processing with PostCSS and Tailwind..."
NODE_ENV=production npx postcss /tmp/main.css -o server/public/assets/index.css \
  --config ./postcss.config.js

# Verify the build
if [ -f "server/public/assets/index.css" ]; then
  echo "✅ Clean CSS build complete!"
  echo "File size: $(ls -lh server/public/assets/index.css | awk '{print $5}')"
  
  # Check if CSS variables are preserved
  echo ""
  echo "Checking CSS variable usage..."
  grep -c "var(--" server/public/assets/index.css && echo "✅ CSS variables preserved" || echo "⚠️  Warning: CSS variables might not be preserved"
  
  # Check if primary color is using variables
  echo ""
  echo "Checking primary color implementation..."
  grep -E "\.bg-primary|background-color:.*var\(--primary\)" server/public/assets/index.css | head -3
else
  echo "❌ CSS build failed!"
  exit 1
fi

echo ""
echo "=== Clean Build Complete ==="