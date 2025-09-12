# Publishing @leval/mcp-grafana to npm

## Package Status
✅ **Package is ready for publishing!**
- Package name: `@leval/mcp-grafana`
- Version: 1.0.0
- Bundle size: 44KB (compressed)
- Unpacked size: 250.3KB

## Pre-publish Checklist
- ✅ TypeScript compiled successfully
- ✅ Package.json configured
- ✅ .npmignore file created
- ✅ Test package created (leval-mcp-server-1.0.0.tgz)
- ✅ README.md included
- ✅ LICENSE file exists

## Publishing Instructions

### 1. First-time Setup (if not already logged in to npm)
```bash
# Login to npm (you'll need an npm account)
npm login
# Enter your npm username, password, and email
```

### 2. Verify Package Ownership
Since this is a scoped package (@leval), ensure you have access to the @leval organization on npm:
```bash
# Check if you're part of the @leval org
npm org ls @leval
```

If the @leval organization doesn't exist, you'll need to:
1. Create it on npmjs.com
2. Or publish under your personal scope (e.g., @yourusername/mcp-server)

### 3. Dry Run (Recommended)
Test what will be published without actually publishing:
```bash
npm publish --dry-run
```

### 4. Publish to npm
```bash
# Publish publicly (required for scoped packages)
npm publish --access public
```

### 5. Verify Publication
After publishing, verify the package is available:
```bash
# Check package info
npm view @leval/mcp-grafana

# Test installation
npx @leval/mcp-grafana --version
```

## Alternative: Publish Under Different Scope

If you don't have access to @leval organization, you can publish under your personal scope:

1. Update package.json:
```json
{
  "name": "@yourusername/mcp-server",
  ...
}
```

2. Rebuild and republish:
```bash
npm run build
npm pack
npm publish --access public
```

## Post-Publish Steps

1. **Create a Git Tag**:
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **Create GitHub Release**:
- Go to https://github.com/leval-ai/mcp-grafana/releases
- Click "Create a new release"
- Choose tag v1.0.0
- Add release notes

3. **Update Documentation**:
- Update any installation instructions to use the npm package
- Add npm badge to README if not already present

## Troubleshooting

### Error: "You do not have permission to publish"
- Ensure you're logged in: `npm whoami`
- Check organization access: `npm org ls @leval`
- Consider publishing under personal scope

### Error: "Package name too similar to existing packages"
- npm might reject if name is too similar to existing packages
- Consider alternative names like:
  - @leval/grafana-mcp
  - @leval/mcp-grafana-server
  - @leval/grafana-mcp-server

### Error: "Cannot publish over previously published version"
- Bump version in package.json: `npm version patch`
- Rebuild: `npm run build`
- Republish: `npm publish --access public`

## Version Management

For future updates:
```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Then rebuild and publish
npm run build
npm publish
```

## Security Notes

- Never commit .env files with real tokens
- Use npm 2FA for additional security
- Regularly rotate Grafana service account tokens
- Consider using npm automation tokens for CI/CD

---

Package is ready to publish! Follow the steps above to make it available on npm.