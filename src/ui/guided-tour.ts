import type { GuideStep } from "../content/guided-tour";
import { type GuideRect, guidePlacement } from "../core/guided-tour";
import { button, el } from "./dom";
import "./guided-tour.css";

type GuideHost = {
  background: HTMLElement;
  steps: GuideStep[];
  initial: number;
  name: string;
  artwork: CanvasImageSource;
  prepare(step: GuideStep): void;
  progress(index: number): void;
  done(reason: "complete" | "skip" | "handbook"): void;
  download(): void;
};
const COLORS = ["#68e0e7", "#bba2ff", "#ffd48a", "#8ae8b1", "#8cbcff"];

/** A character-led walkthrough of live controls. The background is inert, never a fake screenshot. */
export function openGuidedTour(host: GuideHost): () => void {
  const root = el("div", "guide-tour"),
    shade = el("div", "guide-shade"),
    ring = el("div", "guide-ring"),
    arrow = el("div", "guide-arrow", "➜"),
    card = el("section", "guide-card");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-roledescription", "guided tour");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-labelledby", "guide-heading");
  card.setAttribute("aria-describedby", "guide-full-text");
  root.dataset.largeText = host.background.dataset.largeText;
  root.dataset.highContrast = host.background.dataset.highContrast;
  ring.setAttribute("aria-hidden", "true");
  arrow.setAttribute("aria-hidden", "true");
  const heading = el("h2"),
    fullText = el("p", "guide-sr"),
    visibleText = el("p", "guide-copy"),
    count = el("span", "guide-count"),
    avatar = el("canvas", "guide-avatar");
  heading.id = "guide-heading";
  fullText.id = "guide-full-text";
  fullText.hidden = true;
  visibleText.tabIndex = 0;
  visibleText.setAttribute("role", "region");
  visibleText.setAttribute("aria-label", "Tour caption");
  visibleText.setAttribute("aria-live", "off");
  avatar.width = 96;
  avatar.height = 112;
  avatar.setAttribute("aria-hidden", "true");
  avatar.getContext("2d")?.drawImage(host.artwork, 0, 0, 96, 112, 0, 0, 96, 112);
  const identity = el("div", "guide-identity"),
    titles = el("div"),
    channel = el("span", "guide-channel", `${host.name} · YOUR CITY GUIDE`);
  titles.append(channel, heading);
  identity.append(
    avatar,
    titles,
    button("×", () => host.done("skip"), "guide-close"),
  );
  identity.lastElementChild?.setAttribute("aria-label", "Close guide tour");
  const meter = el("div", "guide-meter"),
    fill = el("span");
  meter.append(fill);
  meter.setAttribute("role", "progressbar");
  meter.setAttribute("aria-label", "Guide tour progress");
  meter.setAttribute("aria-valuemin", "1");
  meter.setAttribute("aria-valuemax", String(host.steps.length));
  const chooseLabel = el("label", "guide-topics", "Jump to a topic"),
    choose = el("select");
  choose.setAttribute("aria-label", "Guide tour topic");
  for (const [i, step] of host.steps.entries()) {
    const option = el("option", "", `${String(i + 1).padStart(2, "0")} · ${step.title}`);
    option.value = String(i);
    choose.append(option);
  }
  chooseLabel.append(choose);
  const reveal = button("Show all text", () => showText(), "guide-text-toggle");
  const download = button("Download my adventure backup", host.download, "button guide-download");
  const controls = el("div", "guide-controls"),
    back = button("Back", () => go(index - 1)),
    skip = button("Skip tour", () => host.done("skip")),
    next = button(
      "Next →",
      () => (index === host.steps.length - 1 ? host.done("complete") : go(index + 1)),
      "button primary",
    );
  controls.append(back, skip, next);
  const links = el("div", "guide-links");
  links.append(
    count,
    button("Open detailed handbook", () => host.done("handbook"), "guide-handbook"),
  );
  card.append(identity, meter, chooseLabel, fullText, visibleText, reveal, download, controls, links);
  root.append(shade, ring, arrow, card);
  const priorFocus = document.activeElement as HTMLElement | null,
    wasInert = host.background.inert;
  host.background.inert = true;
  document.body.append(root);
  document.body.classList.add("guide-tour-open");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let index = Math.max(0, Math.min(host.steps.length - 1, host.initial)),
    timer = 0,
    frame = 0,
    alive = true,
    revealed = 0,
    target: HTMLElement | null = null,
    lastTarget: HTMLElement | null = null;
  const resize = new ResizeObserver(schedule);
  resize.observe(card);
  const observer = new MutationObserver(schedule);
  observer.observe(host.background, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "class"],
  });
  function visible(node: HTMLElement) {
    const r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(node).visibility !== "hidden";
  }
  function findTarget() {
    const step = host.steps[index];
    const candidates = step.button
      ? [...host.background.querySelectorAll<HTMLElement>("button")].filter(
          (node) => node.textContent?.trim() === step.button,
        )
      : step.target
        ? [...host.background.querySelectorAll<HTMLElement>(step.target)]
        : [];
    return candidates.find(visible) ?? null;
  }
  function schedule() {
    if (alive && !frame)
      frame = requestAnimationFrame(() => {
        frame = 0;
        position();
      });
  }
  function position() {
    if (!alive) return;
    const captionScroll = visibleText.scrollTop;
    card.style.maxHeight = "";
    card.classList.remove("guide-compact");
    target = findTarget();
    if (target !== lastTarget) {
      lastTarget = target;
      target?.scrollIntoView({
        block: innerWidth < 700 || innerHeight < 500 ? "start" : "nearest",
        inline: "nearest",
        behavior: "instant",
      });
    }
    let focus: GuideRect | undefined;
    if (target) {
      const r = target.getBoundingClientRect(),
        left = Math.max(8, r.left - 6),
        top = Math.max(8, r.top - 6);
      const right = Math.min(innerWidth - 8, r.right + 6),
        bottom = Math.min(
          innerHeight - 8,
          r.bottom + 6,
          top + Math.min(innerWidth < 700 ? 140 : 200, innerHeight * 0.3),
        );
      if (right > left && bottom > top) {
        const beside = innerWidth - left - card.getBoundingClientRect().width - 50 - 12;
        const width =
          innerHeight < 500 && innerWidth >= 700 && beside >= 100 ? Math.min(right - left, beside) : right - left;
        focus = { left, top, width, height: bottom - top };
      }
    }
    ring.hidden = !focus;
    shade.classList.toggle("guide-has-target", !!focus);
    root.dataset.target = target ? host.steps[index].id : "";
    if (focus) {
      Object.assign(ring.style, {
        left: `${focus.left}px`,
        top: `${focus.top}px`,
        width: `${focus.width}px`,
        height: `${focus.height}px`,
      });
    }
    let size = card.getBoundingClientRect(),
      place = guidePlacement(innerWidth, innerHeight, size, focus);
    if (focus) {
      const overlaps = () =>
        focus &&
        place.left < focus.left + focus.width &&
        place.left + size.width > focus.left &&
        place.top < focus.top + focus.height &&
        place.top + size.height > focus.top;
      const gap = innerWidth >= 700 ? 50 : 18;
      const available = Math.max(focus.top - gap - 12, innerHeight - focus.top - focus.height - gap - 12);
      if (overlaps()) {
        const minimum = size.height - visibleText.getBoundingClientRect().height + 40;
        if (available < minimum) card.classList.add("guide-compact");
        size = card.getBoundingClientRect();
        const compactMinimum = size.height - visibleText.getBoundingClientRect().height + 40;
        if (available >= compactMinimum) card.style.maxHeight = `${Math.floor(available)}px`;
        size = card.getBoundingClientRect();
        place = guidePlacement(innerWidth, innerHeight, size, focus);
      }
    }
    Object.assign(card.style, { left: `${place.left}px`, top: `${place.top}px` });
    visibleText.scrollTop = captionScroll;
    if (reveal.disabled)
      reveal.textContent =
        visibleText.scrollHeight > visibleText.clientHeight + 2 ? "Scroll caption for more ↓" : "Full text shown";
    arrow.hidden = true;
    if (focus && innerWidth >= 700) {
      const cx = focus.left + focus.width / 2,
        cy = focus.top + focus.height / 2,
        bx = place.left + size.width / 2,
        by = place.top + size.height / 2;
      const angle = Math.atan2(cy - by, cx - bx),
        extent = Math.min(
          Math.abs(focus.width / (2 * Math.cos(angle))),
          Math.abs(focus.height / (2 * Math.sin(angle))),
        );
      const x = cx - Math.cos(angle) * (extent + 17),
        y = cy - Math.sin(angle) * (extent + 17);
      if (
        x < place.left - 14 ||
        x > place.left + size.width + 14 ||
        y < place.top - 14 ||
        y > place.top + size.height + 14
      ) {
        arrow.hidden = false;
        Object.assign(arrow.style, { left: `${x - 14}px`, top: `${y - 14}px`, transform: `rotate(${angle}rad)` });
      }
    }
  }
  function showText() {
    clearTimeout(timer);
    visibleText.textContent = host.steps[index].text;
    revealed = host.steps[index].text.length;
    root.classList.remove("guide-talking");
    reveal.disabled = true;
    reveal.textContent = "Full text shown";
    schedule();
  }
  function type() {
    if (!alive) return;
    const text = host.steps[index].text;
    if (revealed >= text.length) {
      showText();
      return;
    }
    revealed = Math.min(text.length, revealed + 2);
    visibleText.textContent = text.slice(0, revealed);
    timer = window.setTimeout(type, /[.!?]/.test(text[revealed - 1]) ? 140 : 24);
  }
  function go(nextIndex: number) {
    if (!alive || nextIndex < 0 || nextIndex >= host.steps.length) return;
    clearTimeout(timer);
    index = nextIndex;
    lastTarget = null;
    const step = host.steps[index];
    root.dataset.step = step.id;
    root.style.setProperty("--guide-color", COLORS[index % COLORS.length]);
    host.prepare(step);
    host.progress(index);
    heading.textContent = step.title;
    fullText.textContent = step.text;
    count.textContent = `${String(index + 1)} / ${host.steps.length}`;
    choose.value = String(index);
    meter.setAttribute("aria-valuenow", String(index + 1));
    fill.style.width = `${((index + 1) / host.steps.length) * 100}%`;
    back.disabled = index === 0;
    next.textContent = index === host.steps.length - 1 ? "Finish tour" : "Next →";
    download.hidden = !step.download;
    // Reserve the full caption's height before typing, so the guide and arrow stay still.
    visibleText.style.height = "";
    visibleText.textContent = step.text;
    visibleText.scrollTop = 0;
    visibleText.style.height = `${Math.max(64, Math.min(visibleText.scrollHeight, innerHeight * 0.3, 200))}px`;
    if (motion.matches) showText();
    else {
      revealed = 0;
      visibleText.textContent = "";
      root.classList.add("guide-talking");
      reveal.disabled = false;
      reveal.textContent = "Show all text";
      type();
    }
    position();
    next.focus({ preventScroll: true });
  }
  choose.addEventListener("change", () => {
    go(Number(choose.value));
    choose.focus({ preventScroll: true });
  });
  const keyboard = (event: KeyboardEvent) => {
    if (!alive) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      host.done("skip");
      return;
    }
    if (event.key === "Tab") {
      const nodes = [...card.querySelectorAll<HTMLElement>('button:not(:disabled),select,[tabindex="0"]')].filter(
        (node) => !node.hidden && node.getClientRects().length,
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (
        (event.shiftKey && document.activeElement === first) ||
        (!event.shiftKey && document.activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
      event.stopImmediatePropagation();
    } else if (document.activeElement === visibleText) {
      event.stopImmediatePropagation();
      const amount = {
        ArrowDown: 32,
        ArrowUp: -32,
        PageDown: visibleText.clientHeight * 0.8,
        PageUp: -visibleText.clientHeight * 0.8,
      }[event.key];
      if (amount !== undefined) {
        event.preventDefault();
        visibleText.scrollTop += amount;
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        visibleText.scrollTop = event.key === "Home" ? 0 : visibleText.scrollHeight;
      }
    } else if (document.activeElement?.matches("select")) {
      event.stopImmediatePropagation();
    } else if (["ArrowRight", "ArrowLeft"].includes(event.key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      go(index + (event.key === "ArrowRight" ? 1 : -1));
    }
  };
  window.addEventListener("keydown", keyboard, true);
  window.addEventListener("resize", schedule);
  const scroll = (event: Event) => {
    if (!(event.target instanceof Node && root.contains(event.target))) schedule();
  };
  window.addEventListener("scroll", scroll, true);
  const changeMotion = () => {
    if (motion.matches) showText();
  };
  motion.addEventListener("change", changeMotion);
  go(index);
  return () => {
    if (!alive) return;
    alive = false;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    resize.disconnect();
    observer.disconnect();
    window.removeEventListener("keydown", keyboard, true);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("scroll", scroll, true);
    motion.removeEventListener("change", changeMotion);
    root.remove();
    host.background.inert = wasInert;
    document.body.classList.remove("guide-tour-open");
    if (priorFocus?.isConnected) priorFocus.focus({ preventScroll: true });
  };
}
