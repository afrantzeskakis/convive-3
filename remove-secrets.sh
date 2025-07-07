#!/bin/bash

echo "Removing files with secrets from Git history..."

# Remove each file from Git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch test-correct-api-format.js' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch test-wine-verification.js' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch test-corrected-wine-verification.js' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch test-single-wine-verification.js' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch verify-existing-wines.js' \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch "attached_assets/Pasted--workspace-git-remote-add-origin-https-ghp-LsfRnwPzUizEY0oQtiNPCNZiPZATrh4DEjqw-github-com-afran-1751869373895_1751869373896.txt"' \
  --prune-empty --tag-name-filter cat -- --all

echo "Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Done! Now force push with: git push --force -u origin main"