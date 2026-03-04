// lib/safety.ts
export const ALLOWED_ACTIONS = [
  "create_or_update_file"
]

export const BLOCKED_PATHS = [
  ".env",
  "package.json",
  "next.config.js",
  "node_modules",
  ".github/workflows"
]

export function validateExecution(command: any) {
  if (!ALLOWED_ACTIONS.includes(command.action)) {
    throw new Error("Action not allowed: " + command.action)
  }

  for (const blocked of BLOCKED_PATHS) {
    if (command.path?.includes(blocked)) {
      throw new Error(`Blocked path detected: ${blocked}`)
    }
  }

  return true
}