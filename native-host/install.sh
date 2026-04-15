#!/usr/bin/env bash
# ChromePilot Native Host Installer (macOS / Linux)
# Installs the tiny helper that lets ChromePilot read your Chrome profile
# names so it can show them in the sidepanel and switch between them.
set -e

HOST_NAME="com.tabpilot.profiles"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_SCRIPT="$SCRIPT_DIR/tabpilot_profiles.py"

echo ""
echo "  ChromePilot Native Host Installer"
echo "  ==================================="
echo ""
echo "  This sets up a small helper script so ChromePilot can"
echo "  list and switch between your Chrome profiles."
echo ""

# 1. Make the Python script executable
chmod +x "$HOST_SCRIPT"

# 2. Determine the native messaging hosts directory
if [[ "$OSTYPE" == "darwin"* ]]; then
  NM_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
elif [[ "$OSTYPE" == "linux"* ]]; then
  NM_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
else
  echo "  ERROR: Unsupported OS. This installer supports macOS and Linux."
  exit 1
fi

mkdir -p "$NM_DIR"

# 3. Walk the user through finding their extension ID
echo "  HOW TO FIND YOUR CHROMEPILOT EXTENSION ID"
echo "  -----------------------------------------"
echo ""
echo "    Step 1 — Turn on Developer mode"
echo "      - Open Chrome and go to:  chrome://extensions"
echo "        (paste that URL into the address bar)"
echo "      - In the TOP-RIGHT corner of the page, toggle"
echo "        the \"Developer mode\" switch to ON."
echo "        This reveals the ID under each extension."
echo ""
echo "    Step 2 — Copy the ID"
echo "      - Find the \"ChromePilot\" card in the list."
echo "      - Below the name you'll see a long ID like:"
echo "          ID: nedfbanngcbnicfbpebdopjegjomnman"
echo "      - Highlight and copy it."
echo ""
echo "    Step 3 — Paste it below and press Enter."
echo ""
read -p "  Your ChromePilot extension ID: " EXT_ID

if [ -z "$EXT_ID" ]; then
  echo ""
  echo "  ERROR: Extension ID is required. Re-run this script once you have it."
  exit 1
fi

# Light validation — Chrome extension IDs are 32 lowercase letters a-p
if ! [[ "$EXT_ID" =~ ^[a-p]{32}$ ]]; then
  echo ""
  echo "  WARNING: That doesn't look like a typical Chrome extension ID"
  echo "  (expected 32 lowercase letters a-p). Installing anyway —"
  echo "  if profile loading fails, re-run this script with the correct ID."
  echo ""
fi

# 4. Write the native messaging manifest
cat > "$NM_DIR/$HOST_NAME.json" << EOF
{
  "name": "$HOST_NAME",
  "description": "ChromePilot Chrome Profile Manager",
  "path": "$HOST_SCRIPT",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXT_ID/"
  ]
}
EOF

echo ""
echo "  DONE — Native messaging host installed at:"
echo "    $NM_DIR/$HOST_NAME.json"
echo ""
echo "  NEXT STEPS:"
echo "    1. Quit Chrome completely (Cmd+Q on macOS)."
echo "    2. Re-open Chrome."
echo "    3. Open the ChromePilot sidebar -> Profiles panel."
echo "       Your Chrome profiles should now appear."
echo ""
