#!/bin/bash

# MCP Grafana Server - Quick Setup Script
# This script helps you set up the MCP server for your preferred client

set -e

echo "🚀 MCP Grafana Server Setup"
echo "==========================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

if ! command_exists npx; then
    echo "❌ npx is not installed. Please update npm:"
    echo "   npm install -g npm"
    exit 1
fi

# Get Grafana details
echo "📝 Please provide your Grafana details:"
echo ""
read -p "Grafana URL (e.g., https://grafana.example.com): " GRAFANA_URL
read -p "Service Account Token (glsa_...): " -s GRAFANA_TOKEN
echo ""
echo ""

# Validate inputs
if [ -z "$GRAFANA_URL" ] || [ -z "$GRAFANA_TOKEN" ]; then
    echo "❌ Both Grafana URL and token are required."
    exit 1
fi

# Test connection
echo "🔍 Testing connection to Grafana..."
if curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GRAFANA_TOKEN" "$GRAFANA_URL/api/org" | grep -q "200"; then
    echo "✅ Connection successful!"
else
    echo "❌ Failed to connect. Please check your URL and token."
    exit 1
fi
echo ""

# Select client
echo "🤖 Select your MCP client:"
echo ""
echo "1) Claude Desktop"
echo "2) Claude Code (VS Code)"
echo "3) Cursor"
echo "4) Zed"
echo "5) Continue.dev"
echo "6) Windsurf"
echo "7) Custom/Other"
echo ""
read -p "Enter your choice (1-7): " CLIENT_CHOICE

# Function to create config
create_config() {
    local config_path="$1"
    local config_content="$2"
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$config_path")"
    
    # Backup existing config if it exists
    if [ -f "$config_path" ]; then
        echo "📦 Backing up existing config to ${config_path}.backup"
        cp "$config_path" "${config_path}.backup"
    fi
    
    # Write new config
    echo "$config_content" > "$config_path"
    echo "✅ Configuration saved to: $config_path"
}

