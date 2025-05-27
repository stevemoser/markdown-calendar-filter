// This script will run in the webview
(function () {
    const vscode = acquireVsCodeApi();
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('current-month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');

    let currentDisplayDate = new Date(); // Date object to track current month/year being viewed
    let datesWithNotes = []; // Array of 'YYYY-MM-DD' strings
    let currentSelectedDateStr = null; // 'YYYY-MM-DD' For the main filter selection
    let currentHighlightedDateStr = null; // For the active editor highlight

    function renderCalendar() {
        calendarGrid.innerHTML = ''; // Clear previous grid
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth(); // 0-indexed

        monthYearDisplay.textContent = `${currentDisplayDate.toLocaleString('default', { month: 'long' })} ${year}`;

        // Days of the week headers
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(day => {
            const dayHeaderEl = document.createElement('div');
            dayHeaderEl.classList.add('day-header');
            dayHeaderEl.textContent = day;
            calendarGrid.appendChild(dayHeaderEl);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;


        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day-cell', 'other-month');
            calendarGrid.appendChild(emptyCell);
        }

        // Add day cells for the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell');
            dayCell.textContent = day;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;

            if (datesWithNotes.includes(dateStr)) {
                dayCell.classList.add('has-notes');
            }
            if (dateStr === todayStr) {
                dayCell.classList.add('today');
            }
            if (dateStr === currentSelectedDateStr) {
                dayCell.classList.add('selected'); // Main filter selection
            }
            if (dateStr === currentHighlightedDateStr && dateStr !== currentSelectedDateStr) {
                dayCell.classList.add('editor-highlight');
            }


            dayCell.addEventListener('click', () => {
                vscode.postMessage({ type: 'dateSelected', value: dateStr });
                // Optimistically update selection UI, will be confirmed by message from extension
                const prevSelected = calendarGrid.querySelector('.day-cell.selected');
                if (prevSelected) {
                    prevSelected.classList.remove('selected');
                }
                dayCell.classList.add('selected');
                currentSelectedDateStr = dateStr;
            });
            calendarGrid.appendChild(dayCell);
        }
    }

    prevMonthButton.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
        // vscode.postMessage({ type: 'navigateToMonth', direction: 'prev' }); // Could also let extension handle state
        renderCalendar(); // Re-render with new month
    });

    nextMonthButton.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
        // vscode.postMessage({ type: 'navigateToMonth', direction: 'next' });
        renderCalendar();
    });

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'updateData':
            datesWithNotes = message.datesWithNotes || [];
            if (message.selectedDate !== undefined) {
                currentSelectedDateStr = message.selectedDate;
            }
            if (message.highlightedDate !== undefined) {
                currentHighlightedDateStr = message.highlightedDate;
            }
            renderCalendar();
            break;

        case 'setSelectionAndHighlight': // From setSelectedDateInCalendar
            // Clear previous selection
            const prevSelected = calendarGrid.querySelector('.day-cell.selected');
            if (prevSelected) prevSelected.classList.remove('selected');
            // Clear previous highlight
            const prevHighlightedS = calendarGrid.querySelector('.day-cell.editor-highlight');
            if (prevHighlightedS) prevHighlightedS.classList.remove('editor-highlight');

            currentSelectedDateStr = message.selectedDate;
            currentHighlightedDateStr = message.highlightedDate; // Often the same as selectedDate here

            if (currentSelectedDateStr) {
                const newSelectedCell = calendarGrid.querySelector(`.day-cell[data-date="${currentSelectedDateStr}"]`);
                if (newSelectedCell) newSelectedCell.classList.add('selected');
            }
            if (currentHighlightedDateStr && currentHighlightedDateStr !== currentSelectedDateStr) { // Only add if different from selection
                const newHighlightedCellS = calendarGrid.querySelector(`.day-cell[data-date="${currentHighlightedDateStr}"]`);
                if (newHighlightedCellS) newHighlightedCellS.classList.add('editor-highlight');
            }
             // Potentially adjust currentDisplayDate to show the selected/highlighted date's month
            const targetDateForView = currentSelectedDateStr || currentHighlightedDateStr;
            if (targetDateForView) {
                const selDateParts = targetDateForView.split('-');
                const selYear = parseInt(selDateParts[0]);
                const selMonth = parseInt(selDateParts[1]) -1;
                if (currentDisplayDate.getFullYear() !== selYear || currentDisplayDate.getMonth() !== selMonth) {
                    currentDisplayDate = new Date(selYear, selMonth, 1);
                    renderCalendar(); // This re-renders everything with new states
                } else {
                    // If same month, just re-apply classes without full re-render of grid might be more efficient
                    // For simplicity, full renderCalendar() is okay for now.
                }
            }
            break;

        case 'setHighlight': // From highlightDateInCalendar
            const prevHighlightedH = calendarGrid.querySelector('.day-cell.editor-highlight');
            if (prevHighlightedH) prevHighlightedH.classList.remove('editor-highlight');

            currentHighlightedDateStr = message.date;

            if (currentHighlightedDateStr && currentHighlightedDateStr !== currentSelectedDateStr) { // Don't highlight if it's already selected
                const newHighlightedCellH = calendarGrid.querySelector(`.day-cell[data-date="${currentHighlightedDateStr}"]`);
                if (newHighlightedCellH) newHighlightedCellH.classList.add('editor-highlight');
            }

            // Scroll to highlighted date's month if necessary
            if (currentHighlightedDateStr) {
                const highDateParts = currentHighlightedDateStr.split('-');
                const highYear = parseInt(highDateParts[0]);
                const highMonth = parseInt(highDateParts[1]) -1;
                if (currentDisplayDate.getFullYear() !== highYear || currentDisplayDate.getMonth() !== highMonth) {
                    currentDisplayDate = new Date(highYear, highMonth, 1);
                    renderCalendar();
                }
            }
            break;
        }
    });

    // Request initial data once the webview is ready
    vscode.postMessage({ type: 'getInitialData' });

    // Initial render (might be empty until data arrives)
    renderCalendar();
}());