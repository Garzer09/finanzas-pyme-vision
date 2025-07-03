import { z } from "zod"

// Schema for scenario configuration
export const scenarioConfigSchema = z.object({
  salesDelta: z.number().min(-30).max(30, "Debe estar entre -30% y +30%"),
  costsDelta: z.number().min(-20).max(20, "Debe estar entre -20% y +20%"),
  priceDelta: z.number().min(-15).max(15, "Debe estar entre -15% y +15%"),
})

// Schema for custom scenario
export const customScenarioSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  name: z.string().min(1, "Nombre es requerido").max(50, "Máximo 50 caracteres"),
  note: z.string().max(250, "Máximo 250 caracteres").optional(),
  salesDelta: z.number().min(-30).max(30),
  costsDelta: z.number().min(-20).max(20),
  priceDelta: z.number().min(-15).max(15),
  probability: z.number().min(0).max(100, "Debe estar entre 0% y 100%"),
})

// Schema for impact calculations
export const impactDataSchema = z.object({
  ebitdaBase: z.number().min(0),
  ebitdaSimulated: z.number(),
  deltaPercentage: z.number(),
  marginSimulated: z.number().min(0),
  cashFlow: z.number(),
  dscr: z.number().min(0),
})

// Schema for tornado analysis
export const tornadoItemSchema = z.object({
  variable: z.string(),
  impact: z.number(),
  impactPercentage: z.number(),
  positiveImpact: z.number(),
  negativeImpact: z.number(),
})

export type ScenarioConfig = z.infer<typeof scenarioConfigSchema>
export type CustomScenario = z.infer<typeof customScenarioSchema>
export type ImpactData = z.infer<typeof impactDataSchema>
export type TornadoItem = z.infer<typeof tornadoItemSchema>