// lib/rateLimit.ts
let executionCount = 0
let lastReset = Date.now()

export async function checkExecutionLimit() {
  const now = Date.now()

  // 1時間でリセット
  if (now - lastReset > 60 * 60 * 1000) {
    executionCount = 0
    lastReset = now
  }

  if (executionCount >= 20) {
    throw new Error("Hourly execution limit reached")
  }

  executionCount++
}