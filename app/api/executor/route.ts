// /api/executor/route.ts
import { NextRequest, NextResponse } from "next/server"
import { sendSlack } from "@/lib/slack"
import { githubCreateOrUpdateFile } from "@/lib/github"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const command = await req.json()

    // 🧪 DRY RUNモード
    if (process.env.AI_DRY_RUN === "true") {
      await sendSlack("🧪 DRY RUN:\n" + JSON.stringify(command, null, 2))
      return NextResponse.json({ dry_run: true })
    }

    // 本実行
    const result = await githubCreateOrUpdateFile(command)
    await sendSlack("✅ Executor Result:\n" + JSON.stringify(result, null, 2))

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error(err)
    await sendSlack("❌ Executor Error:\n" + err.message)
    return NextResponse.json({ error: err.message })
  }
}