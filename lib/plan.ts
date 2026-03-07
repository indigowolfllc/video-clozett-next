export type Plan = "free" | "lite" | "standard" | "pro"

export const PLAN_LIMITS: Record<Plan, {
  shelves: number
  drawers: number
  items: number
  adsInterval: number  // 広告表示間隔（件ごと）5=フル, 10=少なめ, 20=最小
  dailyUrls: number    // 1日のURL保存上限（-1=無制限）
}> = {
  free:     { shelves: 3,      drawers: 10,     items: 100,    adsInterval: 5,  dailyUrls: 30 },
  lite:     { shelves: 10,     drawers: 30,     items: 500,    adsInterval: 5,  dailyUrls: 100 },
  standard: { shelves: 30,     drawers: 100,    items: 2000,   adsInterval: 10, dailyUrls: 500 },
  pro:      { shelves: 999999, drawers: 999999, items: 999999, adsInterval: 20, dailyUrls: -1 },
}

// プランの順序（格上げ計算に使用）
const PLAN_ORDER: Plan[] = ["free", "lite", "standard", "pro"]

/**
 * 紹介特典を加味した「実効プラン」を返す
 * - activeReferrals: 今も有料プランを使っている紹介済みユーザーの数
 * - 1人でも紹介中なら1段階格上げ（Proはそのまま）
 */
export function getEffectivePlan(basePlan: string, activeReferrals: number): Plan {
  const base = (PLAN_ORDER.includes(basePlan as Plan) ? basePlan : "free") as Plan
  if (activeReferrals <= 0) return base
  const currentIndex = PLAN_ORDER.indexOf(base)
  const upgradedIndex = Math.min(currentIndex + 1, PLAN_ORDER.length - 1)
  return PLAN_ORDER[upgradedIndex]
}

export function getLimits(plan: string) {
  return PLAN_LIMITS[plan as Plan] || PLAN_LIMITS.free
}
