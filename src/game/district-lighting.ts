import type Phaser from "phaser";
import { LIGHT_COLORS, type LightTarget, resolveLights } from "../core/map-lighting";
import type { GameState } from "../core/state";
import { districtLayout } from "./district-layout";

/** Two live light rails link each terminal to the next, with independent circuits. */
export class DistrictLighting {
  private readonly art: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.art = scene.add.graphics().setDepth(2).setName("district-lighting");
  }
  sync(state: GameState | null): void {
    this.art.clear().setVisible(Boolean(state));
    if (!state) return;
    const layout = districtLayout(state.currentArea),
      saved = state.areas[state.currentArea].lighting;
    const circuits = layout.tasks.map((point, index) => {
      const start = index === 0 ? layout.lesson : layout.tasks[index - 1];
      const target = `terminal-${index + 1}` as LightTarget;
      const command = resolveLights(saved, target);
      const color = command.power === "online" ? LIGHT_COLORS[command.color] : 0x34414c;
      if (start) {
        const dx = point.x - start.x,
          dy = point.y - start.y,
          length = Math.hypot(dx, dy) || 1;
        const nx = (-dy / length) * 10,
          ny = (dx / length) * 10;
        for (const side of [-1, 1]) {
          if (command.power === "online")
            this.art
              .lineStyle(9, color, 0.08)
              .lineBetween(start.x + nx * side, start.y + ny * side, point.x + nx * side, point.y + ny * side);
          this.art
            .lineStyle(2, color, command.power === "online" ? 0.82 : 0.32)
            .lineBetween(start.x + nx * side, start.y + ny * side, point.x + nx * side, point.y + ny * side);
        }
      }
      this.art.lineStyle(2, color, command.power === "online" ? 0.85 : 0.3).strokeCircle(point.x, point.y, 32);
      return { target, ...command };
    });
    this.art.setData("circuits", circuits);
  }
}
