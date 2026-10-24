const TILE_PALETTES = {
    classic: {
        2: ["#eee4da", "#776e65"],
        4: ["#ede0c8", "#776e65"],
        8: ["#f2b179", "#51483d"],
        16: ["#f59563", "#51483d"],
        32: ["#f67c5f", "#51483d"],
        64: ["#f65e3b", "#372f26"],
        128: ["#edcf72", "#514a3d"],
        256: ["#edcc61", "#514a3d"],
        512: ["#edc850", "#514a3d"],
        1024: ["#edc53f", "#514a3d"],
        2048: ["#edc22e", "#514a3d"]
    },
    ocean: {
        2: ["#e0f2fe", "#0c4a6e"],
        4: ["#bae6fd", "#0c4a6e"],
        8: ["#7dd3fc", "#082f49"],
        16: ["#38bdf8", "#082f49"],
        32: ["#0ea5e9", "#082f49"],
        64: ["#0284c7", "#ffffff"],
        128: ["#0369a1", "#ffffff"],
        256: ["#0e7490", "#ffffff"],
        512: ["#0f766e", "#ffffff"],
        1024: ["#115e59", "#ffffff"],
        2048: ["#134e4a", "#ffffff"]
    },
    forest: {
        2: ["#e8f5e9", "#1b5e20"],
        4: ["#c8e6c9", "#1b5e20"],
        8: ["#a5d6a7", "#1b5e20"],
        16: ["#81c784", "#123d18"],
        32: ["#66bb6a", "#123d18"],
        64: ["#4caf50", "#123d18"],
        128: ["#388e3c", "#ffffff"],
        256: ["#2e7d32", "#ffffff"],
        512: ["#558b2f", "#ffffff"],
        1024: ["#33691e", "#ffffff"],
        2048: ["#1b5e20", "#ffffff"]
    }
};

const DEFAULT_PALETTE = "classic";

class Grid {
    constructor(element) {
        this.element = element;
        this.cells = Array.from(element.querySelectorAll(".grid-cell"));
        this.paletteName = DEFAULT_PALETTE;
        this.rowCount = Math.max(...this.cells.map((cell) => Number(cell.dataset.row)));
        this.columnCount = Math.max(...this.cells.map((cell) => Number(cell.dataset.col)));
        this.moveDirections = {
            ArrowUp: {
                rowStart: 1, colStart: 1, rowStep: 1, colStep: 0,
                lineRowStep: 0, lineColStep: 1,
                lineCount: this.columnCount, lineLength: this.rowCount
            },
            ArrowDown: {
                rowStart: this.rowCount, colStart: 1, rowStep: -1, colStep: 0,
                lineRowStep: 0, lineColStep: 1,
                lineCount: this.columnCount, lineLength: this.rowCount
            },
            ArrowLeft: {
                rowStart: 1, colStart: 1, rowStep: 0, colStep: 1,
                lineRowStep: 1, lineColStep: 0,
                lineCount: this.rowCount, lineLength: this.columnCount
            },
            ArrowRight: {
                rowStart: 1, colStart: this.columnCount, rowStep: 0, colStep: -1,
                lineRowStep: 1, lineColStep: 0,
                lineCount: this.rowCount, lineLength: this.columnCount
            }
        };
    }

    getCell(row, col) {
        return this.cells.find((cell) =>
            Number(cell.dataset.row) === row &&
            Number(cell.dataset.col) === col
        );
    }

    setPalette(paletteName) {
        if (!Object.hasOwn(TILE_PALETTES, paletteName)) {
            throw new Error(`Unknown tile colour palette: ${paletteName}`);
        }

        this.paletteName = paletteName;
        this.cells.forEach((cell) => this.styleCell(cell));
    }

    styleCell(cell) {
        const value = Number(cell.textContent.trim());
        const colors = TILE_PALETTES[this.paletteName][value];

        cell.style.backgroundColor = colors ? colors[0] : "";
        cell.style.color = colors ? colors[1] : "";
    }

