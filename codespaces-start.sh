#!/bin/bash
# ==============================================================================
# Aegis Core — GitHub Codespaces Minecraft Java & Web Dashboard Startup Script
# ==============================================================================

set -e

echo "========================================================"
echo "  ⚔ Aegis Core — Minecraft Server & Dashboard Launcher  "
echo "========================================================"

# 1. Check for Java 17/21
if ! command -v java &> /dev/null; then
    echo "⚙ Java not detected. Installing OpenJDK 21 (JRE Headless)..."
    sudo apt-get update -qq && sudo apt-get install -y openjdk-21-jre-headless
fi

echo "✔ Java version: $(java -version 2>&1 | head -n 1)"

# 2. Check Minecraft Server Directory
SERVER_DIR="${MINECRAFT_SERVER_DIR:-./minecraft}"
mkdir -p "$SERVER_DIR"

# 3. Ensure EULA is accepted
if [ ! -f "$SERVER_DIR/eula.txt" ]; then
    echo "eula=true" > "$SERVER_DIR/eula.txt"
    echo "✔ Created $SERVER_DIR/eula.txt (eula=true)"
fi

# 4. Ensure RCON is enabled in server.properties
PROP_FILE="$SERVER_DIR/server.properties"
RCON_PASS="${RCON_PASSWORD:-AegisSecureRcon2026}"

if [ ! -f "$PROP_FILE" ]; then
    echo "⚙ Generating default server.properties with RCON enabled..."
    cat << EOF > "$PROP_FILE"
# Minecraft Server Properties for Codespaces
server-port=25565
server-ip=0.0.0.0
motd=\u00A7a\u2694 \u00A7lMinecraft Java Server \u00A77[Codespaces]
max-players=20
gamemode=survival
difficulty=normal
pvp=true
allow-flight=false
view-distance=10
simulation-distance=8
online-mode=true
enable-rcon=true
rcon.port=25575
rcon.password=$RCON_PASS
broadcast-rcon-to-ops=true
enable-command-block=true
level-name=world
EOF
    echo "✔ Created $PROP_FILE with RCON on port 25575"
else
    # Ensure enable-rcon=true
    if ! grep -q "enable-rcon=true" "$PROP_FILE"; then
        echo "enable-rcon=true" >> "$PROP_FILE"
    fi
    if ! grep -q "rcon.port" "$PROP_FILE"; then
        echo "rcon.port=25575" >> "$PROP_FILE"
    fi
    if ! grep -q "rcon.password" "$PROP_FILE"; then
        echo "rcon.password=$RCON_PASS" >> "$PROP_FILE"
    fi
    echo "✔ Verified RCON settings in $PROP_FILE"
fi

# 5. Download Paper/Purpur/Fabric if no server jar exists
if [ ! -f "$SERVER_DIR/server.jar" ]; then
    echo "⚙ No server.jar found in $SERVER_DIR. Downloading Paper 1.20.4..."
    curl -o "$SERVER_DIR/server.jar" "https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/498/downloads/paper-1.20.4-498.jar" || {
        echo "⚠ Could not download automatically. Please place your server.jar in $SERVER_DIR/"
    }
fi

# 6. Export Environment Variables for Aegis Web Dashboard
export MINECRAFT_HOST="127.0.0.1"
export MINECRAFT_PORT="25565"
export RCON_PORT="25575"
export RCON_PASSWORD="$RCON_PASS"
export MINECRAFT_SERVER_DIR="$SERVER_DIR"
export START_COMMAND="java -Xms2G -Xmx4G -jar server.jar nogui"

echo "========================================================"
echo "✔ Environment ready:"
echo "  - Minecraft Host: 127.0.0.1:25565"
echo "  - RCON Port: 25575 (Password: $RCON_PASS)"
echo "  - Server Directory: $SERVER_DIR"
echo "  - Dashboard Port: 3000"
echo "========================================================"

# 7. Start Minecraft Server in background if requested or start Web Dashboard
echo "To start both simultaneously:"
echo "  1) Start Minecraft Server: cd $SERVER_DIR && java -Xms2G -Xmx4G -jar server.jar nogui"
echo "  2) Start Web Dashboard in another terminal: npm run dev"
echo "========================================================"
