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
  const held = new Map<number, { x: -1 | 0 | 1; y: -1 | 0 | 1 }>();
  const update = () => {
    let x: -1 | 0 | 1 = 0,
      y: -1 | 0 | 1 = 0;
    for (const direction of held.values()) {
      x = (x + direction.x) as -1 | 0 | 1;
      y = (y + direction.y) as -1 | 0 | 1;
    }
    host.axis(Math.max(-1, Math.min(1, x)) as -1 | 0 | 1, Math.max(-1, Math.min(1, y)) as -1 | 0 | 1);
  };
  for (const [label, x, y, glyph] of [
    ["Move up", 0, -1, "↑"],
    ["Move left", -1, 0, "←"],
    ["Move down", 0, 1, "↓"],
    ["Move right", 1, 0, "→"],
  ] as const) {
    let pointerActivated = false;
    const control = button(
      glyph,
      () => {
        if (!pointerActivated) host.step(x, y);
      },
      "mobile-direction",
    );
    control.setAttribute("aria-label", label);
    control.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      event.preventDefault();
      pointerActivated = true;
      setTimeout(() => {
        pointerActivated = false;
      }, 350);
      held.set(event.pointerId, { x, y });
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
      host.step(direction.x, direction.y);
    };
    control.addEventListener("pointerup", release);
    control.addEventListener("pointercancel", release);
    control.addEventListener("lostpointercapture", release);
    pad.append(control);
  }
  const interact = button("E", host.interact, "mobile-interact");
  interact.setAttribute("aria-label", "Interact with nearby character or object");
  root.append(pad, interact);
  return root;
}
