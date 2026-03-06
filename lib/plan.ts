export type Plan = "free" | "lite" | "standard" | "pro"

export const PLAN_LIMITS: Record<Plan, {
  shelves: number
  drawers: number
  items: number
  ads: boolean
}> = {
  free:     { shelves: 3,         drawers: 10,  items: 100,   ads: true },
  lite:     { shelves: 10,        drawers: 30,  items: 500,   ads: true },
  standard: { shelves: 30,        drawers: 100, items: 2000,  ads: false },
  pro:      { shelves: 999999,    drawers: 999999, items: 999999, ads: false },
}

export function getLimits(plan: string) {
  return PLAN_LIMITS[plan as Plan] || PLAN_LIMITS.free
}