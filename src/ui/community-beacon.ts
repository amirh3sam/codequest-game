import { BEACON_EVENTS, beaconCode } from "../content/community-beacon";
import type { BeaconChoice } from "../core/discoveries";
import { executionError, normalizeOutput } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";

type BeaconHost = {
  lang: Lang;
  courierName: string;
  choice?: BeaconChoice;
  available: boolean;
  panel(title: string, subtitle: string, wide?: boolean): HTMLElement;
  run(code: string): Promise<RunResult>;
  activate(choice: BeaconChoice): void;
  courier(): void;
  close(): void;
};

export function openCommunityBeacon(host: BeaconHost): void {
  const panel = host.panel(
    "Mina · Light up the courtyard",
    "OPTIONAL DISCOVERY · Strings and variables · Free to try",
    true,
  );
  panel.classList.add("beacon-quest");
  if (!host.available) {
    panel.append(
      el(
        "p",
        "lesson-body",
        `Mina left a message: ‘The courtyard sign lost its connection. Help ${host.courierName} repair the courier drone first, then come back. We have a neighborhood night to plan!’`,
      ),
      button(`Help ${host.courierName} first`, host.courier, "button primary"),
    );
    return;
  }

  let choice: BeaconChoice = host.choice ?? "garden",
    running = false;
  let receipt: { choice: BeaconChoice; code: string } | undefined;
  const drafts = new Map<BeaconChoice, string>();
  const columns = el("div", "editor-columns"),
    story = el("div", "instructions"),
    work = el("div", "code-workspace");
  story.append(
    el("span", "eyebrow", "MESSAGE FROM MINA / COURTYARD HOST"),
    el(
      "p",
      "task-prompt",
      "‘The deliveries are moving again! Let's bring everyone together. Choose our evening, then connect the sign to your eventName variable.’",
    ),
  );
  if (host.choice)
    story.append(el("p", "beacon-badge", `✦ Signal Maker · ${BEACON_EVENTS[host.choice].title} is on air`));
  const choices = el("div", "beacon-choices");
  choices.setAttribute("role", "group");
  choices.setAttribute("aria-label", "Choose the neighborhood event");
  const choiceButtons = new Map<BeaconChoice, HTMLButtonElement>();
  const preview = el("div", "beacon-preview");
  preview.setAttribute("aria-label", "Beacon preview");
  const sign = el("strong", "beacon-sign", "OFFLINE"),
    previewCaption = el("small", "", "Your code will light up this preview.");
  preview.append(el("span", "eyebrow", "COURTYARD / PREVIEW"), sign, previewCaption);
  const target = el("p", "lesson-body");
  const label = el("label", "editor-label", "Beacon code"),
    code = el("textarea", "code-editor");
  code.id = "beacon-code";
  label.htmlFor = code.id;
  code.spellcheck = false;
  code.setAttribute("autocapitalize", "off");
  const feedback = el(
    "p",
    "feedback",
    "Change the print line to use eventName without quotes. Run a preview when you're ready.",
  );
  feedback.setAttribute("role", "status");
  const output = el("pre", "output", "Your output will appear here.");
  output.setAttribute("aria-label", "Beacon output");
  const activate = button(
    "Light the beacon",
    () => {
      if (running || !receipt || receipt.code !== code.value || receipt.choice !== choice) return;
      receipt = undefined;
      activate.disabled = true;
      host.activate(choice);
      const result = host.panel("The courtyard is on air!", "OPTIONAL DISCOVERY COMPLETE · Signal Maker", true);
      result.classList.add("beacon-quest");
      const event = BEACON_EVENTS[choice];
      const card = el("div", "beacon-preview online");
      card.style.setProperty("--beacon-color", event.color);
      card.append(
        el("span", "eyebrow", "LIVE / COMMUNITY BEACON"),
        el("strong", "beacon-sign", event.title),
        el("small", "", "Your choice is saved with this adventure on this device."),
      );
      result.append(
        card,
        el("p", "beacon-badge", "✦ Signal Maker"),
        el("p", "lesson-body", `Mina: “${event.reply}”`),
        el(
          "p",
          "lesson-body",
          "Your program sent the stored text to the sign. Come back any time to announce a different evening.",
        ),
        button("See the courtyard", host.close, "button primary"),
      );
    },
    "button primary",
  );
  activate.disabled = true;
  const invalidate = () => {
    receipt = undefined;
    activate.disabled = true;
    preview.classList.remove("online");
    sign.textContent = "OFFLINE";
    previewCaption.textContent = "Run the current code to preview the message.";
  };
  const select = (next: BeaconChoice) => {
    drafts.set(choice, code.value);
    choice = next;
    code.value = drafts.get(choice) ?? beaconCode(host.lang, BEACON_EVENTS[choice].title);
    for (const [id, node] of choiceButtons) node.setAttribute("aria-pressed", String(id === choice));
    target.textContent = `Print exactly: ${BEACON_EVENTS[choice].title}`;
    preview.style.setProperty("--beacon-color", BEACON_EVENTS[choice].color);
    output.textContent = "Your output will appear here.";
    feedback.textContent = "Store the event name as text, then print the variable to send its value to the sign.";
    invalidate();
  };
  for (const id of ["garden", "arcade"] as const) {
    const event = BEACON_EVENTS[id];
    const node = button(
      "",
      () => {
        if (!running) select(id);
      },
      "button beacon-choice",
    );
    node.setAttribute("aria-label", event.title);
    node.append(el("strong", "", event.title), el("small", "", event.description));
    choiceButtons.set(id, node);
    choices.append(node);
  }
  code.value = beaconCode(host.lang, BEACON_EVENTS[choice].title);
  select(choice);
  code.addEventListener("input", () => {
    invalidate();
    feedback.textContent = "Code changed. Run another preview before lighting the beacon.";
  });
  const run = button("Run beacon preview", () => {
    void execute();
  });
  const execute = async () => {
    if (running || !panel.isConnected) return;
    const submitted = code.value,
      selected = choice;
    invalidate();
    running = true;
    run.disabled = true;
    code.disabled = true;
    for (const node of choiceButtons.values()) node.disabled = true;
    feedback.textContent = "Running your code…";
    try {
      const result = await host.run(submitted);
      if (!panel.isConnected || code.value !== submitted || choice !== selected) return;
      output.textContent = result.stdout || "(No output)";
      const error = executionError(result);
      if (error) feedback.textContent = `${error.message} Try again; this activity is free.`;
      else if (normalizeOutput(result.stdout) === BEACON_EVENTS[selected].title) {
        receipt = { choice: selected, code: submitted };
        activate.disabled = false;
        sign.textContent = BEACON_EVENTS[selected].title;
        preview.classList.add("online");
        previewCaption.textContent = "Preview ready. Light the beacon to announce your event in the city.";
        feedback.textContent =
          "Message received! The preview matches your choice. Ready to share it with the neighborhood?";
      } else
        feedback.textContent = `The sign needs “${BEACON_EVENTS[selected].title}”. A quoted word prints literally; eventName without quotes reads the text you stored. Try again for free.`;
    } catch {
      if (panel.isConnected)
        feedback.textContent = "The runner couldn't finish. Try the preview again; no progress was changed.";
    } finally {
      running = false;
      run.disabled = false;
      code.disabled = false;
      for (const node of choiceButtons.values()) node.disabled = false;
    }
  };
  code.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void execute();
    }
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end");
      code.dispatchEvent(new Event("input"));
    }
  });
  const example = el("details", "beacon-example");
  example.append(
    el("summary", "", "See a worked example"),
    el(
      "p",
      "",
      "Quotes create a string (text). The variable remembers it. Printing the variable reads that stored text.",
    ),
    el("pre", "code-example", beaconCode(host.lang, "Workshop night", true)),
  );
  story.append(
    choices,
    preview,
    el("p", "lesson-body", "A string is text inside quotes. A variable gives that text a name you can reuse."),
    example,
  );
  const actions = el("div", "editor-actions");
  actions.append(run, activate);
  work.append(
    target,
    label,
    code,
    actions,
    el("span", "section-label", "OUTPUT"),
    output,
    feedback,
    el("small", "", "Free discovery · Hearts, gems and mission progress stay safe. Ctrl / ⌘ + Enter to preview."),
  );
  columns.append(story, work);
  panel.append(columns);
}
