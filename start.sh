#!/bin/bash
# Start script for Sound Machine on exFAT filesystem
# This script works around the symlink limitation on exFAT

echo "🎵 Starting Sound Machine..."
node node_modules/@electron-forge/cli/dist/electron-forge.js start

