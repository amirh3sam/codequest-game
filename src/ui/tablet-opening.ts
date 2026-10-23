import type { DeveloperKind } from "../game/tablet-frame";
import { button, el } from "./dom";

/** Own the temporary canvas and the city camera across skip, close and late imports. */
export function presentTabletOpening(
  panel: HTMLElement,
  kind: DeveloperKind,
  name: string,
  focusCamera: () => () => void,
  animate = true,
): () => void {
  const overlay = panel.parentElement;
  overlay?.classList.add("tablet-overlay");
  let disposed = false,
    finished = false,
    disposeScene: (() => void) | undefined;
  let restoreCamera = () => {};
  const reveal = () => {
    if (disposed || finished) return;
    finished = true;
    disposeScene?.();
    opening?.remove();
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    panel.classList.remove("tablet-waiting");
    panel.dataset.tabletStage = "ready";
    document.removeEventListener("keydown", shortcut);
    if (panel.isConnected) panel.querySelector<HTMLTextAreaElement>(".studio-code")?.focus();
  };
  const shortcut = (event: KeyboardEvent) => {
    if (event.code !== "KeyT" || event.repeat || finished) return;
    event.preventDefault();
    event.stopPropagation();
    reveal();
  };
  let opening: HTMLElement | undefined;
  if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reveal();
  } else {
    panel.classList.add("tablet-waiting");
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    panel.dataset.tabletStage = "opening";
    opening = el("section", "tablet-cinematic");
    opening.setAttribute("role", "dialog");
    opening.setAttribute("aria-modal", "true");
    opening.setAttribute("aria-label", "Opening developer tablet");
    opening.dataset.phase = "approach";
    const title = el("div", "tablet-shot-title");
    title.append(el("span", "eyebrow", "CODEQUEST / FIELD LINK"), el("strong", "", `${name}'s personal tablet`));
    const controls = el("div", "tablet-shot-controls");
    const skip = button("Skip animation", reveal);
    skip.setAttribute("aria-keyshortcuts", "T");
    controls.append(el("span", "", "T · Skip    Esc · Return to city"), skip);
    opening.append(title, controls);
    overlay?.append(opening);
    restoreCamera = focusCamera();
    document.addEventListener("keydown", shortcut);
    skip.focus();
    import("../game/tablet-cinematic")
      .then(({ playTabletCinematic }) => {
        if (disposed || finished || !opening?.isConnected) return;
        try {
          disposeScene = playTabletCinematic(opening, kind, name, reveal);
        } catch {
          reveal();
        }
      })
      .catch(reveal);
  }
  return () => {
    if (disposed) return;
    disposed = true;
    disposeScene?.();
    opening?.remove();
    restoreCamera();
    document.removeEventListener("keydown", shortcut);
    panel.inert = false;
  };
}
