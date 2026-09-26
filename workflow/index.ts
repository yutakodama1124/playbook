import { task, type TaskContext } from "@renderinc/sdk/workflows";
import { runJobInline } from "../src/pipeline/trigger";

const retry = { maxRetries: 1, waitDurationMs: 5000 };

task({ name: "ingestUnit", timeoutSeconds: 600, retry },
  async (_ctx: TaskContext, unitId: string) => { await runJobInline({ type: "unit", unitId }); return { unitId }; });

task({ name: "generateGame", timeoutSeconds: 900, retry },
  async (_ctx: TaskContext, gameId: string) => { await runJobInline({ type: "game", gameId }); return { gameId }; });
