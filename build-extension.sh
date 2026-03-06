#!/usr/bin/env bash
# =============================================================================
# TabPilot Extension Builder
# Run from /app: bash build-extension.sh
# =============================================================================
set -e

echo "==> Building React app for Chrome Extension..."
cd /app/frontend
PUBLIC_URL="." GENERATE_SOURCEMAP=false yarn build

echo "==> Packaging extension..."
EXT_SIDEPANEL="/app/extension/tabpilot/sidepanel"
JS_FILE=$(ls /app/frontend/build/static/js/main.*.js | xargs basename)
CSS_FILE=$(ls /app/frontend/build/static/css/main.*.css | xargs basename)
echo "    JS:  $JS_FILE"
echo "    CSS: $CSS_FILE"

rm -rf "$EXT_SIDEPANEL/static" "$EXT_SIDEPANEL/asset-manifest.json" "$EXT_SIDEPANEL/index.html"
cp -r /app/frontend/build/static "$EXT_SIDEPANEL/static"
cp /app/frontend/build/asset-manifest.json "$EXT_SIDEPANEL/asset-manifest.json"

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
echo "==> Done! Extension is in /app/extension/tabpilot/"
echo ""
echo "  To install:"
echo "  1. Download /app/extension/tabpilot/ to your computer"
echo "  2. chrome://extensions/ → Developer mode ON → Load unpacked"
echo "  3. Select the 'tabpilot' folder → Ctrl+Shift+E to open"
echo ""
