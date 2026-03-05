import { createClient } from "@/lib/supabaseClient"

export async function logExecution(userId: string, command: any, result: any, status: string) {
  const supabase = createClient()
  await supabase.from("ai_execution_logs").insert({
    user_id: userId,
    command,
    result,
    status,
    timestamp: new Date().toISOString(),
  })
}