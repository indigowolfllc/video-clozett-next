// lib/log.ts
import { supabase } from "@/lib/supabaseClient"

export async function logExecution(userId: string, command: any, result: any, status: string) {
  await supabase.from("ai_execution_logs").insert({
    user_id: userId,
    command,
    result,
    status,
    timestamp: new Date().toISOString(),
  })
}