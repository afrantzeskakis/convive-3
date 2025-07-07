#!/bin/bash

# Script to clean Git history by removing files with secrets

echo "Cleaning Git history to remove secrets..."

# Create a list of files to remove from history
cat > files-to-remove.txt << EOF
test-correct-api-format.js
test-wine-verification.js
test-corrected-wine-verification.js
test-single-wine-verification.js
verify-existing-wines.js
attached_assets/Pasted--workspace-git-remote-add-origin-https-ghp-LsfRnwPzUizEY0oQtiNPCNZiPZATrh4DEjqw-github-com-afran-1751869373895_1751869373896.txt
EOF

# Use git filter-branch to remove these files from all commits
echo "Starting filter-branch process..."
git filter-branch --force --index-filter \
  'while read -r file; do
    git rm --cached --ignore-unmatch "$file"
  done < files-to-remove.txt' \
  --prune-empty --tag-name-filter cat -- --all

echo "Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Done! Now you can force push with: git push --force -u origin main"