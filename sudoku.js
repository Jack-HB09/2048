const SUDOKU_SIZE = 9;
const SUDOKU_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const CLUE_RANGES = Object.freeze({
    easy: [30, 45],
    medium: [25, 32],
    hard: [22, 27]
});

const SUDOKU_PALETTES = Object.freeze({
    classic: {
        background: "#faf8ef",
        surface: "#fffdf5",
        accent: "#b88a16",
        secondary: "#f2b179",
        ink: "#4b3822",
        line: "#dfd4bd",
        strongLine: "#b88a16"
    },
    ocean: {
        background: "#eaf4fc",
        surface: "#f8fcff",
        accent: "#3b82c4",
        secondary: "#77b7e5",
        ink: "#183b5b",
        line: "#a9c9e2",
        strongLine: "#3b82c4"
    },
    forest: {
        background: "#e8f5e9",
        surface: "#f4fbf4",
        accent: "#4caf50",
        secondary: "#81c784",
        ink: "#1b5e20",
        line: "#bfd1b8",
        strongLine: "#388e3c"
    }
});

function shuffled(items) {
    const result = [...items];

    for (let index = result.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }

    return result;
}

class SudokuGame {
    constructor() {
        this.boardElement = document.querySelector("#sudoku-board");
        this.statusElement = document.querySelector("#game-status");
        this.difficultySelect = document.querySelector("#difficulty-select");
        this.colourSelect = document.querySelector("#colour-select");
        this.selectedNumber = null;
        this.selectedCell = null;
        this.currentGameMode = "add";
        this.cells = [];
        this.board = [];
        this.givens = [];
        this.notes = [];
        this.solution = [];

        this.createBoard();
        this.bindControls();
        this.applyPalette();
        this.newGame();
    }

    createBoard() {
        for (let row = 0; row < SUDOKU_SIZE; row++) {
            for (let column = 0; column < SUDOKU_SIZE; column++) {
                const cell = document.createElement("button");
                cell.className = "sudoku-cell";
                cell.type = "button";
                cell.setAttribute("role", "gridcell");
                cell.dataset.row = String(row);
                cell.dataset.column = String(column);
                cell.setAttribute("aria-label", `Row ${row + 1}, column ${column + 1}, empty`);

                const value = document.createElement("span");
                value.className = "cell-value";
                const notes = document.createElement("span");
                notes.className = "cell-notes";
                notes.setAttribute("aria-hidden", "true");
                cell.append(value, notes);

                this.boardElement.append(cell);
                this.cells.push(cell);
            }
        }

        this.boardElement.addEventListener("click", (event) => {
            const cell = event.target.closest(".sudoku-cell");
            if (!cell || !this.boardElement.contains(cell)) {
                return;
            }

            this.handleCellClick(Number(cell.dataset.row), Number(cell.dataset.column));
        });
    }

    bindControls() {
        document.querySelectorAll(".number-button").forEach((button) => {
            button.addEventListener("click", () => this.selectNumber(Number(button.dataset.number)));
        });

        document.querySelector("#reset-game").addEventListener("click", () => this.newGame());
        this.difficultySelect.addEventListener("change", () => this.newGame());
        this.colourSelect.addEventListener("change", () => this.applyPalette());
        document.addEventListener("site-theme-change", () => this.applyPalette());
        document.querySelector("#hint-button").addEventListener("click", () => this.giveHint());
        document.querySelectorAll(".mode-button").forEach((button) => {
            button.addEventListener("click", () => this.setGameMode(button.dataset.mode));
        });
        document.querySelector("#clear-notes-button").addEventListener("click", () => this.clearSelectedNotes());
        document.querySelector("#play-again-button").addEventListener("click", () => {
            this.newGame();
            document.querySelector("#reset-game").focus();
        });

        document.addEventListener("keydown", (event) => {
            if (/^[1-9]$/.test(event.key)) {
                this.selectNumber(Number(event.key));
            } else if (event.key === "Backspace" || event.key === "Delete") {
                if (this.currentGameMode === "erase") {
                    this.eraseSelectedCell();
                }
            }
        });
    }

