class Navigation {
    static goto(place) {
        const destinations = {
            Home: "Home.html",
            games: "games.html"
        };
        const game = getGame(place);
        const destination = game ? game.route : destinations[place];

        if (!destination) {
            throw new Error(`Unknown navigation destination: ${place}`);
        }

        window.location.href = destination;
    }
}

document.querySelectorAll("[data-navigation-target]").forEach((button) => {
    button.addEventListener("click", () => {
        Navigation.goto(button.dataset.navigationTarget);
    });
});