import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.test.js',
    launchArgs: [
        '--disable-extensions',
        '--disable-workspace-trust',
        '--disable-gpu',
        '--no-sandbox'
    ],
    // Configure environment for headless testing
    env: {
        DISPLAY: ':99',
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
    }
});
