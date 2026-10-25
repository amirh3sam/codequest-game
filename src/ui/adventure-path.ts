import { ADVENTURE_STEPS, type AdventureStepId, adventurePath } from "../core/adventure-path";
import type { GameState } from "../core/state";
import { button, el } from "./dom";
import "./adventure-path.css";

export function openAdventurePath(host: {
  state: GameState;
  fresh?: boolean;
  mentor: HTMLCanvasElement;
  courier: string;
  panel(): HTMLElement;
  start(id: AdventureStepId | "district"): void;
  freePlay(panel: HTMLElement): void;
  help(): void;
}): void {
  const path = adventurePath(host.state),
    panel = host.panel();
  panel.classList.add("adventure-path-panel");
  const hero = el("section", "path-coach"),
    portrait = el("div", "path-mentor"),
    speech = el("div", "path-speech");
  portrait.append(host.mentor);
  speech.append(
    el("span", "eyebrow", `${host.courier} · YOUR ADVENTURE PARTNER`),
    el(
      "h3",
      "",
      host.fresh
        ? `Welcome, ${host.state.hero.name}. I'll show you the way.`
        : path.next
          ? "One next step. We will build on what you know."
          : "You have built your first coding adventure!",
    ),
    el(
      "p",
      "",
      host.fresh
        ? "You don't need to know the menus or any programming. Follow one guided repair at a time. Then use your code to deliver supplies, build a game and restore this city."
        : "Your completed steps are remembered. Continue below; you can revisit earlier lessons or take an arcade break whenever you like.",
    ),
  );
  hero.append(portrait, speech);
  panel.append(hero);
  const current = el("section", "path-current");
  current.setAttribute("aria-label", "Your next adventure step");
  if (path.next) {
    const trip = host.state.journey?.companion?.trip,
      delivering = path.next.id === "robot" && trip && trip.next < 3;
    const savedGame = path.next.id === "game" && !!host.state.journey?.creations?.length;
    const action = delivering
      ? "Watch my delivery in the city"
      : savedGame
        ? "Play my saved game"
        : path.next.id === "basics" && host.state.beginner?.completed.length
          ? "Continue my robot rescue"
          : path.next.action;
    current.dataset.pathStep = path.next.id;
    current.append(
      el("span", "eyebrow", `NEXT · STEP ${path.index + 1} OF ${ADVENTURE_STEPS.length}`),
      el("h3", "", path.next.title),
      el("p", "path-learn", `You will learn: ${path.next.learn}`),
      el(
        "p",
        "",
        delivering
          ? `${trip.next}/3 deliveries complete. Your robot waits while a panel is open. Return to its city map to let it finish.`
          : path.next.goal,
      ),
      el("p", "path-expect", `What to expect: ${path.next.expect}`),
      button(action, () => host.start(path.next?.id ?? "district"), "button primary path-continue"),
    );
  } else
    current.append(
      el("span", "eyebrow", "FIRST ADVENTURE COMPLETE"),
      el("h3", "", "Your next city mission is ready"),
      el(
        "p",
        "",
        "Keep using your skills across the 23 districts. Each has eight tasks and a boss. Your robot, room, projects and free-play games stay with you.",
      ),
      button("Continue my next city mission", () => host.start("district"), "button primary path-continue"),
    );
  panel.append(current);
  const progress = el(
    "p",
    "path-progress",
    `${path.completed}/${ADVENTURE_STEPS.length} adventure steps complete · Progress saves with this character`,
  );
  progress.setAttribute("role", "status");
  panel.append(progress);
  const timeline = el("ol", "path-timeline");
  timeline.setAttribute("aria-label", "Your adventure in order");
  ADVENTURE_STEPS.forEach((step, index) => {
    const done = path.done[index],
      active = index === path.index,
      row = el("li", `path-step${done ? " complete" : active ? " current" : " upcoming"}`);
    row.dataset.pathStep = step.id;
    if (active) row.setAttribute("aria-current", "step");
    const marker = el("span", "path-step-number", done ? "✓" : String(index + 1)),
      body = el("div");
    body.append(
      el("strong", "", step.title),
      el(
        "small",
        "",
        done
          ? "Complete · replay whenever you want"
          : active
            ? `You are here · ${step.learn}`
            : `Up next · ${step.learn}`,
      ),
    );
    row.append(marker, body);
    if (done) row.append(button(`Replay ${step.title}`, () => host.start(step.id), "button path-replay"));
    timeline.append(row);
  });
  panel.append(timeline, button("Help with controls or coding", host.help, "button"));
  const extra = el("details", "path-free-play");
  extra.append(
    el("summary", "", "All activities · Free play"),
    el(
      "p",
      "muted",
      "Choose freely when you know what you want. The next-step button above always remembers your recommended order.",
    ),
  );
  const activities = el("div", "path-activities");
  host.freePlay(activities);
  extra.append(activities);
  panel.append(extra);
}
