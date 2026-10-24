import { el } from "./dom";

/** Keep the editor usable while allowing a larger, independently scrolling output. */
export function attachOutputResizer(workspace: HTMLElement, output: HTMLElement): () => void {
  const divider = el("div", "studio-output-resizer");
  divider.setAttribute("role", "separator");
  divider.setAttribute("aria-label", "Resize output panel");
  divider.setAttribute("aria-orientation", "horizontal");
  divider.setAttribute("aria-controls", "practice-output-panel");
  divider.title = "Drag up for more output · Arrow keys resize · Home / End";
  divider.tabIndex = 0;
  output.id = "practice-output-panel";
  output.before(divider);
  const key = "codequest:output-height:v1";
  let preferred = Math.min(210, Math.max(88, innerHeight * 0.2));
  try {
    const saved = Number(localStorage.getItem(key));
    if (Number.isFinite(saved) && saved >= 64 && saved <= 500) preferred = saved;
  } catch {
    /* Resizing also works without browser storage. */
  }
  let current = preferred,
    maximum = 500;
  const apply = () => {
    if (!workspace.clientHeight) return;
    let fixed = 0;
    for (const child of workspace.children) {
      if (child === output || child === divider || child.classList.contains("studio-code-grid")) continue;
      const style = getComputedStyle(child);
      fixed +=
        child.getBoundingClientRect().height +
        (Number.parseFloat(style.marginTop) || 0) +
        (Number.parseFloat(style.marginBottom) || 0);
    }
    maximum = Math.max(64, Math.min(500, Math.floor(workspace.clientHeight - fixed - 120 - 12)));
    current = Math.round(Math.min(maximum, Math.max(64, preferred)));
    output.style.setProperty("--output-height", `${current}px`);
    divider.setAttribute("aria-valuemin", "64");
    divider.setAttribute("aria-valuemax", String(maximum));
    divider.setAttribute("aria-valuenow", String(current));
    divider.setAttribute("aria-valuetext", `${current} pixels high`);
  };
  const persist = () => {
    try {
      localStorage.setItem(key, String(current));
    } catch {
      /* Keep the session size. */
    }
  };
  let drag: { id: number; y: number; height: number } | null = null;
  divider.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    divider.focus({ preventScroll: true });
    drag = { id: event.pointerId, y: event.clientY, height: current };
    divider.setPointerCapture(event.pointerId);
    divider.classList.add("dragging");
  });
  divider.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    preferred = Math.min(maximum, Math.max(64, drag.height + drag.y - event.clientY));
    apply();
  });
  const finish = () => {
    if (!drag) return;
    drag = null;
    divider.classList.remove("dragging");
    persist();
  };
  divider.addEventListener("pointerup", finish);
  divider.addEventListener("pointercancel", finish);
  divider.addEventListener("lostpointercapture", finish);
  divider.addEventListener("keydown", (event) => {
    const next =
      event.key === "ArrowUp"
        ? current + 20
        : event.key === "ArrowDown"
          ? current - 20
          : event.key === "Home"
            ? 64
            : event.key === "End"
              ? maximum
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    preferred = Math.min(maximum, Math.max(64, next));
    apply();
    persist();
  });
  const observer = new ResizeObserver(apply);
  observer.observe(workspace);
  for (const child of workspace.children) {
    if (child !== output && child !== divider && !child.classList.contains("studio-code-grid")) observer.observe(child);
  }
  apply();
  return () => {
    finish();
    observer.disconnect();
  };
}
