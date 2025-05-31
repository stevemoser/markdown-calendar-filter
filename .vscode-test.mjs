import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	reporter: process.env.CI ? 'mocha-junit-reporter' : 'spec',
	reporterOptions: {
		mochaFile: '.vscode-test/test-results.xml'
	}
});