    applyPalette() {
        const palette = SUDOKU_PALETTES[this.colourSelect.value];
        if (!palette) {
            throw new Error(`Unknown Sudoku colour palette: ${this.colourSelect.value}`);
        }

        document.body.dataset.gamePalette = this.colourSelect.value;
        Object.entries(palette).forEach(([name, color]) => {
            document.body.style.setProperty(`--palette-${name}`, color);
        });
    }

    newGame() {
        this.solution = this.generateSolution();
        this.board = this.createPuzzle(this.solution, this.difficultySelect.value);
        this.givens = this.board.map((row) => row.map((value) => value !== 0));
        this.notes = Array.from({ length: SUDOKU_SIZE }, () =>
            Array.from({ length: SUDOKU_SIZE }, () => new Set())
        );
        this.selectedNumber = null;
        this.selectedCell = null;
        this.currentGameMode = "add";
        this.setGameMode("add");
        document.querySelectorAll(".number-button").forEach((button) => button.classList.remove("is-active"));
        document.querySelector("#victory-overlay").hidden = true;
        this.renderBoard();
        this.validateBoard();
        this.setStatus(`New ${this.difficultySelect.value} game. Select a number, then choose an empty cell.`);
    }

    generateSolution() {
        const bands = shuffled([0, 1, 2]);
        const rows = bands.flatMap((band) => shuffled([0, 1, 2]).map((row) => band * 3 + row));
        const stacks = shuffled([0, 1, 2]);
        const columns = stacks.flatMap((stack) => shuffled([0, 1, 2]).map((column) => stack * 3 + column));
        const digits = shuffled(SUDOKU_DIGITS);

        return rows.map((row) => columns.map((column) => {
            const patternIndex = (row * 3 + Math.floor(row / 3) + column) % SUDOKU_SIZE;
            return digits[patternIndex];
        }));
    }

    // Remove clues one at a time, keeping each removal only when the puzzle still has one solution.
    createPuzzle(solution, difficulty) {
        const [minimum, maximum] = CLUE_RANGES[difficulty];
        const targetClues = minimum + Math.floor(Math.random() * (maximum - minimum + 1));

        for (let attempt = 0; attempt < 16; attempt++) {
            const puzzle = solution.map((row) => [...row]);
            let clues = SUDOKU_SIZE * SUDOKU_SIZE;

            for (const index of shuffled(Array.from({ length: SUDOKU_SIZE * SUDOKU_SIZE }, (_, cellIndex) => cellIndex))) {
                if (clues <= targetClues) {
                    break;
                }

                const row = Math.floor(index / SUDOKU_SIZE);
                const column = index % SUDOKU_SIZE;
                const value = puzzle[row][column];
                puzzle[row][column] = 0;

                if (this.countSolutions(puzzle) === 1) {
                    clues--;
                } else {
                    puzzle[row][column] = value;
                }
            }

            if (clues <= maximum && clues >= minimum) {
                return puzzle;
            }
        }

        throw new Error(`Could not generate a unique ${difficulty} Sudoku puzzle in the required clue range.`);
    }

    // The minimum-candidate search avoids exploring every empty square in order and stops after two solutions.
    countSolutions(puzzle) {
        const working = puzzle.map((row) => [...row]);
        let solutionCount = 0;

        const search = () => {
            if (solutionCount > 1) {
                return;
            }

            let bestCell = null;
            let bestCandidates = null;

            for (let row = 0; row < SUDOKU_SIZE; row++) {
                for (let column = 0; column < SUDOKU_SIZE; column++) {
                    if (working[row][column] !== 0) {
                        continue;
                    }

                    const candidates = SUDOKU_DIGITS.filter((digit) =>
                        this.isAllowed(working, row, column, digit)
                    );

                    if (candidates.length === 0) {
                        return;
                    }

                    if (!bestCandidates || candidates.length < bestCandidates.length) {
                        bestCell = [row, column];
                        bestCandidates = candidates;
                    }
                }
            }

            if (!bestCell) {
                solutionCount++;
                return;
            }

            const [row, column] = bestCell;
            for (const digit of bestCandidates) {
                working[row][column] = digit;
                search();
                working[row][column] = 0;

                if (solutionCount > 1) {
                    return;
                }
            }
        };

        search();
        return solutionCount;
    }

