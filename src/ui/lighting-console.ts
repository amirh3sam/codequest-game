import { lightingCode } from "../content/lighting-code";
import {
  type DistrictLights,
  LIGHT_COLORS,
  LIGHT_TARGETS,
  type LightColor,
  type LightCommand,
  type LightTarget,
  parseLightOutput,
  resolveLights,
} from "../core/map-lighting";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";

type LightingHost = {
  lang: Lang;
  district: string;
  lighting?: DistrictLights;
  panel(title: string, subtitle: string, wide: boolean): HTMLElement;
  run(code: string): Promise<RunResult>;
  apply(target: LightTarget, command: LightCommand): void;
  close(): void;
};

export function openLightingConsole(host: LightingHost): void {
  const panel = host.panel(
    "Community beacon · City lights",
    `${host.district} · Change the actual map with your code`,
    true,
  );
  panel.classList.add("lighting-console");
  let lighting = host.lighting,
    target: LightTarget = "all",
    running = false;
  const drafts = new Map<LightTarget, string>();
  const layout = el("div", "editor-columns"),
    instructions = el("div", "instructions"),
    work = el("div", "code-workspace");
  const targetLabel = el("label", "editor-label", "Choose part of this map");
  const parts = el("select", "lighting-target");
  parts.id = "lighting-target";
  targetLabel.htmlFor = parts.id;
  for (const id of LIGHT_TARGETS) {
    const option = el(
      "option",
      "",
      id === "all" ? "Whole district · all eight routes" : `Task ${id.slice(9)} · its two light rails`,
    );
    option.value = id;
    parts.append(option);
  }
  instructions.append(
    el("span", "eyebrow", "STRINGS → REAL CITY LIGHTS"),
    el("h3", "", "Program the lights"),
    el(
      "p",
      "",
      'Print "offline" to turn the selected lights off. Print "online" to turn them on. Print a color to recolor the two parallel rails around the tasks.',
    ),
    el(
      "p",
      "",
      "You can print the power setting and the color on separate lines. Choosing the whole district replaces all individual circuit settings. This activity is free and saves separately for every map.",
    ),
    targetLabel,
    parts,
  );
  const shortcuts = el("div", "lighting-presets");
  const codeLabel = el("label", "editor-label", "Lighting code"),
    code = el("textarea", "code-editor");
  code.id = "lighting-code";
  codeLabel.htmlFor = code.id;
  code.spellcheck = false;
  code.autocapitalize = "off";
  code.rows = host.lang === "java" ? 12 : 7;
  const output = el("pre", "output", "Run your code to send commands to this map.");
  output.setAttribute("aria-label", "Lighting output");
  const feedback = el("p", "feedback", "Edit the quoted words, then run your code. The lights update immediately.");
  feedback.setAttribute("role", "status");
  const preview = el("div", "lighting-circuit-preview");
  preview.setAttribute("aria-label", "Saved map lighting");
  const drawPreview = () => {
    preview.replaceChildren();
    for (let index = 1; index <= 8; index++) {
      const command = resolveLights(lighting, `terminal-${index}` as LightTarget);
      const light = el("div", `lighting-circuit${command.power === "offline" ? " offline" : ""}`);
      light.style.setProperty("--circuit-color", `#${LIGHT_COLORS[command.color].toString(16).padStart(6, "0")}`);
      light.append(el("strong", "", `Task ${index}`), el("small", "", `${command.power} · ${command.color}`));
      preview.append(light);
    }
  };
  const loadCode = () => {
    code.value = drafts.get(target) ?? lightingCode(host.lang, resolveLights(lighting, target));
  };
  const chooseExample = (change: Partial<LightCommand>) => {
    if (running) return;
    code.value = lightingCode(host.lang, { ...resolveLights(lighting, target), ...change });
    drafts.set(target, code.value);
    feedback.textContent = "Example loaded. Run the code to apply it to the selected map lights.";
  };
  for (const power of ["online", "offline"] as const)
    shortcuts.append(button(power === "online" ? "Online example" : "Offline example", () => chooseExample({ power })));
  for (const color of ["green", "red", "white", "yellow", "blue", "purple"] as LightColor[]) {
    const preset = button(color, () => chooseExample({ color }), "button lighting-color-example");
    preset.style.setProperty("--circuit-color", `#${LIGHT_COLORS[color].toString(16).padStart(6, "0")}`);
    shortcuts.append(preset);
  }
  parts.addEventListener("change", () => {
    drafts.set(target, code.value);
    target = parts.value as LightTarget;
    loadCode();
  });
  code.addEventListener("input", () => drafts.set(target, code.value));
  const run = button("Run & apply lighting", () => void execute(), "button primary");
  const execute = async () => {
    if (running || !panel.isConnected) return;
    running = true;
    run.disabled = true;
    parts.disabled = true;
    code.disabled = true;
    for (const node of shortcuts.querySelectorAll("button")) node.disabled = true;
    const selected = target;
    feedback.textContent = "Running your lighting program…";
    try {
      const result = await host.run(code.value);
      if (!panel.isConnected) return;
      const error = executionError(result);
      output.textContent = [result.stdout || "(No output)", result.stderr, error?.message].filter(Boolean).join("\n");
      if (error) {
        feedback.textContent = `${error.message} Fix the code and try again; the lights have kept their previous settings.`;
        return;
      }
      const command = parseLightOutput(result.stdout, resolveLights(lighting, selected));
      host.apply(selected, command);
      lighting = selected === "all" ? { all: command } : { ...lighting, [selected]: command };
      drawPreview();
      feedback.textContent = `${selected === "all" ? "All district routes" : `Task ${selected.slice(9)} rails`}: ${command.power} · ${command.color}. Applied to the map and saved with this adventure.`;
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : "The program could not run. Try again.";
    } finally {
      running = false;
      run.disabled = false;
      parts.disabled = false;
      code.disabled = false;
      for (const node of shortcuts.querySelectorAll("button")) node.disabled = false;
    }
  };
  code.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void execute();
    }
  });
  loadCode();
  drawPreview();
  instructions.append(shortcuts, preview);
  work.append(
    codeLabel,
    code,
    run,
    el("span", "section-label", "OUTPUT"),
    output,
    feedback,
    button("See the lights in the city", host.close),
  );
  layout.append(instructions, work);
  panel.append(layout);
}
