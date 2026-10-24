import type { LightCommand } from "../core/map-lighting";
import type { Lang } from "../runners/types";

export function lightingCode(lang: Lang, command: LightCommand): string {
  const power = JSON.stringify(command.power),
    color = JSON.stringify(command.color);
  switch (lang) {
    case "javascript":
      return `let power = ${power};\nlet color = ${color};\nconsole.log(power);\nconsole.log(color);`;
    case "typescript":
      return `let power: string = ${power};\nlet color: string = ${color};\nconsole.log(power);\nconsole.log(color);`;
    case "python":
      return `power = ${power}\ncolor = ${color}\nprint(power)\nprint(color)`;
    case "java":
      return `public class Main {\n    public static void main(String[] args) {\n        String power = ${power};\n        String color = ${color};\n        System.out.println(power);\n        System.out.println(color);\n    }\n}`;
  }
}
