import { button, el } from "./dom";

export type MobileControlsHost = {
  axis(x: -1 | 0 | 1, y: -1 | 0 | 1): void;
  step(x: -1 | 0 | 1, y: -1 | 0 | 1): void;
  interact(): void;
};

/** Thumb friendly D-pad. Pointer holds move continuously; short taps still make a useful step. */
export function mobileControls(host: MobileControlsHost): HTMLElement {
  const root = el("div", "mobile-controls");
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Character movement controls");
  const pad = el("div", "mobile-pad");
  const held = new Map<number, { x: -1 | 0 | 1; y: -1 | 0 | 1; since: number }>();
  const update = () => {
    let x = 0,
      y = 0;
    for (const direction of held.values()) {
      x += direction.x;
      y += direction.y;
    }
    host.axis(Math.max(-1, Math.min(1, x)) as -1 | 0 | 1, Math.max(-1, Math.min(1, y)) as -1 | 0 | 1);
  };
  for (const [label, x, y, glyph] of [
    ["Move up", 0, -1, "↑"],
    ["Move left", -1, 0, "←"],
    ["Move down", 0, 1, "↓"],
    ["Move right", 1, 0, "→"],
  ] as const) {
    const control = el("button", "mobile-direction", glyph);
    control.type = "button";
    control.addEventListener("click", (event) => {
      // Keyboard activation has no pointer release; touch/mouse clicks were handled there.
      if (event.detail === 0) host.step(x, y);
    });
    control.setAttribute("aria-label", label);
    control.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      held.set(event.pointerId, { x, y, since: performance.now() });
      control.classList.add("held");
      try {
        control.setPointerCapture(event.pointerId);
      } catch {
        /* Pointer capture is optional. */
      }
      update();
    });
    const release = (event: PointerEvent) => {
      const direction = held.get(event.pointerId);
      if (!direction) return;
      held.delete(event.pointerId);
      control.classList.remove("held");
      update();
      if (event.type === "pointerup" && performance.now() - direction.since < 150) host.step(direction.x, direction.y);
    };
    control.addEventListener("pointerup", release);
    control.addEventListener("pointercancel", release);
    control.addEventListener("lostpointercapture", release);
    pad.append(control);
  }
  const interact = button("E", host.interact, "mobile-interact");
  interact.setAttribute("aria-label", "Interact with nearby character or object");
  root.append(pad, interact);
  const reset = () => {
    held.clear();
    for (const control of pad.children) control.classList.remove("held");
    host.axis(0, 0);
  };
  root.addEventListener("releasecontrols", reset);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  return root;
}
