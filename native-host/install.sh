#!/usr/bin/env bash
# TabPilot Native Host Installer (macOS / Linux)
set -e

HOST_NAME="com.tabpilot.profiles"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_SCRIPT="$SCRIPT_DIR/tabpilot_profiles.py"

echo ""
echo "  TabPilot Native Host Installer"
echo "  ================================"
echo ""

# 1. Make the Python script executable
chmod +x "$HOST_SCRIPT"

# 2. Determine the native messaging hosts directory
if [[ "$OSTYPE" == "darwin"* ]]; then
  NM_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
elif [[ "$OSTYPE" == "linux"* ]]; then
  NM_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
else
  echo "ERROR: Unsupported OS. This installer supports macOS and Linux."
  exit 1
fi

mkdir -p "$NM_DIR"

# 3. Get extension ID
echo "  To find your extension ID:"
echo "    1. Open chrome://extensions in Chrome"
echo "    2. Enable Developer mode (top right toggle)"
echo "    3. Find TabPilot and copy the ID (e.g., abcdefghijklmnop...)"
echo ""
read -p "  Enter your TabPilot extension ID: " EXT_ID

if [ -z "$EXT_ID" ]; then
  echo ""
  echo "  ERROR: Extension ID is required."
  exit 1
fi

# 4. Write the native messaging manifest
cat > "$NM_DIR/$HOST_NAME.json" << EOF
{
  "name": "$HOST_NAME",
  "description": "TabPilot Chrome Profile Manager",
  "path": "$HOST_SCRIPT",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXT_ID/"
  ]
}
EOF

echo ""
echo "  Done! Native messaging host installed at:"
echo "    $NM_DIR/$HOST_NAME.json"
echo ""
echo "  Restart Chrome for changes to take effect."
echo ""
