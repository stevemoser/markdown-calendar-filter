import * as assert from 'assert';
import * as vscode from 'vscode';
import { FileTreeViewProvider, FileTreeItem } from '../FileTreeViewProvider';

suite('FileTreeViewProvider Tests', () => {
    let provider: FileTreeViewProvider;

    setup(() => {
        // Create a new provider instance before each test
        const testWorkspacePath = '/fake/workspace/path';
        provider = new FileTreeViewProvider(testWorkspacePath);
    });

    test('FileTreeViewProvider should initialize correctly', () => {
        assert.strictEqual(provider.getTreeItem instanceof Function, true, 'Provider should have getTreeItem method');
        assert.strictEqual(provider.getChildren instanceof Function, true, 'Provider should have getChildren method');
    });

    test('FileTreeItem should have correct properties', () => {
        const testPath = '/test/path/file.md';
        const label = 'Test File';
        const command = {
            title: 'Open File',
            command: 'markdownCalendar.openFile',
            arguments: []
        };

        const treeItem = new FileTreeItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            testPath,
            command
        );

        assert.strictEqual(treeItem.label, label, 'Label should match provided value');
        assert.strictEqual(treeItem.fullPath, testPath, 'Path should be stored correctly');
        assert.strictEqual(treeItem.command?.command, 'markdownCalendar.openFile', 'Should have openFile command');
        assert.strictEqual(treeItem.command?.title, 'Open File', 'Should have correct command title');
    });
});
