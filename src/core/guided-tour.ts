export const GUIDE_KEY = "codequest:guide-tour:v1";
export type GuideProgress = { version: 1; status: "new" | "in-progress" | "complete" | "skipped"; index: number };
export function readGuideProgress(storage?: Pick<Storage, "getItem">): GuideProgress {
  const fallback: GuideProgress = { version: 1, status: "new", index: 0 };
  try {
    const value = JSON.parse((storage ?? localStorage).getItem(GUIDE_KEY) ?? "null");
    if (
      value?.version !== 1 ||
      !["new", "in-progress", "complete", "skipped"].includes(value.status) ||
      !Number.isInteger(value.index) ||
      value.index < 0 ||
      value.index > 50
    )
      return fallback;
    return { version: 1, status: value.status, index: value.index };
  } catch {
    return fallback;
  }
}
export function saveGuideProgress(value: GuideProgress): void {
  try {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(value));
  } catch {
    /* Tour still works without persistence. */
  }
}
export type GuideRect = { left: number; top: number; width: number; height: number };
/** Place the speech bubble beside the highlighted control, or dock away from it on phones. */
export function guidePlacement(
  width: number,
  height: number,
  card: { width: number; height: number },
  target?: GuideRect,
): { left: number; top: number } {
  const pad = 12,
    gap = width >= 700 ? 50 : 18,
    clampX = (x: number) => Math.max(pad, Math.min(width - card.width - pad, x)),
    clampY = (y: number) => Math.max(pad, Math.min(height - card.height - pad, y));
  if (!target) return { left: clampX((width - card.width) / 2), top: clampY((height - card.height) / 2) };
  const right = target.left + target.width,
    bottom = target.top + target.height;
  if (width >= 700 && right + gap + card.width <= width - pad) return { left: right + gap, top: clampY(target.top) };
  if (width >= 700 && target.left - gap - card.width >= pad)
    return { left: target.left - gap - card.width, top: clampY(target.top) };
  if (bottom + gap + card.height <= height - pad)
    return { left: clampX(target.left + target.width / 2 - card.width / 2), top: bottom + gap };
  if (target.top - gap - card.height >= pad)
    return { left: clampX(target.left + target.width / 2 - card.width / 2), top: target.top - gap - card.height };
  return {
    left: clampX((width - card.width) / 2),
    top: target.top + target.height / 2 < height / 2 ? clampY(height - card.height - pad) : pad,
  };
}
