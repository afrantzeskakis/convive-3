#!/bin/bash

echo "=== Simple CSS Build Without Hardcoded Colors ==="

# Create CSS with proper variable usage
cat > server/public/assets/index.css << 'EOF'
/* CSS Variables - Core Theme */
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
}

/* Import Tailwind processed CSS from existing build */
EOF

# Append the processed Tailwind CSS (without hardcoded overrides)
echo "Processing Tailwind CSS..."
echo "@tailwind base; @tailwind components; @tailwind utilities;" > /tmp/tailwind-only.css
NODE_ENV=production npx tailwindcss -i /tmp/tailwind-only.css -o /tmp/tailwind-processed.css --minify

# Combine with variable definitions
cat /tmp/tailwind-processed.css >> server/public/assets/index.css

# Add component fixes that use CSS variables (not hardcoded colors)
cat >> server/public/assets/index.css << 'EOF'

/* Component fixes using CSS variables only */
[data-radix-popper-content-wrapper] > * {
  background-color: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

[role="menu"],
[role="listbox"] {
  background-color: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
}

[role="menuitem"]:hover,
[role="option"]:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

/* Primary color classes using variables */
.bg-primary {
  background-color: hsl(var(--primary));
}

.hover\:bg-primary\/90:hover {
  background-color: hsl(var(--primary) / 0.9);
}

.text-primary {
  color: hsl(var(--primary));
}

.text-primary-foreground {
  color: hsl(var(--primary-foreground));
}

.border-primary {
  border-color: hsl(var(--primary));
}

/* Button variants using variables */
.btn-primary,
[data-variant="default"]:where(button) {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.btn-primary:hover,
[data-variant="default"]:where(button):hover {
  background-color: hsl(var(--primary) / 0.9);
}
EOF

echo "✅ Clean CSS built without hardcoded colors!"
echo "File size: $(ls -lh server/public/assets/index.css | awk '{print $5}')"
echo ""
echo "CSS now uses only CSS variables - no hardcoded purple values"