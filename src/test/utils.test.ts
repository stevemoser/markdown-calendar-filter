import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseDateFromFrontmatter, NoteEntry, getNotesByDate } from '../utils';

suite('Utility Function Tests', () => {
    test('parseDateFromFrontmatter should handle date objects', () => {
        const date = new Date('2023-05-15T12:00:00Z');
        const result = parseDateFromFrontmatter(date);
        assert.strictEqual(result, '2023-05-15');
    });

    test('parseDateFromFrontmatter should handle ISO date strings', () => {
        const result = parseDateFromFrontmatter('2023-05-15T12:00:00Z');
        assert.strictEqual(result, '2023-05-15');
    });

    test('parseDateFromFrontmatter should handle simple date strings', () => {
        const result = parseDateFromFrontmatter('2023-05-15');
        assert.strictEqual(result, '2023-05-15');
    });

    test('parseDateFromFrontmatter should handle numeric timestamps', () => {
        // May 15, 2023 timestamp
        const timestamp = 1684152000000;
        const result = parseDateFromFrontmatter(timestamp);
        assert.strictEqual(result, '2023-05-15');
    });

    test('parseDateFromFrontmatter should return null for invalid dates', () => {
        const result = parseDateFromFrontmatter('not a date');
        assert.strictEqual(result, null);
    });

    test('parseDateFromFrontmatter should return null for null/undefined input', () => {
        assert.strictEqual(parseDateFromFrontmatter(null), null);
        assert.strictEqual(parseDateFromFrontmatter(undefined), null);
    });

    // Test for getNotesByDate - note that this will be skipped in CI environments
    // because it requires a real filesystem and workspace
    (process.env.CI ? test.skip : test)('getNotesByDate should find markdown files with dates', async function () {
        this.timeout(10000); // Give it enough time for filesystem operations

        // Create a test workspace folder
        const workspaceRoot = path.join(__dirname, 'fixtures');

        // Ensure the fixtures directory exists
        if (!fs.existsSync(workspaceRoot)) {
            fs.mkdirSync(workspaceRoot, { recursive: true });
        }

        // Call the function
        const result = await getNotesByDate(workspaceRoot);

        // Verify results
        assert.strictEqual(result instanceof Map, true, 'Result should be a Map');
        assert.strictEqual(result.has('2023-05-15'), true, 'Should find 2023-05-15 date');
        assert.strictEqual(result.has('2023-06-22'), true, 'Should find 2023-06-22 date');
        assert.strictEqual(result.has('2023-07-10'), true, 'Should find 2023-07-10 date');

        // Check specific files
        const may15Entries = result.get('2023-05-15') || [];
        const june22Entries = result.get('2023-06-22') || [];
        const july10Entries = result.get('2023-07-10') || [];

        assert.strictEqual(may15Entries.length > 0, true, 'Should have entries for May 15');
        assert.strictEqual(june22Entries.length > 0, true, 'Should have entries for June 22');
        assert.strictEqual(july10Entries.length > 0, true, 'Should have entries for July 10');

        // Check content of entries
        const may15Entry = may15Entries[0];
        assert.strictEqual(may15Entry.title, 'Test Document', 'Should extract correct title');
        assert.strictEqual(may15Entry.date, '2023-05-15', 'Should have correct date');
        assert.strictEqual(path.basename(may15Entry.filePath), 'test-document.md', 'Should reference correct file');
    });
});
