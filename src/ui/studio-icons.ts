import { el } from "./dom";

const NS = "http://www.w3.org/2000/svg";
type IconDefinition = { type: string; color: string; label?: string; path?: string };
const TYPES: Record<string, IconDefinition> = {
  js: { type: "javascript", color: "#f3cf55", label: "JS" },
  jsx: { type: "javascript", color: "#f3cf55", label: "JS" },
  mjs: { type: "javascript", color: "#f3cf55", label: "JS" },
  ts: { type: "typescript", color: "#65b5ff", label: "TS" },
  tsx: { type: "typescript", color: "#65b5ff", label: "TS" },
  java: {
    type: "java",
    color: "#ffb078",
    path: "M5 10h11v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z M16 11h2a2 2 0 0 1 0 4h-2 M4 21h14 M9 7c-4-3 4-3 0-6 M13 7c-3-2 3-3 1-5",
  },
  py: { type: "python", color: "#74cef5", label: "Py" },
  json: { type: "json", color: "#b9e484", label: "{}" },
  html: { type: "html", color: "#ff987a", label: "<>" },
  css: { type: "css", color: "#b7a0ff", label: "#" },
  md: { type: "markdown", color: "#91c7f8", label: "M↓" },
  txt: { type: "text", color: "#abc1d2", path: "M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6" },
};

function drawIcon(definition: IconDefinition): HTMLElement {
  const icon = el("span", "studio-file-icon");
  icon.dataset.fileType = definition.type;
  icon.style.setProperty("--file-color", definition.color);
  icon.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.6");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  if (definition.path) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", definition.path);
    svg.append(path);
  } else {
    const background = document.createElementNS(NS, "rect");
    background.setAttribute("x", "2");
    background.setAttribute("y", "2");
    background.setAttribute("width", "20");
    background.setAttribute("height", "20");
    background.setAttribute("rx", "4");
    background.setAttribute("fill", "currentColor");
    background.setAttribute("fill-opacity", "0.12");
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", "12");
    label.setAttribute("y", "16");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "currentColor");
    label.setAttribute("stroke", "none");
    label.setAttribute("font-family", "Consolas, monospace");
    label.setAttribute("font-size", "11");
    label.setAttribute("font-weight", "700");
    label.textContent = definition.label ?? "?";
    svg.append(background, label);
  }
  icon.append(svg);
  return icon;
}

export function fileIcon(path: string): HTMLElement {
  const extension = path.split(".").at(-1)?.toLowerCase() ?? "";
  const image = ["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(extension);
  return drawIcon(
    TYPES[extension] ??
      (image
        ? { type: "image", color: "#e5a4eb", path: "M3 4h18v16H3z M3 17l6-6 4 4 3-3 5 5 M16 8h.01" }
        : { type: "file", color: "#abc1d2", path: "M6 3h8l4 4v14H6z M14 3v5h4" }),
  );
}

export function toolIcon(type: "folder" | "export" | "import", open = false): HTMLElement {
  return drawIcon({
    type,
    color: "#8ddaea",
    path:
      type === "folder"
        ? open
          ? "M3 8V5h6l2 2h9v3 M3 10h19l-4 10H3z"
          : "M3 5h6l2 2h10v13H3z"
        : type === "export"
          ? "M12 3v12 M7 10l5 5 5-5 M4 15v6h16v-6"
          : "M12 16V4 M7 9l5-5 5 5 M4 15v6h16v-6",
  });
}
