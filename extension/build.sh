#!/bin/bash
# Build the Zions DevKick extension for Chrome/Edge
set -e

echo "Building Zions DevKick extension..."
npm run build

echo "Copying manifest and icons to dist..."
cp manifest.json dist/
cp -r public/icons dist/

echo ""
echo "Build complete! Load the extension from: extension/dist/"
echo ""
echo "Steps:"
echo "  1. Open chrome://extensions (or edge://extensions)"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked'"
echo "  4. Select the extension/dist folder"
echo ""
