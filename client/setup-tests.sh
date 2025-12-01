#!/bin/bash

# Test Data Setup Script
# This script sets up test data for Playwright tests

set -e

echo "🚀 Setting up test environment for NEGCES Lab Tracking System"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: This script must be run from the client directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🎭 Installing Playwright browsers...${NC}"
npx playwright install

echo -e "${YELLOW}📋 Creating test environment file...${NC}"
cat > .env.test << EOF
# Test Environment Configuration
VITE_API_URL=http://localhost:5001/api
VITE_FIREBASE_API_KEY=test-key
VITE_FIREBASE_AUTH_DOMAIN=negces-test.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=negces-test
VITE_FIREBASE_STORAGE_BUCKET=negces-test.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:test
PLAYWRIGHT_BASE_URL=http://localhost:5173
NODE_ENV=test
EOF

echo -e "${GREEN}✅ Test environment file created: .env.test${NC}"

echo -e "${YELLOW}📁 Creating test directories...${NC}"
mkdir -p test-results/screenshots
mkdir -p playwright-report

echo -e "${YELLOW}🔧 Setting up git hooks (optional)...${NC}"
if command -v git &> /dev/null && [ -d ".git" ]; then
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Run Playwright tests before commit (if PLAYWRIGHT_PRE_COMMIT is set)
if [ "$PLAYWRIGHT_PRE_COMMIT" = "true" ]; then
    echo "Running Playwright tests..."
    npm run test:ci
    if [ $? -ne 0 ]; then
        echo "Tests failed. Commit aborted."
        exit 1
    fi
fi
EOF
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ Git pre-commit hook created${NC}"
fi

echo -e "${YELLOW}📝 Creating VS Code settings...${NC}"
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
    "playwright.testDir": "./tests",
    "playwright.configFile": "./playwright.config.ts",
    "typescript.preferences.includePackageJsonAutoImports": "off",
    "files.exclude": {
        "**/test-results": true,
        "**/playwright-report": true
    }
}
EOF

cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Playwright Tests",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/node_modules/.bin/playwright",
            "args": ["test", "--debug"],
            "cwd": "${workspaceFolder}",
            "env": {
                "NODE_ENV": "test"
            }
        }
    ]
}
EOF

echo -e "${GREEN}✅ VS Code configuration created${NC}"

echo -e "${YELLOW}📊 Creating test scripts...${NC}"
cat > scripts/test-setup.js << 'EOF'
// Test setup script
const { execSync } = require('child_process');
const path = require('path');

console.log('Setting up test environment...');

// Check if server is running
try {
    const response = execSync('curl -s http://localhost:5001/api', { timeout: 5000 });
    console.log('✅ Server is running');
} catch (error) {
    console.log('❌ Server is not running. Please start the server first.');
    console.log('Run: cd ../server && npm start');
    process.exit(1);
}

// Check if client dev server is running
try {
    const response = execSync('curl -s http://localhost:5173', { timeout: 5000 });
    console.log('✅ Client dev server is running');
} catch (error) {
    console.log('❌ Client dev server is not running. Please start it first.');
    console.log('Run: npm run dev');
    process.exit(1);
}

console.log('✅ Test environment is ready!');
EOF

mkdir -p scripts
chmod +x scripts/test-setup.js

echo -e "${YELLOW}🧪 Running a quick test to verify setup...${NC}"
if npx playwright test --list > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Playwright configuration is valid${NC}"
else
    echo -e "${RED}❌ Playwright configuration has issues${NC}"
    npx playwright test --list
fi

echo -e "${GREEN}🎉 Test setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start the backend server: cd ../server && npm start"
echo "2. Start the frontend dev server: npm run dev"
echo "3. Run tests: npm test"
echo ""
echo -e "${YELLOW}Available commands:${NC}"
echo "  npm test              - Run all tests"
echo "  npm run test:ui       - Run tests with UI"
echo "  npm run test:headed   - Run tests with browser visible"
echo "  npm run test:debug    - Debug tests"
echo "  npm run test:codegen  - Generate test code"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  📖 Testing guide: ./TESTING.md"
echo "  📋 Testing plan: ../Testing-Plan.md"
echo "  🔧 Playwright config: ./playwright.config.ts"
echo ""
echo -e "${GREEN}Happy testing! 🎭${NC}"
