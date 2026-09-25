import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const MAX_TASK_CHARS = 12000
const CHECKPOINT_MARKER = "## Durable task checkpoint"

export const StatefulCompaction = async ({ directory }) => ({
  "experimental.session.compacting": async (_input, output) => {
    if (!output || typeof output !== "object") return
    if (!Array.isArray(output.context)) output.context = []
    const context = output.context
    const alreadyInjected = context.some(
      (entry) => typeof entry === "string" && entry.includes(CHECKPOINT_MARKER),
    )
    if (alreadyInjected) return

    let task
    try {
      task = await readFile(resolve(directory, "TASK.md"), "utf8")
    } catch {
      return
    }

    const checkpoint =
      task.length <= MAX_TASK_CHARS
        ? task
        : `${task.slice(0, MAX_TASK_CHARS)}\n[Checkpoint truncated; reread TASK.md after compaction.]`

    output.context.push(`## Durable task checkpoint
TASK.md is the source of truth. Preserve its objective, acceptance criteria, current phase, completed work, verification, blockers, changed paths, and exact next action. Do not preserve raw tool output or superseded discussion. After compaction, reread TASK.md before making further changes.

<task_checkpoint>
${checkpoint}
</task_checkpoint>`)
  },
})
