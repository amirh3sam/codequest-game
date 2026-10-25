import type { Page } from "@playwright/test";

export async function openAdventureTool(page: Page, name: string): Promise<void> {
  if (name === "Menu") {
    if (await page.locator(".adventure-menu").isVisible()) return;
    const close = page.getByRole("button", { name: "Close panel", exact: true });
    if (await close.isVisible()) await close.click();
    const desktop = page.getByRole("button", { name: "Menu", exact: true });
    if (await desktop.isVisible()) await desktop.click();
    else await page.getByRole("button", { name: "Open game menu", exact: true }).click();
    return;
  }
  if (name === "Learning adventures") {
    await openAdventureTool(page, "My adventure");
    const free = page.locator(".path-free-play");
    if ((await free.getAttribute("open")) === null) await free.locator("summary").click();
    return;
  }
  if (name === "Start from zero") {
    await openAdventureTool(page, "Learning adventures");
    await page.getByRole("button", { name: "Open Robot rescue", exact: true }).click();
    return;
  }
  const routes: Record<string, readonly [string, string]> = {
    Training: ["Help & controls", "Open player handbook"],
    "Guide tour": ["Help & controls", "Show controls tour"],
    Lesson: ["Help & controls", "Read district examples"],
    Mission: ["City activities", "Courier mission"],
    Lighting: ["City activities", "Lighting console"],
    "Accessibility & controls": ["Help & controls", "Accessibility & controls"],
    "Manage character": ["Save & profile", "Manage character"],
    "Switch adventure": ["Save & profile", "Switch adventure"],
    "Save backup file": ["Save & profile", "Save backup file"],
    "Load backup file": ["Save & profile", "Load backup file"],
    "Title screen": ["Save & profile", "Title screen"],
  };
  const route = routes[name];
  if (route) {
    if (!(await page.getByRole("button", { name: route[1], exact: true }).isVisible()))
      await openAdventureTool(page, route[0]);
    await page.getByRole("button", { name: route[1], exact: true }).click();
    return;
  }
  const tool = page.getByRole("button", { name, exact: true });
  if (!(await tool.isVisible())) {
    const close = page.getByRole("button", { name: "Close panel", exact: true });
    if (await close.isVisible()) await close.click();
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    if (await menu.isVisible()) await menu.click();
    else {
      const phoneMenu = page.getByRole("button", { name: "Open game menu", exact: true });
      if (await phoneMenu.isVisible()) await phoneMenu.click();
    }
  }
  await tool.click();
}
