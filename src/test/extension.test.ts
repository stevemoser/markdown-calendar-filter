import * as assert from 'assert';
import * as vscode from 'vscode';
import { join } from 'path';
suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', async () => {
		// Verify the extension is loaded
		const extension = vscode.extensions.getExtension('markdown-calendar-filter');
		assert.strictEqual(extension !== undefined, true);
	});

	test('Commands should be registered', async () => {
		// Get all registered commands
		const commands = await vscode.commands.getCommands();

		// Check if our commands are registered
		assert.strictEqual(commands.includes('markdownCalendar.selectDate'), true, 'Select date command should be registered');
		assert.strictEqual(commands.includes('markdownCalendar.clearFilter'), true, 'Clear filter command should be registered');
		assert.strictEqual(commands.includes('markdownCalendar.createNoteForDate'), true, 'Create note command should be registered');
		assert.strictEqual(commands.includes('markdownCalendar.openFile'), true, 'Open file command should be registered');
	});
});
