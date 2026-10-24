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

    Object.entries(FALLBACK_GAME_THEME).forEach(([name, fallback]) => {
        const configuredColor = game.theme?.[name];
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

    const category = document.createElement("span");
    category.className = "game-card-category";
    category.textContent = game.category;

    const arrow = document.createElement("span");
    arrow.className = "game-card-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "\u2192";

    copy.append(title, description, category);
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

document.querySelectorAll("[data-game-page]").forEach((page) => {
    const game = getGame(page.dataset.gamePage);
    if (!game) {
        throw new Error(`Unknown game page: ${page.dataset.gamePage}`);
    }

    applyGameTheme(page, game);
});
