import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
// import * as fs from 'fs/promises'; // Already imported in extension.ts, vscode.workspace.fs preferred
import * as path from 'path';

// ADD export HERE
export interface NoteEntry {
    filePath: string;
    title?: string;
    date: string; // YYYY-MM-DD
}

// Extracts the YAML frontmatter block from markdown content (keep as internal helper)
function extractFrontmatter(content: string): string | null {
    const match = content.match(/^---\s*([\s\S]*?)\s*---/);
    return match ? match[1] : null;
}

// ADD export HERE
// Parses a date string from various potential formats found in frontmatter
export function parseDateFromFrontmatter(dateValue: any): string | null {
    if (!dateValue) return null;

    let dateObj: Date | null = null;

    if (dateValue instanceof Date) {
        dateObj = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) {
            dateObj = d;
        }
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
        const year = dateObj.getUTCFullYear();
        const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return null;
}

// ADD export HERE
export async function getNotesByDate(workspaceRoot: string): Promise<Map<string, NoteEntry[]>> {
    const newNotesByDate = new Map<string, NoteEntry[]>();
    const config = vscode.workspace.getConfiguration('markdownCalendar');
    const markdownExtensions = config.get<string[]>('markdownFileExtensions', ['.md', '.markdown']); // Add config for this
    const globPattern = `**/*{${markdownExtensions.join(',')}}`;

    const markdownFiles = await vscode.workspace.findFiles(globPattern, '**/node_modules/**');
    const dateFields = config.get<string[]>('frontmatterDateFields', ['date', 'timestamp', 'publishdate']);

    for (const fileUri of markdownFiles) {
        try {
            const contentBytes = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(contentBytes).toString('utf8');
            const frontmatterStr = extractFrontmatter(content);

            if (frontmatterStr) {
                const frontmatter = yaml.load(frontmatterStr) as any; // Use `unknown` then type assertion or guard
                if (frontmatter && typeof frontmatter === 'object') {
                    let parsedDate: string | null = null;
                    for (const field of dateFields) {
                        if (frontmatter[field]) {
                            parsedDate = parseDateFromFrontmatter(frontmatter[field]);
                            if (parsedDate) break;
                        }
                    }

                    if (parsedDate) {
                        const notesForThisDate = newNotesByDate.get(parsedDate) || [];
                        notesForThisDate.push({
                            filePath: fileUri.fsPath,
                            title: frontmatter.title || path.basename(fileUri.fsPath),
                            date: parsedDate
                        });
                        newNotesByDate.set(parsedDate, notesForThisDate);
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing file ${fileUri.fsPath}:`, error);
        }
    }
    return newNotesByDate;
}