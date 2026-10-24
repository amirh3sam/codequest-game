import { button, el } from "./dom";

/** Keep portrait for menus; pause the city until there is room to play in landscape. */
export function mobileViewport(host: { pause(value: boolean): void; menu(): void }) {
  const portrait = window.matchMedia("(pointer: coarse) and (orientation: portrait)");
  const touch = window.matchMedia("(pointer: coarse)");
  const root = el("section", "rotate-prompt");
  root.setAttribute("aria-label", "Landscape play required");
  const card = el("div", "rotate-card");
  const phone = el("div", "rotate-phone", "↻");
  phone.setAttribute("aria-hidden", "true");
  const hint = el("p", "", "Turn your phone sideways to explore the city. Your adventure is saved.");
  const requestLandscape = async () => {
    if (!touch.matches) return;
    const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
    try {
      if (!orientation?.lock) return;
      if (!document.fullscreenElement && document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      await orientation.lock("landscape");
    } catch {
      hint.textContent = "Turn your phone sideways to play. If it stays upright, turn on Auto-rotate on your phone.";
    }
  };
  card.append(
    phone,
    el("span", "eyebrow", "ROOM TO EXPLORE"),
    el("h2", "", "Rotate to play"),
    hint,
    button("Play in landscape", () => void requestLandscape(), "button primary"),
    button("Open game menu", host.menu),
  );
  root.append(card);
  let active = false,
    overlayOpen = true,
    paused = false;
  const refresh = () => {
    const next = active && portrait.matches;
    root.hidden = !next || overlayOpen;
    if (next !== paused) {
      paused = next;
      host.pause(next);
    }
  };
  portrait.addEventListener("change", refresh);
  refresh();
  return {
    element: root,
    requestLandscape,
    sync(adventureActive: boolean, panelOpen: boolean) {
      active = adventureActive;
      overlayOpen = panelOpen;
      refresh();
    },
  };
}
