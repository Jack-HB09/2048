const SITE_THEME_KEY = "little-arcade-theme";
const SITE_THEMES = ["light", "dark"];

function readSiteTheme() {
    try {
        const savedTheme = localStorage.getItem(SITE_THEME_KEY);
        return SITE_THEMES.includes(savedTheme) ? savedTheme : "light";
    } catch (error) {
        console.warn("Could not read the saved site theme.", error);
        return "light";
    }
}

function applySiteTheme(theme) {
    if (!SITE_THEMES.includes(theme)) {
        throw new Error(`Unknown site theme: ${theme}`);
    }

    document.documentElement.dataset.siteTheme = theme;
    document.querySelectorAll("#site-theme-select").forEach((select) => {
        select.value = theme;
    });
    document.querySelectorAll(".settings-theme-current").forEach((label) => {
        label.textContent = theme === "dark" ? "Dark" : "Light";
    });

    try {
        localStorage.setItem(SITE_THEME_KEY, theme);
    } catch (error) {
        console.warn("Could not save the selected site theme.", error);
    }

    document.dispatchEvent(new CustomEvent("site-theme-change", { detail: { theme } }));
}

function createSettingsMenu() {
    const navigation = document.querySelector(".site-nav");
    const actions = navigation?.querySelector(".site-nav-actions");
    if (!navigation || !actions) {
        return;
    }

    const menu = document.createElement("div");
    menu.className = "site-settings";
    menu.innerHTML = `
        <button class="settings-trigger" type="button" aria-label="Settings" aria-expanded="false" aria-controls="settings-panel" title="Settings">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
                <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.2 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.2a7 7 0 0 1 0 1.9Z" />
            </svg>
        </button>
        <div class="settings-panel" id="settings-panel" aria-label="Settings">
            <p class="settings-panel-title">Settings</p>
            <div class="settings-theme">
                <button class="settings-theme-row" type="button" aria-expanded="false" aria-controls="settings-theme-panel">
                    <span>Theme</span>
                    <span class="settings-theme-current" aria-hidden="true"></span>
                    <span class="settings-chevron" aria-hidden="true">›</span>
                </button>
                <div class="settings-theme-panel" id="settings-theme-panel">
                    <label class="settings-theme-label" for="site-theme-select">Theme</label>
                    <select class="site-theme-select" id="site-theme-select" name="theme">
                        <option value="light" style="background-color:#f2f4ee;color:#26352e">Light</option>
                        <option value="dark" style="background-color:#2d2d2d;color:#f0f0f0">Dark</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    actions.append(menu);

    const trigger = menu.querySelector(".settings-trigger");
    const themeRow = menu.querySelector(".settings-theme-row");
    const themeSelect = menu.querySelector("#site-theme-select");
    const currentThemeLabel = menu.querySelector(".settings-theme-current");
    currentThemeLabel.textContent = document.documentElement.dataset.siteTheme === "dark" ? "Dark" : "Light";

    trigger.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(isOpen));
    });

    themeRow.addEventListener("click", () => {
        const isExpanded = menu.classList.toggle("theme-expanded");
        themeRow.setAttribute("aria-expanded", String(isExpanded));
    });

    themeSelect.addEventListener("change", () => applySiteTheme(themeSelect.value));

    menu.addEventListener("focusout", (event) => {
        if (!menu.contains(event.relatedTarget)) {
            menu.classList.remove("is-open", "theme-expanded");
            trigger.setAttribute("aria-expanded", "false");
            themeRow.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target)) {
            menu.classList.remove("is-open", "theme-expanded");
            trigger.setAttribute("aria-expanded", "false");
            themeRow.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menu.classList.contains("is-open")) {
            menu.classList.remove("is-open", "theme-expanded");
            trigger.setAttribute("aria-expanded", "false");
            themeRow.setAttribute("aria-expanded", "false");
            trigger.focus();
        }
    });
}

applySiteTheme(readSiteTheme());
createSettingsMenu();