    isAllowed(board, row, column, digit) {
        for (let index = 0; index < SUDOKU_SIZE; index++) {
            if (board[row][index] === digit || board[index][column] === digit) {
                return false;
            }
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxColumn = Math.floor(column / 3) * 3;
        for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
            for (let columnOffset = 0; columnOffset < 3; columnOffset++) {
                if (board[boxRow + rowOffset][boxColumn + columnOffset] === digit) {
                    return false;
                }
            }
        }

        return true;
    }

    selectNumber(number) {
        this.selectedNumber = number;
        document.querySelectorAll(".number-button").forEach((button) => {
            button.classList.toggle("is-active", Number(button.dataset.number) === number);
        });
        this.refreshHighlights();
    }

    selectCell(row, column) {
        this.selectedCell = { row, column };
        this.refreshHighlights();

        if (this.givens[row][column]) {
            this.setStatus("That number is a starting clue and cannot be changed.");
        }
    }

    handleCellClick(row, column) {
        this.selectCell(row, column);

        if (this.givens[row][column]) {
            return;
        }

        if (this.currentGameMode === "erase") {
            this.eraseSelectedCell(row, column);
        } else if (this.currentGameMode === "pencil") {
            this.applyPencilMark(row, column);
        } else if (this.selectedNumber !== null) {
            this.applySelectedNumber(row, column);
        }
    }

    applySelectedNumber(row, column) {
        if (this.currentGameMode !== "add" || this.selectedNumber === null || this.givens[row][column]) {
            return;
        }

        this.board[row][column] = this.selectedNumber;
        this.notes[row][column].clear();
        this.renderCell(row, column);
        this.validateBoard();
    }

    applyPencilMark(row, column) {
        if (this.currentGameMode !== "pencil" || this.selectedNumber === null || this.givens[row][column]) {
            return;
        }

        if (this.board[row][column] !== 0) {
            this.setStatus("Pencil marks can only be added to empty cells.");
            return;
        }

        const cellNotes = this.notes[row][column];
        if (cellNotes.has(this.selectedNumber)) {
            cellNotes.delete(this.selectedNumber);
        } else if (cellNotes.size < 8) {
            cellNotes.add(this.selectedNumber);
        } else {
            this.setStatus("A cell can contain up to 8 pencil marks.");
            return;
        }

        this.renderCell(row, column);
        this.setStatus("Pencil mark updated. Notes do not affect Sudoku rules.");
    }

    eraseSelectedCell(row = this.selectedCell?.row, column = this.selectedCell?.column) {
        if (row === undefined || column === undefined) {
            this.setStatus("Select a cell to erase it.");
            return;
        }

        if (this.givens[row][column]) {
            this.setStatus("Starting clues cannot be erased.");
            return;
        }

        this.board[row][column] = 0;
        this.notes[row][column].clear();
        this.renderCell(row, column);
        this.validateBoard();
    }

    setGameMode(mode) {
        if (!["add", "erase", "pencil"].includes(mode)) {
            throw new Error(`Unknown Sudoku mode: ${mode}`);
        }

        this.currentGameMode = mode;
        document.querySelectorAll(".mode-button").forEach((button) => {
            const isActive = button.dataset.mode === mode;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
        this.setStatus(`${mode[0].toUpperCase()}${mode.slice(1)} mode selected.`);
    }

    clearSelectedNotes() {
        if (!this.selectedCell) {
            this.setStatus("Select a cell to clear its pencil marks.");
            return;
        }

        const { row, column } = this.selectedCell;
        this.notes[row][column].clear();
        this.renderCell(row, column);
        this.setStatus("Pencil marks cleared.");
    }

    giveHint() {
        const emptyCells = [];
        for (let row = 0; row < SUDOKU_SIZE; row++) {
            for (let column = 0; column < SUDOKU_SIZE; column++) {
                if (this.board[row][column] === 0) {
                    emptyCells.push({ row, column });
                }
            }
        }

        if (emptyCells.length === 0) {
            this.setStatus("There are no empty cells to reveal.");
            return;
        }

        const { row, column } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.board[row][column] = this.solution[row][column];
        this.notes[row][column].clear();
        this.selectedCell = { row, column };
        this.renderCell(row, column);
        this.validateBoard();
        this.setStatus(`Hint: revealed row ${row + 1}, column ${column + 1}.`);
    }

    validateBoard() {
        const conflicts = new Set();
        // Collect repeated values in each row, column, and 3x3 box without treating pencil notes as entries.
        const addDuplicates = (coordinates) => {
            const positionsByValue = new Map();
            coordinates.forEach(([row, column]) => {
                const value = this.board[row][column];
                if (value === 0) {
                    return;
                }

                if (!positionsByValue.has(value)) {
                    positionsByValue.set(value, []);
                }
                positionsByValue.get(value).push([row, column]);
            });

            positionsByValue.forEach((positions) => {
                if (positions.length > 1) {
                    positions.forEach(([row, column]) => conflicts.add(`${row},${column}`));
                }
            });
        };

        for (let index = 0; index < SUDOKU_SIZE; index++) {
            addDuplicates(Array.from({ length: SUDOKU_SIZE }, (_, offset) => [index, offset]));
            addDuplicates(Array.from({ length: SUDOKU_SIZE }, (_, offset) => [offset, index]));
        }

        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxColumn = 0; boxColumn < 3; boxColumn++) {
                const box = [];
                for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
                    for (let columnOffset = 0; columnOffset < 3; columnOffset++) {
                        box.push([boxRow * 3 + rowOffset, boxColumn * 3 + columnOffset]);
                    }
                }
                addDuplicates(box);
            }
        }

