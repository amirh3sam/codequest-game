import type { Page } from "@playwright/test";

export async function openAdventureTool(page: Page, name: string): Promise<void> {
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