case $CLIENT_CHOICE in
    1)  # Claude Desktop
        echo "Setting up Claude Desktop..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
            CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
        else
            CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
        fi
        
        CONFIG_CONTENT=$(cat <<EOF
{
  "mcpServers": {
    "grafana": {
      "command": "npx",
      "args": ["@leval/mcp-grafana"],
      "env": {
        "GRAFANA_URL": "$GRAFANA_URL",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "$GRAFANA_TOKEN"
      }
    }
  }
}
EOF
)
        create_config "$CONFIG_PATH" "$CONFIG_CONTENT"
        echo ""
        echo "📌 Next steps:"
        echo "   1. Restart Claude Desktop"
        echo "   2. Look for the 🔌 icon in the chat interface"
        echo "   3. Try asking: 'What dashboards are available in my Grafana?'"
        ;;
        
    2)  # Claude Code (VS Code)
        echo "Setting up Claude Code..."
        
        # Check if in a project directory
        if [ -d ".vscode" ] || [ -f "package.json" ]; then
            echo "📁 Detected project directory. Configure for:"
            echo "1) This project only"
            echo "2) Globally (all projects)"
            read -p "Choice (1-2): " SCOPE_CHOICE
            
            if [ "$SCOPE_CHOICE" = "1" ]; then
                CONFIG_PATH=".vscode/settings.json"
            else
                CONFIG_PATH="$HOME/.config/Code/User/settings.json"
            fi
        else
            CONFIG_PATH="$HOME/.config/Code/User/settings.json"
        fi
        
        CONFIG_CONTENT=$(cat <<EOF
{
  "claude.mcpServers": {
    "grafana": {
      "command": "npx",
      "args": ["@leval/mcp-grafana"],
      "env": {
        "GRAFANA_URL": "$GRAFANA_URL",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "$GRAFANA_TOKEN"
      }
    }
  },
  "claude.enableMCP": true,
  "claude.mcpAutoConnect": true
}
EOF
)
        create_config "$CONFIG_PATH" "$CONFIG_CONTENT"
        echo ""
        echo "📌 Next steps:"
        echo "   1. Open/restart VS Code"
        echo "   2. Open Claude panel (Cmd/Ctrl + Shift + L)"
        echo "   3. Check for MCP connection in status bar"
        ;;
        
    3)  # Cursor
        echo "Setting up Cursor..."
        
        if [ -d ".cursor" ]; then
            CONFIG_PATH=".cursor/settings.json"
        else
            if [[ "$OSTYPE" == "darwin"* ]]; then
                CONFIG_PATH="$HOME/Library/Application Support/Cursor/User/settings.json"
            else
                CONFIG_PATH="$HOME/.config/Cursor/User/settings.json"
            fi
        fi
        
        CONFIG_CONTENT=$(cat <<EOF
{
  "ai.mcpServers": {
    "grafana": {
      "command": "npx",
      "args": ["@leval/mcp-grafana"],
      "env": {
        "GRAFANA_URL": "$GRAFANA_URL",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "$GRAFANA_TOKEN"
      }
    }
  },
  "ai.enableMCP": true,
  "ai.mcpAutoConnect": true
}
EOF
)
        create_config "$CONFIG_PATH" "$CONFIG_CONTENT"
        echo ""
        echo "📌 Next steps:"
        echo "   1. Restart Cursor"
        echo "   2. Press Cmd/Ctrl + K to open AI chat"
        echo "   3. Look for MCP indicator"
        ;;
        
    4)  # Zed
        echo "Setting up Zed..."
        CONFIG_PATH="$HOME/.config/zed/settings.json"
        
        CONFIG_CONTENT=$(cat <<EOF
{
  "assistant": {
    "version": "2",
    "mcp_servers": {
      "grafana": {
        "command": "npx",
        "args": ["@leval/mcp-grafana"],
        "env": {
          "GRAFANA_URL": "$GRAFANA_URL",
          "GRAFANA_SERVICE_ACCOUNT_TOKEN": "$GRAFANA_TOKEN"
        }
      }
    },
    "enabled": true
  }
}
EOF
)
        create_config "$CONFIG_PATH" "$CONFIG_CONTENT"
        echo ""
        echo "📌 Next steps:"
        echo "   1. Restart Zed"
        echo "   2. Open Assistant (Cmd/Ctrl + ?)"
        echo "   3. MCP will connect automatically"
        ;;
        
    5)  # Continue.dev
        echo "Setting up Continue.dev..."
        CONFIG_PATH="$HOME/.continue/config.json"
        
        CONFIG_CONTENT=$(cat <<EOF
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20240620",
      "apiKey": "YOUR_ANTHROPIC_API_KEY"
    }
  ],
  "mcpServers": {
    "grafana": {
      "command": "npx",
      "args": ["@leval/mcp-grafana"],
      "env": {
        "GRAFANA_URL": "$GRAFANA_URL",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "$GRAFANA_TOKEN"
      }
    }
  }
}
EOF
)
        create_config "$CONFIG_PATH" "$CONFIG_CONTENT"
        echo ""
        echo "⚠️  Remember to add your Anthropic API key to the config!"
        echo ""
        echo "📌 Next steps:"
        echo "   1. Open Continue panel in your IDE"
        echo "   2. Add your API key"
        echo "   3. Restart IDE"
        ;;
        
    6)  # Windsurf
        echo "Setting up Windsurf..."
        
        if [ -d ".windsurf" ]; then
            CONFIG_PATH=".windsurf/mcp-servers.json"
        else
            CONFIG_PATH="$HOME/.windsurf/config/mcp-servers.json"
        fi
        
        CONFIG_CONTENT=$(cat <<EOF
{
  "grafana": {
    "command": "npx",
    "args": ["@leval/mcp-grafana"],
    "env": {
      "GRAFANA_URL": "$GRAFANA_URL",
      "GRAFANA_SERVICE_ACCOUNT_TOKEN": "$GRAFANA_TOKEN"
    },
    "autoStart": true,
    "restartOnFailure": true
  }
}
EOF
)
        create_config "$CONFIG_PATH" "$CONFIG_CONTENT"
        echo ""
        echo "📌 Next steps:"
        echo "   1. Restart Windsurf"
        echo "   2. Check Cascade AI panel"
        echo "   3. MCP will connect automatically"
        ;;
        
    7)  # Custom
        echo ""
        echo "📋 Manual Configuration:"
        echo ""
        echo "Add this to your MCP client configuration:"
        echo ""
        cat <<EOF
{
  "grafana": {
    "command": "npx",
    "args": ["@leval/mcp-grafana"],
    "env": {
      "GRAFANA_URL": "$GRAFANA_URL",
      "GRAFANA_SERVICE_ACCOUNT_TOKEN": "$GRAFANA_TOKEN"
    }
  }
}
EOF
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Additional Resources:"
echo "   - Full documentation: https://github.com/leval-ai/mcp-grafana"
echo "   - Client guide: ./MCP-CLIENT-GUIDE.md"
echo "   - Report issues: https://github.com/leval-ai/mcp-grafana/issues"
echo ""

# Test the MCP server
echo "🧪 Would you like to test the MCP server now? (y/n)"
read -p "> " TEST_CHOICE

if [ "$TEST_CHOICE" = "y" ] || [ "$TEST_CHOICE" = "Y" ]; then
    echo ""
    echo "Testing MCP server..."
    GRAFANA_URL="$GRAFANA_URL" GRAFANA_SERVICE_ACCOUNT_TOKEN="$GRAFANA_TOKEN" npx @leval/mcp-grafana --debug &
    SERVER_PID=$!
    
    sleep 3
    
    if ps -p $SERVER_PID > /dev/null; then
        echo "✅ MCP server is running successfully!"
        echo "   Press Ctrl+C to stop the test"
        wait $SERVER_PID
    else
        echo "❌ MCP server failed to start. Check the configuration."
    fi
fi

echo ""
echo "Thank you for using MCP Grafana Server! 🚀"