#!/bin/bash

# Publish script for @leval/mcp-grafana
# This script will guide you through publishing the package to npm

set -e

echo "📦 Publishing @leval/mcp-grafana to npm"
echo "========================================"
echo ""

# Check if user is logged in to npm
echo "Checking npm login status..."
NPM_USER=$(npm whoami 2>/dev/null || echo "")

if [ -z "$NPM_USER" ]; then
    echo "❌ You are not logged in to npm"
    echo ""
    echo "Please login first:"
    echo "  npm login"
    echo ""
    echo "After logging in, run this script again."
    exit 1
fi

echo "✅ Logged in as: $NPM_USER"
echo ""

# Check if the package already exists
echo "Checking if package exists on npm..."
EXISTING_VERSION=$(npm view @leval/mcp-grafana version 2>/dev/null || echo "")

if [ -n "$EXISTING_VERSION" ]; then
    echo "⚠️  Package already exists with version: $EXISTING_VERSION"
    echo ""
    echo "Current local version: 1.0.0"
    echo ""
    echo "You need to bump the version to publish an update."
    echo "Would you like to bump the version? (patch/minor/major/no)"
    read -p "> " BUMP_CHOICE
    
    case $BUMP_CHOICE in
        patch)
            npm version patch
            ;;
        minor)
            npm version minor
            ;;
        major)
            npm version major
            ;;
        no)
            echo "Continuing with current version (may fail if already published)"
            ;;
        *)
            echo "Invalid choice. Exiting."
            exit 1
            ;;
    esac
fi

# Build the project
echo ""
echo "Building the project..."
npm run build

# Create package
echo ""
echo "Creating package..."
npm pack

# Show package details
echo ""
echo "Package details:"
echo "----------------"
ls -lh *.tgz | tail -1

# Dry run
echo ""
echo "Running dry run to verify package contents..."
npm publish --dry-run --access public

echo ""
echo "📋 Pre-publish checklist:"
echo "  ✅ Build completed"
echo "  ✅ Package created"
echo "  ✅ Dry run successful"
echo ""
echo "Ready to publish to npm!"
echo ""
echo "⚠️  Warning: Publishing is permanent and cannot be undone!"
echo ""
read -p "Do you want to publish @leval/mcp-grafana to npm? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Publishing cancelled."
    exit 0
fi

# Publish the package
echo ""
echo "Publishing to npm..."
npm publish --access public

# Verify publication
echo ""
echo "Verifying publication..."
sleep 5
PUBLISHED_VERSION=$(npm view @leval/mcp-grafana version 2>/dev/null || echo "")

if [ -n "$PUBLISHED_VERSION" ]; then
    echo ""
    echo "🎉 Success! Package published to npm"
    echo "   Package: @leval/mcp-grafana"
    echo "   Version: $PUBLISHED_VERSION"
    echo "   URL: https://www.npmjs.com/package/@leval/mcp-grafana"
    echo ""
    echo "Users can now install it with:"
    echo "   npm install -g @leval/mcp-grafana"
    echo "   npx @leval/mcp-grafana"
    echo ""
    
    # Create git tag
    echo "Creating git tag..."
    git tag -a "v$PUBLISHED_VERSION" -m "Release v$PUBLISHED_VERSION"
    echo "Don't forget to push the tag: git push origin v$PUBLISHED_VERSION"
else
    echo "⚠️  Could not verify publication. Please check manually:"
    echo "   npm view @leval/mcp-grafana"
fi

echo ""
echo "✅ Publishing complete!"