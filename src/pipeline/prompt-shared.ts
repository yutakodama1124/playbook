import type { ConceptMap } from "@/domain/concept-map";

export const CONTENT_POLICY = "Content must be school-appropriate for ages 13–18: no gore, no sexual content, no real-person defamation. Default to non-violent stakes.";

export const conceptMapText = (map: ConceptMap) => JSON.stringify(map);
