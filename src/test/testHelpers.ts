import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Helper class for creating mock markdown files in tests
 */
export class TestFileHelper {
    /**
     * Create a temporary markdown file with frontmatter
     * @param directory Directory to create the file in
     * @param filename Name of the file
     * @param frontmatterData Object containing frontmatter fields
     * @param content Content of the file after frontmatter
     * @returns Path to the created file
     */
    static createMarkdownFile(
        directory: string,
        filename: string,
        frontmatterData: Record<string, any>,
        content: string = '# Test Content'
    ): string {
        // Ensure the directory exists
        fs.mkdirSync(directory, { recursive: true });

        // Create frontmatter string
        let frontmatter = '---\n';
        for (const [key, value] of Object.entries(frontmatterData)) {
            frontmatter += `${key}: ${value}\n`;
        }
        frontmatter += '---\n\n';

        // Full file content
        const fileContent = frontmatter + content;

        // Full file path
        const filePath = path.join(directory, filename);

        // Write the file
        fs.writeFileSync(filePath, fileContent);

        return filePath;
    }

    /**
     * Clean up a test file or directory
     * @param path Path to file or directory to remove
     */
    static cleanup(path: string): void {
        if (fs.existsSync(path)) {
            const stats = fs.statSync(path);

            if (stats.isDirectory()) {
                fs.rmSync(path, { recursive: true, force: true });
            } else {
                fs.unlinkSync(path);
            }
        }
    }
}
