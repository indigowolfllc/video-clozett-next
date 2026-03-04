export async function callAI(text: string) {
  return JSON.stringify({ action: "create_or_update_file", path: "test.txt", content: "Hello" })
}

export function extractJson(aiResponse: string) {
  try {
    return JSON.parse(aiResponse)
  } catch {
    throw new Error("Invalid JSON from AI")
  }
}