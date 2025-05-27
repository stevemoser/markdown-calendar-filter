# Markdown Calendar Filter for VS Code
Navigate and filter your markdown notes based on dates found in their YAML frontmatter. This extension provides a calendar in the sidebar, allowing you to quickly find notes, journal entries, or content associated with a specific day.

-----------------------------
| Sidebar                   |
|---------------------------|
| EXPLORER                  |
| ...                       |
|---------------------------|
| YOUR_EXTENSION_NAME       |  <-- Activity Bar Icon
|   ----------------------- |
|   | <<  October 2023 >> | |  <-- Calendar Navigation
|   | Su Mo Tu We Th Fr Sa | |
|   |        1  2  3  4  5 | |
|   |  6  7  8  9 10 11 12 | |
|   | 13 14 15 16 17 18 19 | |
|   | 20 21 22 23 24 25 *26*| |  <-- *Selected Date*
|   | 27 28 29 30 31      | |
|   ----------------------- |
|                           |
|   Files for 2023-10-26:   |  <-- Filtered List Title
|   ----------------------- |
|   | > note-A.md           | |  <-- Click to open
|   | > projectX/taskY.md   | |
|   | (Clear Filter)        | |
|   ----------------------- |
-----------------------------

## Features

*   **Sidebar Calendar:** A fully interactive monthly calendar view in the VS Code sidebar.
    *   Navigate between months and years.
    *   Today's date is highlighted.
    *   Dates containing markdown notes with matching frontmatter dates are visually indicated (e.g., with a dot).
*   **Date-Based Filtering:**
    *   Click on any date in the calendar.
    *   A list of markdown files (`.md`, `.markdown`) from your current workspace will be displayed if their YAML frontmatter contains a matching date.
    *   Supported frontmatter fields by default: `date`, `timestamp`, `publishdate` (configurable).
*   **Filtered File List:**
    *   Shows files matching the selected date.
    *   Click a file in the list to open it directly in the editor.
    *   "Clear Filter" option to reset the view.
*   **Active Editor Date Highlighting:**
    *   When you open a markdown file with a valid date in its frontmatter, that date will be automatically highlighted on the calendar.
*   **Quick Note Creation:**
    *   Easily create a new markdown note for the currently selected date in the calendar (or today's date if no date is selected).
    *   The new file will be pre-filled with basic frontmatter including the chosen date.

## Assumptions

This extension is built with the following assumptions in mind:

*   **YAML Frontmatter:** Users primarily manage metadata, including dates, within YAML frontmatter blocks (`--- ... ---`) at the beginning of their markdown files.
*   **Standard Date Formats:** While the extension attempts to parse common date formats, it assumes dates in frontmatter are reasonably standard Gregorian calendar dates (e.g., `YYYY-MM-DD`, ISO 8601, or JavaScript-parsable date strings/timestamps). Highly esoteric or custom date formats might not be recognized without configuration or future enhancements.
*   **Workspace-Centric:** The extension operates on markdown files within the currently active VS Code workspace. It does not search outside this scope.
*   **Performance for Typical Use:** The extension is designed to perform well for typical personal note-taking or small to medium-sized project repositories. Extremely large numbers of markdown files (tens of thousands) might reveal performance bottlenecks that would need to be addressed.
*   **Focus on Date (not Time):** For calendar day selection, the primary matching logic ignores the time component of timestamps in frontmatter, focusing only on the Year, Month, and Day.
*   **Single Date Field Priority:** If multiple configured date fields (e.g., `date`, `publishdate`) are present in a single file's frontmatter, the extension will use the first one it successfully parses according to the order in the `markdownCalendar.frontmatterDateFields` setting.

## Requirements

*   VS Code version 1.80.0 or higher (adjust as per your `package.json`).
*   Markdown files in your workspace must use YAML frontmatter (e.g., enclosed in `---`).
*   A date field (e.g., `date: YYYY-MM-DD`) must be present in the frontmatter for files to be discoverable by date.

## How to Use

1.  **Open the Calendar View:** Find the "Markdown Calendar" icon in the Activity Bar (usually on the left or right side of VS Code) and click it. This will open the calendar and filtered files views in the sidebar.
2.  **Navigate the Calendar:** Use the `<` and `>` buttons to change months. (Future: Year navigation).
3.  **Select a Date:** Click on a day in the calendar.
    *   If markdown files with matching frontmatter dates exist in your workspace, they will appear in the "Files for Selected Date" list below the calendar.
    *   Dates on the calendar that have associated notes will have a visual indicator.
4.  **Open Files:** Click on any file in the "Files for Selected Date" list to open it.
5.  **Clear Filter:** Click the "Clear Filter" icon (usually a clear-all icon) in the title bar of the "Files for Selected Date" view to remove the date filter and hide the list.
6.  **Create New Note:** Click the "Add" icon (usually a `+` symbol) in the title bar of the Calendar view.
    *   If a date is selected in the calendar, a new note for that date will be created.
    *   If no date is selected, a new note for today's date will be created.
    *   The new note will be created based on your extension settings (directory and filename pattern).

## Extension Settings

This extension contributes the following settings (accessible via `File > Preferences > Settings`, then search for "Markdown Calendar"):

*   `markdownCalendar.frontmatterDateFields`:
    *   Description: An array of YAML frontmatter field names the extension will check for dates.
    *   Default: `["date", "timestamp", "publishdate"]`
*   `markdownCalendar.notesDirectory`:
    *   Description: Relative path within the workspace where new notes created via the "Create New Note" command will be placed (e.g., `journal/` or `notes/daily/`). If left empty, notes are created in the workspace root.
    *   Default: `""`
*   `markdownCalendar.newNoteFilenamePattern`:
    *   Description: The filename pattern for newly created notes. Use `YYYY`, `MM`, and `DD` as placeholders for the year, month, and day.
    *   Default: `YYYY-MM-DD-untitled.md`
*   `markdownCalendar.markdownFileExtensions`:
    *   Description: An array of file extensions to be considered as Markdown files by the extension.
    *   Default: `[".md", ".markdown"]`

## Known Issues

*   Currently, year navigation in the calendar might be limited to sequential month clicks (or not yet fully implemented).
*   Performance in extremely large workspaces with tens of thousands of markdown files might need further optimization.
*   (Add any other known issues here)

## Future Enhancements / Roadmap

*   [ ] More robust calendar navigation (year selection, jump to date).
*   [ ] Date range selection.
*   [ ] "On this day" feature (show notes from the same date in previous years).
*   [ ] More sophisticated visual cues on the calendar (e.g., number of notes).
*   [ ] Theming support to better match VS Code themes.
*   [ ] Option to configure the first day of the week in the calendar.

## Contributing

Contributions, issues, and feature requests are welcome! Please feel free to check the [issues page](https://github.com/stevemoser/markdown-calendar-filter/issues).

## Release Notes

### X.Y.Z (Next Version)

*   Initial features...
*   Added active editor date highlighting.
*   Implemented "Create New Note" command.

### 0.1.0

*   Initial release of Markdown Calendar Filter.
*   Basic calendar view and date-based filtering.

---

**Enjoy using Markdown Calendar Filter!**

---