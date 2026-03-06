#!/usr/bin/env bash
# =============================================================================
# TabPilot Extension Builder
# Builds the React app and packages it into the Chrome extension directory.
# Run from /app: bash build-extension.sh
# =============================================================================
set -e

echo "==> Building React app for Chrome Extension..."
cd /app/frontend

# Build with relative paths (required for Chrome Extension local files)
PUBLIC_URL="." GENERATE_SOURCEMAP=false yarn build

echo "==> Packaging extension..."
EXT_SIDEPANEL="/app/extension/tabpilot/sidepanel"

# Clear previous build artifacts (keep directory)
rm -rf "$EXT_SIDEPANEL/static" "$EXT_SIDEPANEL/asset-manifest.json" "$EXT_SIDEPANEL/index.html"

# Copy the React build output
cp -r /app/frontend/build/static "$EXT_SIDEPANEL/static"
cp /app/frontend/build/asset-manifest.json "$EXT_SIDEPANEL/asset-manifest.json"

# Dynamically get built filenames
JS_FILE=$(ls /app/frontend/build/static/js/main.*.js | xargs basename)
CSS_FILE=$(ls /app/frontend/build/static/css/main.*.css | xargs basename)

echo "==> JS:  $JS_FILE"
echo "==> CSS: $CSS_FILE"

# Create clean extension index.html (no Emergent badge, no PostHog)
cat > "$EXT_SIDEPANEL/index.html" << HTMLEOF
<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>TabPilot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
  <link href="./static/css/${CSS_FILE}" rel="stylesheet"/>
</head>
<body>
  <div id="root"></div>
  <script defer src="./static/js/${JS_FILE}"></script>
</body>
</html>
HTMLEOF

echo ""
echo "==> Extension build complete!"
echo ""
echo "  Extension folder: /app/extension/tabpilot/"
echo ""
echo "==> To install the extension in Chrome:"
echo "  1. Save the /app/extension/tabpilot/ folder to your computer"
echo "  2. Navigate to chrome://extensions/"
echo "  3. Enable 'Developer mode' (top-right toggle)"
echo "  4. Click 'Load unpacked' → select the 'tabpilot' folder"
echo "  5. Press Ctrl+Shift+E (Mac: Cmd+Shift+E) to open the sidebar"
echo ""
echo "  The extension will automatically use real Chrome tabs when installed."
echo "  The web preview at your Emergent URL continues using mock data for demo."
echo ""