        this.cells.forEach((cell) => {
            const row = Number(cell.dataset.row);
            const column = Number(cell.dataset.column);
            cell.classList.toggle("is-conflict", conflicts.has(`${row},${column}`));
        });

        const isFull = this.board.every((row) => row.every((value) => value !== 0));
        if (isFull && conflicts.size === 0) {
            this.setStatus("Puzzle solved! Every row, column, and 3x3 box is valid.");
            document.querySelector("#victory-overlay").hidden = false;
            document.querySelector("#play-again-button").focus();
            return true;
        }

        if (conflicts.size > 0) {
            this.setStatus("Duplicate numbers are highlighted. Check the affected rows, columns, and boxes.", true);
            return false;
        }

        this.setStatus("No duplicates so far. Keep going!");
        return false;
    }

    refreshHighlights() {
        this.cells.forEach((cell) => {
            const row = Number(cell.dataset.row);
            const column = Number(cell.dataset.column);
            const value = this.board[row][column];
            cell.classList.toggle("is-selected", this.selectedCell?.row === row && this.selectedCell?.column === column);
            cell.classList.toggle("is-related", Boolean(this.selectedCell && (
                this.selectedCell.row === row ||
                this.selectedCell.column === column ||
                (Math.floor(this.selectedCell.row / 3) === Math.floor(row / 3) &&
                    Math.floor(this.selectedCell.column / 3) === Math.floor(column / 3))
            )));
            cell.classList.toggle("is-matching", this.selectedNumber !== null && value === this.selectedNumber);
        });
    }

    renderCell(row, column) {
        const cell = this.cells[row * SUDOKU_SIZE + column];
        const value = this.board[row][column];
        const valueElement = cell.querySelector(".cell-value");
        const notesElement = cell.querySelector(".cell-notes");
        valueElement.textContent = value === 0 ? "" : String(value);
        cell.classList.toggle("is-given", this.givens[row][column]);

        if (value !== 0) {
            cell.setAttribute("aria-label", `Row ${row + 1}, column ${column + 1}, ${value}${this.givens[row][column] ? ", starting clue" : ""}`);
            cell.setAttribute("aria-disabled", String(this.givens[row][column]));
        } else {
            cell.setAttribute("aria-label", `Row ${row + 1}, column ${column + 1}, empty`);
            cell.removeAttribute("aria-disabled");
        }

        notesElement.replaceChildren();
        const noteValues = [...this.notes[row][column]].sort((first, second) => first - second);
        let noteIndex = 0;
        for (let slot = 0; slot < 9; slot++) {
            const note = document.createElement("span");
            note.textContent = slot === 4 ? "" : String(noteValues[noteIndex++] ?? "");
            notesElement.append(note);
        }

        this.refreshHighlights();
    }

    renderBoard() {
        for (let row = 0; row < SUDOKU_SIZE; row++) {
            for (let column = 0; column < SUDOKU_SIZE; column++) {
                this.renderCell(row, column);
            }
        }
    }

    setStatus(message, isError = false) {
        this.statusElement.textContent = message;
        this.statusElement.classList.toggle("is-error", isError);
    }
}

new SudokuGame();
