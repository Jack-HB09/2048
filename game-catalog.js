const GAME_CATALOG = Object.freeze([
    Object.freeze({
        id: "2048",
        title: "2048",
        route: "2048.html",
        description: "Slide and combine matching tiles to build your way to 2048.",
        category: "Puzzle",
        iconText: "2048",
        theme: Object.freeze({
            background: "#faf8ef",
            surface: "#fffdf5",
            accent: "#edc22e",
            secondary: "#f2b179",
            ink: "#4b3822"
        }),
        darkTheme: Object.freeze({
            background: "#1e1e1e",
            surface: "#2d2d2d",
            accent: "#e5aa28",
            secondary: "#c78042",
            ink: "#f0f0f0"
        })
    }),
    Object.freeze({
        id: "sudoku",
        title: "Sudoku",
        route: "sudoku.html",
        description: "Fill the grid so every row, column, and 3x3 box contains each digit once.",
        category: "Puzzle",
        iconText: "1-9",
        theme: Object.freeze({
            background: "#eaf4fc",
            surface: "#f8fcff",
            accent: "#3b82c4",
            secondary: "#77b7e5",
            ink: "#183b5b"
        }),
        darkTheme: Object.freeze({
            background: "#1e1e1e",
            surface: "#2d2d2d",
            accent: "#1e5f91",
            secondary: "#3478aa",
            ink: "#f0f0f0"
        })
    })
]);

const FALLBACK_GAME_THEME = Object.freeze({
    background: "#f4f1e8",
    surface: "#fffefa",
    accent: "#d6a927",
    secondary: "#d8894a",
    ink: "#473c2f"
});

function getGame(gameId) {
    return GAME_CATALOG.find((game) => game.id === gameId);
}

function applyGameTheme(element, game) {
    if (!element || !game) {
        return;
    }

    const configuredTheme = document.documentElement.dataset.siteTheme === "dark"
        ? game.darkTheme || game.theme
        : game.theme;

    Object.entries(FALLBACK_GAME_THEME).forEach(([name, fallback]) => {
        const configuredColor = configuredTheme?.[name];
        const color = typeof configuredColor === "string" && /^#[\da-f]{6}$/i.test(configuredColor)
            ? configuredColor
            : fallback;

        if (color === fallback && configuredColor !== fallback) {
            console.warn(`Using fallback ${name} color for ${game.title}.`);
        }

        element.style.setProperty(`--game-${name}`, color);
    });
}

function createGameCard(game) {
    const button = document.createElement("button");
    button.className = "game-card";
    button.type = "button";
    button.dataset.navigationTarget = game.id;
    button.dataset.gameCard = game.id;
    button.setAttribute("aria-label", `Play ${game.title}`);
    applyGameTheme(button, game);

    const icon = document.createElement("span");
    icon.className = "game-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = game.iconText;

    const copy = document.createElement("span");
    copy.className = "game-card-copy";

    const title = document.createElement("span");
    title.className = "game-card-title";
    title.textContent = game.title;

    const description = document.createElement("span");
    description.className = "game-card-description";
    description.textContent = game.description;

    const arrow = document.createElement("span");
    arrow.className = "game-card-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "\u21d2";

    copy.append(title, description);
    button.append(icon, copy, arrow);
    return button;
}

document.querySelectorAll("[data-game-list]").forEach((list) => {
    GAME_CATALOG.forEach((game) => list.append(createGameCard(game)));
});

document.querySelectorAll("[data-featured-game]").forEach((slot) => {
    const game = getGame(slot.dataset.featuredGame);
    if (!game) {
        throw new Error(`Unknown featured game: ${slot.dataset.featuredGame}`);
    }

    slot.append(createGameCard(game));
});

document.addEventListener("site-theme-change", () => {
    document.querySelectorAll("[data-game-card]").forEach((card) => {
        const game = getGame(card.dataset.gameCard);
        if (game) {
            applyGameTheme(card, game);
        }
    });
});
