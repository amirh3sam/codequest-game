import type { StoryAreaId as CityAreaId } from "../core/rules";
import type { Lang } from "../runners/types";
import type { AreaContent, Boss, Task } from "./schema";
import { STUDY_CURRICULUM, type StudyTopic, studyBossFor, studyTaskFor } from "./study-curriculum";

const DISTRICT_TOPICS: Readonly<Record<Exclude<CityAreaId, "variables" | "conditions">, string>> = {
  loops: "loops",
  arrays: "arrays",
  functions: "methods-functions",
  objects: "classes-objects-two",
  abstraction: "abstraction-polymorphism",
};

const DISTRICT_NAMES: Readonly<Record<Exclude<CityAreaId, "variables" | "conditions">, string>> = {
  loops: "Loop Transit",
  arrays: "Array Towers",
  functions: "Function Labs",
  objects: "Object Campus",
  abstraction: "Abstraction Cloud",
};

const BOSS_NAMES: Readonly<Record<Exclude<CityAreaId, "variables" | "conditions">, string>> = {
  loops: "The Infinite Loop",
  arrays: "The Index Warden",
  functions: "The Function Architect",
  objects: "The Class Guardian",
  abstraction: "The Cloud Architect",
};

type StoryAreaId = keyof typeof DISTRICT_TOPICS;

function topicFor(id: StoryAreaId): StudyTopic {
  const topic = STUDY_CURRICULUM.find(({ id: topicId }) => topicId === DISTRICT_TOPICS[id]);
  if (!topic) throw new Error(`Missing Study Path topic for the ${id} district.`);
  return topic;
}

function expectedOutput(output: string): string {
  return output.endsWith("\n") ? output : `${output}\n`;
}

function missionTask(id: StoryAreaId, topic: StudyTopic, lang: Lang, index: number): Task {
  const practice = studyTaskFor(topic, lang, index);
  return {
    id: `${id}-${index + 1}`,
    title: `${topic.title}: checkpoint ${index + 1}`,
    difficulty: index < 3 ? "easy" : index < 6 ? "normal" : "hard",
    prompt: `${practice.prompt} Expected result: ${practice.output}`,
    starter: practice.starter,
    solution: practice.solution,
    tests: [{ expectedStdout: expectedOutput(practice.output) }],
  };
}

function bossTask(id: StoryAreaId, topic: StudyTopic, lang: Lang): Boss {
  const challenge = studyBossFor(topic, lang);
  return {
    id: `${id}-boss`,
    name: BOSS_NAMES[id],
    title: `${topic.title} boss challenge`,
    prompt: `${challenge.prompt} Expected result: ${challenge.output}`,
    starter: challenge.starter,
    solution: challenge.solution,
    tests: [{ expectedStdout: expectedOutput(challenge.output) }],
    hints: [
      { cost: 1, text: `Read the ${topic.title.toLowerCase()} lesson and identify the value the challenge changes.` },
      { cost: 2, text: `Run the starter first, then change only the requested ${topic.practice.action}.` },
      { cost: 3, text: `Compare your output with the expected result, including capitalization and punctuation.` },
    ],
  };
}

export function createStoryDistrict(id: StoryAreaId, lang: Lang): AreaContent {
  const topic = topicFor(id);
  const order = ["variables", "conditions", "loops", "arrays", "functions", "objects", "abstraction"].indexOf(id) + 1;
  return {
    id,
    order,
    name: DISTRICT_NAMES[id],
    lesson: {
      title: topic.title,
      pages: [
        {
          heading: `Bring ${DISTRICT_NAMES[id]} back online`,
          body: `${topic.lesson} ${topic.idea}`,
          code: topic.examples[lang].code,
        },
        {
          heading: "Repair the route one task at a time",
          body: `${topic.tryIt} Solve the eight terminals in order, then challenge ${BOSS_NAMES[id]} to restore this district and open the next route.`,
        },
      ],
    },
    tasks: Array.from({ length: 8 }, (_, index) => missionTask(id, topic, lang, index)),
    boss: bossTask(id, topic, lang),
  };
}

export function storyDistrictIds(): readonly StoryAreaId[] {
  return Object.keys(DISTRICT_TOPICS) as StoryAreaId[];
}
