import { z } from "zod";

export const ZONES = ["top-left", "top-center", "top-right", "middle-left", "center", "middle-right", "bottom-left", "bottom-center", "bottom-right"] as const;

export const EscapeContentSchema = z.object({
  premise: z.string(),
  rooms: z.array(z.object({
    id: z.string(),
    name: z.string(),
    scene_tags: z.array(z.string()),
    description: z.string(),
    hotspots: z.array(z.object({
      id: z.string(),
      label: z.string(),            // short object name, e.g. "Locked cabinet"
      zone: z.enum(ZONES),
      description: z.string(),      // what the student sees when examining — teaches or hints at a concept
      lock_check_id: z.string(),    // id of the check that opens it; "" if it's just a clue object
      reveals_clue: z.string(),     // shown only after the lock is solved; "" if none
    })),
  })),
  field_guide: z.array(z.object({ concept_id: z.string(), title: z.string(), explanation: z.string(), source_ref: z.string().nullable() })),
});

export type EscapeContent = z.infer<typeof EscapeContentSchema>;
