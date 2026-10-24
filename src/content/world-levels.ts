import { AREA_IDS, type AreaId, STORY_AREA_IDS, STUDY_AREA_IDS, type StudyAreaId } from "../core/rules";
import type { Lang } from "../runners/types";
import type { AreaContent, Task } from "./schema";
import { STUDY_CURRICULUM, type StudyTopic, studyBossFor, studyTaskFor } from "./study-curriculum";
import village from "./village.json" with { type: "json" };

export const WORLD_LEVELS: readonly { id: AreaId; name: string; concept: string }[] = [
  ...STORY_AREA_IDS.map((id) => {
    const area = village.worldAreas.find((entry) => entry.id === id);
    if (!area) throw new Error(`Missing world map entry ${id}`);
    return { ...area, id };
  }),
  ...STUDY_AREA_IDS.map((id, index) => {
    const topic = STUDY_CURRICULUM[index];
    if (!topic) throw new Error(`Missing world map category ${id}`);
    return { id, name: topic.title, concept: topic.title };
  }),
];

export function studyAreaId(topicId: string): StudyAreaId | undefined {
  return STUDY_AREA_IDS.find((id) => id === `study-${topicId}`);
}

export function studyTopicForArea(id: AreaId): StudyTopic | undefined {
  return STUDY_CURRICULUM.find((topic) => `study-${topic.id}` === id);
}

export function createStudyDistrict(id: StudyAreaId, lang: Lang): AreaContent {
  const topic = studyTopicForArea(id);
  if (!topic) throw new Error(`Missing district course for ${id}`);
  const task = (index: number): Task => {
    const practice = studyTaskFor(topic, lang, index);
    return {
      id: `${id}-${index + 1}`,
      title: `${topic.title}: terminal ${index + 1}`,
      difficulty: index < 3 ? "easy" : index < 6 ? "normal" : "hard",
      prompt: `${practice.prompt} Expected output: ${practice.output}`,
      starter: practice.starter,
      solution: practice.solution,
      tests: [{ expectedStdout: `${practice.output}\n` }],
    };
  };
  const boss = studyBossFor(topic, lang);
  return {
    id,
    order: AREA_IDS.indexOf(id) + 1,
    name: topic.title,
    lesson: {
      title: `${topic.title} field guide`,
      pages: [
        { heading: topic.title, body: `${topic.lesson} ${topic.idea}`, code: topic.examples[lang].code },
        {
          heading: "Reconnect this district",
          body: `${topic.tryIt} Repair all eight numbered terminals, then defeat the district guardian to unlock the next city map. The transit building is available whenever this district is unlocked.`,
        },
      ],
    },
    tasks: Array.from({ length: 8 }, (_, index) => task(index)),
    boss: {
      id: `${id}-boss`,
      name: "Relay Guardian",
      title: `Restore the ${topic.title.toLowerCase()} relay`,
      prompt: `${boss.prompt} Expected output: ${boss.output}`,
      starter: boss.starter,
      solution: boss.solution,
      tests: [{ expectedStdout: `${boss.output}\n` }],
      hints: [
        { cost: 1, text: topic.idea },
        { cost: 2, text: `Run the starter and change the requested ${topic.practice.action}.` },
        { cost: 3, text: `Your output should be exactly: ${boss.output}` },
      ],
    },
  };
}
