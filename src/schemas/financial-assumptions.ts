import { z } from "zod"

// Step 1: Premisas de Ingresos
export const revenueAssumptionsSchema = z.object({
  salesGrowth: z.number().min(0).max(100, "Debe estar entre 0-100%"),
  averageUnitPrice: z.number().min(0, "Debe ser mayor a 0"),
  productMix: z.string().max(250, "Máximo 250 caracteres").optional(),
})

// Step 2: Costes Operativos
export const operatingCostsSchema = z.object({
  variableCostPercentage: z.number().min(0).max(100, "Debe estar entre 0-100%"),
  fixedAnnualCost: z.number().min(0, "Debe ser mayor o igual a 0"),
  personnelCost: z.number().min(0, "Debe ser mayor o igual a 0"),
})

// Step 3: Capital de Trabajo
export const workingCapitalSchema = z.object({
  collectionDays: z.number().min(0, "Debe ser mayor o igual a 0"),
  paymentDays: z.number().min(0, "Debe ser mayor o igual a 0"),
  inventoryDays: z.number().min(0, "Debe ser mayor o igual a 0"),
})

// Step 4: Endeudamiento y WACC
export const debtFinancing = z.object({
  entity: z.string().min(1, "Requerido"),
  amount: z.number().min(0, "Debe ser mayor a 0"),
  type: z.string().min(1, "Requerido"),
  term: z.number().min(1, "Debe ser mayor a 0"),
})

export const debtWaccSchema = z.object({
  newFinancing: z.array(debtFinancing).optional(),
  averageDebtCost: z.number().min(0).max(100, "Debe estar entre 0-100%"),
  wacc: z.number().min(0).max(100, "Debe estar entre 0-100%"),
})

// Step 5: CAPEX & Amortización
export const capexAmortizationSchema = z.object({
  plannedInvestment: z.number().min(0, "Debe ser mayor o igual a 0"),
  executionDate: z.date().min(new Date(), "Debe ser una fecha futura"),
  amortizationMethod: z.enum(["lineal", "degresiva", "otro"]),
})

// Step 6: Tasa Impositiva y Otros
export const taxOthersSchema = z.object({
  effectiveTaxRate: z.number().min(0).max(100, "Debe estar entre 0-100%"),
  dividendPolicy: z.number().min(0).max(100, "Debe estar entre 0-100%"),
})

// Combined schema for all steps
export const financialAssumptionsSchema = z.object({
  revenueAssumptions: revenueAssumptionsSchema,
  operatingCosts: operatingCostsSchema,
  workingCapital: workingCapitalSchema,
  debtWacc: debtWaccSchema,
  capexAmortization: capexAmortizationSchema,
  taxOthers: taxOthersSchema,
})

export type FinancialAssumptions = z.infer<typeof financialAssumptionsSchema>
export type RevenueAssumptions = z.infer<typeof revenueAssumptionsSchema>
export type OperatingCosts = z.infer<typeof operatingCostsSchema>
export type WorkingCapital = z.infer<typeof workingCapitalSchema>
export type DebtWacc = z.infer<typeof debtWaccSchema>
export type CapexAmortization = z.infer<typeof capexAmortizationSchema>
export type TaxOthers = z.infer<typeof taxOthersSchema>
export type DebtFinancing = z.infer<typeof debtFinancing>