    addRandomTile() {
        const emptyCells = this.cells.filter((cell) => cell.textContent.trim() === "");

        if (emptyCells.length === 0) {
            return false;
        }

        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const cell = emptyCells[randomIndex];
        const value = Math.random() < 0.9 ? 2 : 4;

        cell.textContent = String(value);
        this.styleCell(cell);

        return true;
    }

    reset() {
        this.cells.forEach((cell) => {
            cell.textContent = "";
            cell.style.backgroundColor = "";
            cell.style.color = "";
        });
    }

    hasMovesAvailable() {
        for (const cell of this.cells) {
            if (cell.textContent.trim() === "") {
                return true;
            }

            const row = Number(cell.dataset.row);
            const col = Number(cell.dataset.col);
            const value = cell.textContent.trim();
            const rightCell = this.getCell(row, col + 1);
            const lowerCell = this.getCell(row + 1, col);

            if (rightCell?.textContent.trim() === value || lowerCell?.textContent.trim() === value) {
                return true;
            }
        }

        return false;
    }

    moveCells(direction) {
        const movement = this.moveDirections[direction];
        if (!movement) {
            return false;
        }

        let changed = false;

        for (let line = 0; line < movement.lineCount; line++) {
            const positions = [];
            const values = [];

            for (let step = 0; step < movement.lineLength; step++) {
                const row = movement.rowStart + line * movement.lineRowStep + step * movement.rowStep;
                const col = movement.colStart + line * movement.lineColStep + step * movement.colStep;
                positions.push(this.getCell(row, col));
            }

            positions.forEach((cell) => {
                const value = cell.textContent.trim();

                if (value !== "") {
                    values.push(Number(value));
                }
            });

            const mergedValues = [];
            for (let index = 0; index < values.length; index++) {
                if (values[index] === values[index + 1]) {
                    mergedValues.push(values[index] * 2);
                    index++;
                } else {
                    mergedValues.push(values[index]);
                }
            }

            positions.forEach((cell, index) => {
                const value = mergedValues[index];
                const text = value === undefined ? "" : String(value);

                if (cell.textContent.trim() !== text) {
                    changed = true;
                }

                cell.textContent = text;
                this.styleCell(cell);
            });
        }
        if (changed) {
            this.addRandomTile();
        }

        return changed;
    }
}

const gameGridElement = document.querySelector("#gameview");
const gameGrid = new Grid(gameGridElement);
const gameOverElement = document.querySelector("#game-over");
const resetButton = document.querySelector("#reset");
const colourSelect = document.querySelector("#colour-select");

function updateGameOver() {
    const isGameOver = !gameGrid.hasMovesAvailable();
    gameOverElement.hidden = !isGameOver;

    if (isGameOver) {
        resetButton.focus();
    }

    return isGameOver;
}

function startNewGame() {
    gameGrid.reset();
    gameGrid.addRandomTile();
    gameGrid.addRandomTile();
    gameOverElement.hidden = true;
    gameGridElement.focus();
}

resetButton.addEventListener("click", startNewGame);
colourSelect.addEventListener("change", () => {
    gameGrid.setPalette(colourSelect.value);
});
gameGrid.setPalette(colourSelect.value);
startNewGame();

function handleMove(direction) {
    if (!gameOverElement.hidden) {
        return;
    }

    gameGrid.moveCells(direction);
    updateGameOver();
}

document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
            event.preventDefault();
            handleMove(event.key);
            return;
        default:
            return;
    }
});

let swipeStart;

gameGridElement.addEventListener("pointerdown", (event) => {
    swipeStart = { x: event.clientX, y: event.clientY };
});

gameGridElement.addEventListener("pointerup", (event) => {
    if (!swipeStart) {
        return;
    }

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    swipeStart = undefined;

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) {
        return;
    }

    const direction = Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0 ? "ArrowRight" : "ArrowLeft"
        : deltaY > 0 ? "ArrowDown" : "ArrowUp";

    handleMove(direction);
});

gameGridElement.addEventListener("pointercancel", () => {
    swipeStart = undefined;
});
