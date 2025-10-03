#!/usr/bin/env bash
# Automated release script for Sleep (Electron Forge + GitHub Releases)
# Usage:
#   npm run release            # bump patch, push, tag, publish
#   npm run release:minor      # bump minor
#   npm run release:major      # bump major
# Or directly:
#   bash scripts/release.sh [patch|minor|major]

set -euo pipefail
IFS=$'\n\t'

# Move to repo root (this script lives in scripts/)
cd "$(dirname "$0")/.."

# Validate environment
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: GITHUB_TOKEN is not set. Export a token with repo access before running." >&2
  echo "Example: export GITHUB_TOKEN=ghp_xxx" >&2
  exit 1
fi

# Ensure clean working tree
if [[ -n "$(git status --porcelain=v1)" ]]; then
  echo "ERROR: You have uncommitted changes. Please commit or stash before releasing." >&2
  git status --porcelain=v1
  exit 1
fi

BUMP_TYPE="${1:-patch}"
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Usage: bash scripts/release.sh [patch|minor|major]" >&2
  exit 1
fi

# Ensure dependencies are installed
if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm ci
fi

# Bump version (creates a git commit and an annotated tag vX.Y.Z)
# The commit message template will become: chore(release): vX.Y.Z
NEW_TAG=$(npm version "$BUMP_TYPE" -m "chore(release): v%s")
echo "Version bumped. New tag: ${NEW_TAG}"

# Push commit and tag
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Pushing branch ${CURRENT_BRANCH} and tag ${NEW_TAG}..."
git push origin "$CURRENT_BRANCH"
git push origin "$NEW_TAG"

# Publish via Electron Forge (will build + upload assets to the GitHub Release)
echo "Publishing via Electron Forge..."
# electron-forge publish implicitly runs make; no need to run make first
npm run publish

echo "Release complete: ${NEW_TAG}"

