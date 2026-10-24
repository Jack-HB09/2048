const DEFAULT_TILE_COLOR = "#3c3a32";

const TILE_COLORS = {
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e"
};

class Grid {
    constructor(element) {
        this.element = element;
        this.cells = Array.from(element.querySelectorAll(".grid-cell"));
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

    addRandomTile() {
        const emptyCells = this.cells.filter((cell) => cell.textContent.trim() === "");

        if (emptyCells.length === 0) {
            return false;
        }

        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const cell = emptyCells[randomIndex];
        const value = Math.random() < 0.9 ? 2 : 4;

        cell.textContent = String(value);
        cell.style.backgroundColor = TILE_COLORS[value] || DEFAULT_TILE_COLOR;

        return true;
    }

    reset() {
        this.cells.forEach((cell) => {
            cell.textContent = "";
            cell.style.backgroundColor = "";
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
                cell.style.backgroundColor = value === undefined
                    ? ""
                    : TILE_COLORS[value] || DEFAULT_TILE_COLOR;
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
