import * as vscode from 'vscode';
import { CalendarViewProvider } from './CalendarViewProvider';
import { FileTreeViewProvider, FileTreeItem } from './FileTreeViewProvider';
import { parseDateFromFrontmatter, getNotesByDate, NoteEntry } from './utils';
import * as path from 'path';
import * as fs from 'fs/promises'; // For Node.js 14+ fs promises
import * as yaml from 'js-yaml'; // Import yaml here for the active editor logic


export let notesByDate: Map<string, NoteEntry[]> = new Map();
// DECLARE activeEditorListener at the module level
let activeEditorListener: vscode.Disposable | undefined;

export const onDidChangeFileSystemEmitter = new vscode.EventEmitter<void>();

// Helper function for active editor logic to avoid repetition
async function handleActiveEditorChange(editor: vscode.TextEditor | undefined, calendarProvider: CalendarViewProvider) {
    if (editor && editor.document.languageId === 'markdown') {
        const filePath = editor.document.uri.fsPath;
        console.log('Active editor changed to markdown file:', filePath);

        try {
            // Use editor.document.getText() for currently open files, it's faster
            const content = editor.document.getText();

            const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
            const frontmatterStr = frontmatterMatch ? frontmatterMatch[1] : null;

            let activeFileDate: string | null = null;
            if (frontmatterStr) {
                const frontmatter = yaml.load(frontmatterStr) as any;
                const dateFields = vscode.workspace.getConfiguration('markdownCalendar')
                                     .get<string[]>('frontmatterDateFields', ['date', 'timestamp', 'publishdate']);
                if (frontmatter && typeof frontmatter === 'object') {
                    for (const field of dateFields) {
                        if (frontmatter[field]) {
                            activeFileDate = parseDateFromFrontmatter(frontmatter[field]);
                            if (activeFileDate) break;
                        }
                    }
                }
            }

            if (activeFileDate) {
                console.log(`Active file has date: ${activeFileDate}`);
                calendarProvider.highlightDateInCalendar(activeFileDate); // Renamed for clarity
            } else {
                calendarProvider.highlightDateInCalendar(undefined);
            }

        } catch (error) {
            console.error("Error processing active editor change:", error);
            calendarProvider.highlightDateInCalendar(undefined);
        }
    } else {
        calendarProvider.highlightDateInCalendar(undefined);
    }
}


