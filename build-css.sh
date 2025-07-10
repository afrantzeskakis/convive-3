#!/bin/bash

echo "=== Building Complete CSS for Production ==="

# Create combined CSS input file
cat > /tmp/combined-input.css << 'EOF'
/* Theme variables */
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

/* Production fixes */
[data-radix-popper-content-wrapper] {
  --popover: 0 0% 100% !important;
  --popover-foreground: 224 71.4% 4.1% !important;
}

[role="menu"],
[role="listbox"],
[data-state="open"] > div,
.dropdown-content,
[data-radix-collection-item] {
  background-color: hsl(var(--popover)) !important;
  color: hsl(var(--popover-foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

[data-radix-select-viewport] {
  background-color: hsl(var(--popover)) !important;
}

[data-radix-dialog-overlay] {
  background-color: rgb(0 0 0 / 0.8);
}

[data-sonner-toast] {
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
}

button:hover:not(:disabled) {
  opacity: 0.9;
}

.card,
[data-card] {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
}

input,
textarea,
select {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border-color: hsl(var(--input));
}

*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

[data-radix-popper-content-wrapper],
[data-radix-dialog-content],
[data-sonner-toaster] {
  z-index: 50;
}

[data-state="open"][data-radix-collapsible-content] {
  animation: accordion-down 0.2s ease-out;
}

[data-state="closed"][data-radix-collapsible-content] {
  animation: accordion-up 0.2s ease-out;
}

* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Tailwind directives */
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
EOF

# Process with Tailwind
echo "Processing CSS with Tailwind..."
NODE_ENV=production npx tailwindcss -i /tmp/combined-input.css -o server/public/assets/index.css --minify

# Add additional critical fixes directly
cat >> server/public/assets/index.css << 'EOF'

/* Critical production overrides */
[data-radix-popper-content-wrapper] > * {
  background-color: white !important;
  color: #020817 !important;
}

[role="menu"],
[role="listbox"],
[cmdk-list] {
  background-color: white !important;
  border: 1px solid #e4e4e7 !important;
}

[data-radix-select-content],
[data-radix-select-viewport] {
  background-color: white !important;
  color: #020817 !important;
}

button[role="combobox"],
button[data-state][aria-haspopup] {
  background-color: white !important;
  color: #020817 !important;
  border: 1px solid #e4e4e7 !important;
}

[role="dialog"] {
  background-color: white !important;
  color: #020817 !important;
}
EOF

echo "✅ CSS build complete!"
echo "File size: $(ls -lh server/public/assets/index.css | awk '{print $5}')"