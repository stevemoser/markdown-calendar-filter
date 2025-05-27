import * as vscode from 'vscode';
import * as path from 'path';
// MODIFIED Import: Get NoteEntry from utils
import { NoteEntry } from './utils';
import { notesByDate, onDidChangeFileSystemEmitter } from './extension'; // onDidChangeSelectedDateEmitter is internal to this provider

export class FileTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string, // label is already a property of TreeItem, can omit 'public readonly'
        collapsibleState: vscode.TreeItemCollapsibleState, // same for collapsibleState
        public readonly fullPath: string,
        command?: vscode.Command // MODIFIED: Removed 'public readonly', this is just a constructor param
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.fullPath}`; // Use this.label for the default tooltip if desired
        // Show path relative to workspace for description
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fullPath));
        if (workspaceFolder) {
            this.description = path.dirname(path.relative(workspaceFolder.uri.fsPath, fullPath));
        } else {
            this.description = path.dirname(fullPath); // Fallback if not in workspace (less likely here)
        }
        this.iconPath = new vscode.ThemeIcon('markdown');
        if (command) {
            this.command = command; // Assign to the inherited TreeItem.command property
        }
    }
}

export class FileTreeViewProvider implements vscode.TreeDataProvider<FileTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | null | void> = new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private _selectedDate: string | undefined; // YYYY-MM-DD

    // Emitter for when the selected date changes internally in this provider
    private _internalOnDidChangeSelectedDate: vscode.EventEmitter<string | undefined> = new vscode.EventEmitter<string | undefined>();
    readonly onDidChangeSelectedDate: vscode.Event<string | undefined> = this._internalOnDidChangeSelectedDate.event;


    constructor(private workspaceRoot: string) {
        // Listen to file system changes to refresh
        onDidChangeFileSystemEmitter.event(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setSelectedDate(date: string | undefined): void {
        if (this._selectedDate !== date) {
            this._selectedDate = date;
            this._internalOnDidChangeSelectedDate.fire(this._selectedDate); // Notify listeners (e.g., for context key in extension.ts)
            this.refresh();
        }
    }

    getCurrentSelectedDate(): string | undefined {
        return this._selectedDate;
    }

    getTreeItem(element: FileTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileTreeItem): Thenable<FileTreeItem[]> {
        if (!this.workspaceRoot && !vscode.workspace.workspaceFolders?.length) { // Check current workspace folders too
            // vscode.window.showInformationMessage('No workspace folder open'); // Can be noisy, maybe just return empty
            return Promise.resolve([]);
        }
        const rootPath = this.workspaceRoot || vscode.workspace.workspaceFolders![0].uri.fsPath;


        if (element) {
            return Promise.resolve([]);
        }

        if (this._selectedDate) {
            const notesForDate: NoteEntry[] = notesByDate.get(this._selectedDate) || [];
            const sortedNotes = notesForDate.sort((a, b) =>
                (a.title || path.basename(a.filePath)).localeCompare(b.title || path.basename(b.filePath))
            );

            return Promise.resolve(
                sortedNotes.map(note => {
                    // MODIFIED: Pass command to constructor
                    return new FileTreeItem(
                        note.title || path.basename(note.filePath),
                        vscode.TreeItemCollapsibleState.None,
                        note.filePath,
                        { // Command to open the file
                            command: 'markdownCalendar.openFile',
                            title: 'Open File',
                            arguments: [note.filePath]
                        }
                    );
                })
            );
        }
        return Promise.resolve([]);
    }
}