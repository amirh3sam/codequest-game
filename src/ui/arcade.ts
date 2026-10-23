import { button, el } from "./dom";
import { openPacketDash } from "./packet-dash";
import { openSignalStack } from "./signal-stack";

export type ArcadeHost = {
  name: string;
  runner: HTMLCanvasElement;
  packetDashBest: number;
  signalStackBest: number;
  panel(title: string, subtitle: string, wide?: boolean): HTMLElement;
  recordPacketDash(score: number): void;
  recordSignalStack(score: number): void;
};

export function openArcade(host: ArcadeHost): void {
  const panel = host.panel(
    "City Arcade",
    `${host.name}'s free-play corner · every adventure keeps its own records`,
    true,
  );
  panel.classList.add("city-arcade");
  panel.append(
    el("p", "arcade-intro", "Take a break from coding. These quick games are optional and never spend hearts or gems."),
  );
  const games = el("div", "arcade-game-grid");
  const dash = el("article", "arcade-game-card packet-card");
  dash.append(
    el("span", "arcade-game-art", "RUN / JUMP / COLLECT"),
    el("h3", "", "Packet Dash"),
    el("p", "", `Run the skyline, jump signal glitches and collect data bits. Personal best: ${host.packetDashBest}.`),
    button("Play Packet Dash", () => {
      openPacketDash({
        name: host.name,
        best: host.packetDashBest,
        runner: host.runner,
        panel: host.panel,
        record: host.recordPacketDash,
        lobby: () => openArcade(host),
      });
    }),
  );
  const stack = el("article", "arcade-game-card stack-card");
  stack.append(
    el("span", "arcade-game-art", "TIME / DROP / BUILD"),
    el("h3", "", "Signal Stack"),
    el("p", "", `Line up moving signal relays and build a tower. Personal best: level ${host.signalStackBest}.`),
    button("Play Signal Stack", () => {
      openSignalStack({
        name: host.name,
        best: host.signalStackBest,
        panel: host.panel,
        record: host.recordSignalStack,
        lobby: () => openArcade(host),
      });
    }),
  );
  games.append(dash, stack);
  panel.append(games);
}