export async function activate(context: vscode.ExtensionContext) {
    console.log('Markdown Calendar Filter is now active!');

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage("Markdown Calendar: No workspace open.");
        return;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    const calendarProvider = new CalendarViewProvider(context.extensionUri, () => notesByDate);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CalendarViewProvider.viewType, calendarProvider)
    );

    const fileTreeViewProvider = new FileTreeViewProvider(workspaceRoot);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('markdownCalendarFilteredFilesView', fileTreeViewProvider)
    );
    fileTreeViewProvider.onDidChangeSelectedDate((date: string | undefined) => {
        vscode.commands.executeCommand('setContext', 'markdownCalendar.dateSelected', !!date);
        calendarProvider.setSelectedDateInCalendar(date); // Method to tell calendar to visually select and potentially navigate
    });

    const scanWorkspaceFiles = async () => {
        // ... (scanWorkspaceFiles implementation)
        console.log("Scanning workspace for markdown files...");
        const newNotesByDate = await getNotesByDate(workspaceRoot);
        notesByDate = newNotesByDate;
        calendarProvider.updateCalendarViewData(); // Renamed for clarity
        onDidChangeFileSystemEmitter.fire();
        console.log(`Scan complete. Found notes for ${notesByDate.size} dates.`);

        // After scanning, also update highlight for current active editor
        if (vscode.window.activeTextEditor) {
            await handleActiveEditorChange(vscode.window.activeTextEditor, calendarProvider);
        }
    };

    await scanWorkspaceFiles();

    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.md');
    // ... (fileWatcher listeners calling scanWorkspaceFiles) ...
    fileWatcher.onDidChange(async uri => {
        console.log(`File changed: ${uri.fsPath}`);
        await scanWorkspaceFiles();
    });
    fileWatcher.onDidCreate(async uri => {
        console.log(`File created: ${uri.fsPath}`);
        await scanWorkspaceFiles();
    });
    fileWatcher.onDidDelete(async uri => {
        console.log(`File deleted: ${uri.fsPath}`);
        await scanWorkspaceFiles();
    });
    context.subscriptions.push(fileWatcher);


    // --- Active Editor Change Listener ---
    // INITIALIZE activeEditorListener here
    activeEditorListener = vscode.window.onDidChangeActiveTextEditor(async editor => {
        await handleActiveEditorChange(editor, calendarProvider);
    });
    context.subscriptions.push(activeEditorListener);

    // Initial check for currently active editor when extension loads
    if (vscode.window.activeTextEditor) {
        await handleActiveEditorChange(vscode.window.activeTextEditor, calendarProvider);
    }

    // --- Commands ---
    // ... (your commands: selectDate, clearFilter, openFile, createNoteForDate) ...
    context.subscriptions.push(vscode.commands.registerCommand('markdownCalendar.selectDate', (dateString: string) => {
        console.log('Date selected from calendar:', dateString);
        fileTreeViewProvider.setSelectedDate(dateString);
        vscode.commands.executeCommand('setContext', 'markdownCalendar.dateSelected', true);
        calendarProvider.setSelectedDateInCalendar(dateString); // Also tell calendar webview to update its own selection visual
        vscode.commands.executeCommand('markdownCalendarFilteredFilesView.focus');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('markdownCalendar.clearFilter', () => {
        fileTreeViewProvider.setSelectedDate(undefined);
        vscode.commands.executeCommand('setContext', 'markdownCalendar.dateSelected', false);
        calendarProvider.setSelectedDateInCalendar(undefined);
    }));

    // ... (openFile command is fine)
    context.subscriptions.push(vscode.commands.registerCommand('markdownCalendar.openFile', (filePath: string) => {
        const openPath = vscode.Uri.file(filePath);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }));


    context.subscriptions.push(vscode.commands.registerCommand('markdownCalendar.createNoteForDate', async () => {
        // ... (createNoteForDate implementation)
        let targetDate: Date;
        const currentFilterDate = fileTreeViewProvider.getCurrentSelectedDate();
        const currentHighlightedDate = calendarProvider.getCurrentHighlightedDate(); // Need this method in CalendarProvider

        if (currentFilterDate) { // Prioritize explicitly selected filter date
            targetDate = new Date(currentFilterDate + 'T12:00:00Z');
        } else if (currentHighlightedDate) { // Then date of active editor if no filter
            targetDate = new Date(currentHighlightedDate + 'T12:00:00Z');
        } else { // Fallback to today
            targetDate = new Date();
        }

        const year = targetDate.getUTCFullYear();
        const month = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = targetDate.getUTCDate().toString().padStart(2, '0');
        const dateForFrontmatter = `${year}-${month}-${day}`;

        const config = vscode.workspace.getConfiguration('markdownCalendar');
        const notesDirConfig = config.get<string>('notesDirectory') || '';
        const filenamePattern = config.get<string>('newNoteFilenamePattern') || 'YYYY-MM-DD-untitled.md';

        const newFileName = filenamePattern
            .replace('YYYY', year.toString())
            .replace('MM', month)
            .replace('DD', day);

        const notesDirPath = path.join(workspaceRoot, notesDirConfig);

        try {
            await fs.mkdir(notesDirPath, { recursive: true });
        } catch (e) {
            console.error("Failed to create notes directory:", e);
            vscode.window.showErrorMessage("Failed to create notes directory. Check console.");
            return;
        }

        let finalFilePath = path.join(notesDirPath, newFileName);
        let counter = 1;
        const ext = path.extname(newFileName);
        const base = path.basename(newFileName, ext);

        while (true) {
            try {
                await fs.access(finalFilePath);
                finalFilePath = path.join(notesDirPath, `${base}-${counter}${ext}`);
                counter++;
            } catch (e) {
                break;
            }
        }

        const frontmatter = `---
date: ${dateForFrontmatter}
title: Untitled
---

# New Note for ${dateForFrontmatter}

`;
        await fs.writeFile(finalFilePath, frontmatter);
        const doc = await vscode.workspace.openTextDocument(finalFilePath);
        await vscode.window.showTextDocument(doc);
        // No need to call scanWorkspaceFiles here, fileWatcher will pick it up.
        // await scanWorkspaceFiles();
    }));


    vscode.commands.executeCommand('setContext', 'markdownCalendar.dateSelected', false);
}

export function deactivate() {
    if (activeEditorListener) {
        activeEditorListener.dispose();
    }
    // Dispose other disposables if they are module-level and not in context.subscriptions
}