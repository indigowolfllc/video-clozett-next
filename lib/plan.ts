export type Plan = "free" | "lite" | "standard" | "pro"

export const PLAN_LIMITS: Record<Plan, {
    shelves: number
    drawers: number
    items: number
    adsInterval: number // 広告表示間隔（件ごと）5=フル, 10=少なめ, 20=最小
}> = {
    free:     { shelves: 3,      drawers: 10,     items: 100,    adsInterval: 5  },
    lite:     { shelves: 10,     drawers: 30,     items: 500,    adsInterval: 5  },
    standard: { shelves: 30,     drawers: 100,    items: 2000,   adsInterval: 10 },
    pro:      { shelves: 999999, drawers: 999999, items: 999999, adsInterval: 20 },
}

export function getLimits(plan: string) {
    return PLAN_LIMITS[plan as Plan] || PLAN_LIMITS.free
}
