import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { notesByDate } from './extension'; // Import the shared map

export class CalendarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'markdownCalendarView';
    private _view?: vscode.WebviewView;
    private _currentFilteredDate?: string; // YYYY-MM-DD, for the main filter
    private _currentHighlightedDate?: string; // YYYY-MM-DD, for the active editor's date

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _getNotesByDate: () => Map<string, any[]>
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'webview')]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'dateSelected':
                    {
                        vscode.commands.executeCommand('markdownCalendar.selectDate', data.value);
                        //this._currentSelectedDate = data.value; // Store for re-rendering
                        // We might not need to re-render the whole calendar just for selection,
                        // the webview JS can handle highlighting.
                        // But if other state changes, call this:
                        // this.updateCalendarView();
                        break;
                    }
                case 'getInitialData': // Webview requests initial data
                    this.updateCalendarViewData();
                    break;
                case 'navigateToMonth': // Example for month navigation
                    // You'd handle month/year changes here and call updateCalendarView
                    console.log("Navigate to month (not implemented yet):", data.direction);
                    // This would typically involve updating some state (currentDisplayMonth/Year)
                    // and then calling updateCalendarView.
                    break;

            }
        });

        // If the view becomes visible again, refresh it
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.updateCalendarViewData();
            }
        });
    }

    public updateCalendarViewData() {
        if (this._view) {
            const allNoteDates = Array.from(this._getNotesByDate().keys());
            this._view.webview.postMessage({
                type: 'updateData',
                datesWithNotes: allNoteDates,
                selectedDate: this._currentFilteredDate, // Send the main filter selection
                highlightedDate: this._currentHighlightedDate // Send the active editor highlight
                // You'll also need to send current displayMonth and displayYear for the calendar logic
            });
        }
    }

    public setSelectedDateInCalendar(date?: string) {
        this._currentFilteredDate = date;
        // If a date is explicitly selected, it usually also becomes the highlighted one
        // unless you want separate logic. For now, let's make them coincide.
        this._currentHighlightedDate = date;
        if (this._view) {
            this._view.webview.postMessage({
                type: 'setSelectionAndHighlight', // New message type for webview
                selectedDate: this._currentFilteredDate,
                highlightedDate: this._currentHighlightedDate
            });
        }
    }

    public highlightDateInCalendar(date?: string) {
        this._currentHighlightedDate = date;
        if (this._view) {
            // Only update the highlight, not the main selection (filter)
            this._view.webview.postMessage({ type: 'setHighlight', date: this._currentHighlightedDate });
        }
    }

        // For createNoteForDate to get context
    public getCurrentHighlightedDate(): string | undefined {
        return this._currentHighlightedDate;
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get paths to resources on disk
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'webview', 'calendar.js');
        const stylePathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'webview', 'calendar.css');
        const htmlPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'webview', 'calendar.html');

        // And get the special URI to use with the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        const styleUri = webview.asWebviewUri(stylePathOnDisk);

        let htmlContent = fs.readFileSync(htmlPathOnDisk.fsPath, 'utf8');

        // Replace placeholders for CSP and resource URIs
        htmlContent = htmlContent.replace(/\${cspSource}/g, webview.cspSource);
        htmlContent = htmlContent.replace(/\${styleUri}/g, styleUri.toString());
        htmlContent = htmlContent.replace(/\${scriptUri}/g, scriptUri.toString());

        return htmlContent;
    }
}