import type { Page } from "@playwright/test";
import type Phaser from "phaser";
import type { Position } from "../../../src/core/state";

/** Check rendered world bounds while allowing labels that belong to their own device. */
export async function mapLayoutConflicts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    type Box = {
      id: string;
      parent: string;
      kind: "object" | "scenery";
      x: number;
      y: number;
      width: number;
      height: number;
    };
    type Scene = Phaser.Scene & {
      markers: { id: string; icon: Phaser.GameObjects.Image }[];
      levelPortal: { view: Phaser.GameObjects.Container };
      communityBeacon: { position: Position | null };
      hero: Phaser.GameObjects.Image;
      prompt: Phaser.GameObjects.Text;
    };
    const scene = (window as unknown as { __codequest: { game: Phaser.Game } }).__codequest.game.scene.getScene(
      "boot",
    ) as Scene;
    const objects: Box[] = [],
      labels: Box[] = [];
    const add = (
      id: string,
      parent: string,
      kind: Box["kind"],
      bounds: { x: number; y: number; width: number; height: number },
    ) => objects.push({ id, parent, kind, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
    const texts = (object: Phaser.GameObjects.GameObject, parent: string) => {
      if (!(object as unknown as Phaser.GameObjects.Components.Visible).visible) return;
      if (object.type === "Text" && object !== scene.prompt) {
        const text = object as Phaser.GameObjects.Text;
        if (text.text) labels.push({ id: text.text, parent, kind: "object", ...text.getBounds() });
      }
      if (object.type === "Container")
        for (const child of (object as Phaser.GameObjects.Container).list) texts(child, parent);
    };
    for (const marker of scene.markers) add(marker.id, marker.id, "object", marker.icon.getBounds());
    const portal = scene.levelPortal.view;
    const zone = portal.getByName("level-portal-zone") as Phaser.GameObjects.Zone;
    add("transit", portal.name, "object", zone.getBounds());
    const beacon = scene.communityBeacon.position;
    if (beacon)
      add("lighting console", "community-beacon", "object", {
        x: beacon.x - 29,
        y: beacon.y - 70,
        width: 58,
        height: 73,
      });
    for (const [objectIndex, object] of scene.children.list.entries()) {
      if (!(object as unknown as Phaser.GameObjects.Components.Visible).visible) continue;
      texts(object, object.name || `world-${objectIndex}`);
      const obstacles = object.getData("layout-obstacles") as
        | { id: string; x: number; y: number; width: number; height: number }[]
        | undefined;
      for (const obstacle of obstacles ?? []) add(obstacle.id, object.name, "scenery", obstacle);
      if (object.type === "Image" && (object as Phaser.GameObjects.Image).texture.key.startsWith("environment-"))
        add(object.name, object.name, "scenery", (object as Phaser.GameObjects.Image).getBounds());
      if (object.name === "routing-control-hub")
        add(object.name, object.name, "scenery", (object as Phaser.GameObjects.Container).getBounds());
      if (object.name === "courier-kai") {
        const avatar = (object as Phaser.GameObjects.Container).list.find((child) => child.type === "Image") as
          | Phaser.GameObjects.Image
          | undefined;
        if (avatar) add("courier", object.name, "object", avatar.getBounds());
      }
    }
    add("arrival", "player", "object", scene.hero.getBounds());
    const overlaps = (a: Box, b: Box) =>
      Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 3 &&
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 3;
    const conflicts: string[] = [];
    for (let a = 0; a < objects.length; a++)
      for (let b = a + 1; b < objects.length; b++) {
        const first = objects[a],
          second = objects[b];
        if (
          !first ||
          !second ||
          first.parent === second.parent ||
          (first.kind === "scenery" && second.kind === "scenery")
        )
          continue;
        if (overlaps(first, second)) conflicts.push(`${first.id} overlaps ${second.id}`);
      }
    for (const label of labels)
      for (const object of objects)
        if (label.parent !== object.parent && overlaps(label, object))
          conflicts.push(`Label "${label.id}" overlaps ${object.id}`);
    for (let a = 0; a < labels.length; a++)
      for (let b = a + 1; b < labels.length; b++) {
        const first = labels[a],
          second = labels[b];
        if (first && second && first.parent !== second.parent && overlaps(first, second))
          conflicts.push(`Labels "${first.id}" and "${second.id}" overlap`);
      }
    return conflicts;
  });
}
