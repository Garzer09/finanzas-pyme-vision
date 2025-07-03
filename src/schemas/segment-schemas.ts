import { z } from "zod"

// Schema for filters
export const segmentFiltersSchema = z.object({
  year: z.number().min(2020).max(2030),
  period: z.enum(["mes", "trimestre", "ytd"]),
  segmentType: z.enum(["producto", "region", "cliente"]),
})

// Schema for KPI data
export const segmentKpiSchema = z.object({
  totalSales: z.number().min(0),
  yoyGrowth: z.number(),
  averageTicket: z.number().min(0),
  leadingSegment: z.object({
    name: z.string(),
    participation: z.number().min(0).max(100),
  }),
})

// Schema for segment data
export const segmentDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  sales: z.number().min(0),
  yoyGrowth: z.number(),
  averageTicket: z.number().min(0),
  participation: z.number().min(0).max(100),
  period: z.string(),
})

// Schema for insights
export const segmentInsightSchema = z.object({
  id: z.string(),
  type: z.enum(["growth", "risk", "opportunity", "trend"]),
  title: z.string(),
  description: z.string(),
  impact: z.enum(["high", "medium", "low"]),
})

export type SegmentFilters = z.infer<typeof segmentFiltersSchema>
export type SegmentKpi = z.infer<typeof segmentKpiSchema>
export type SegmentData = z.infer<typeof segmentDataSchema>
export type SegmentInsight = z.infer<typeof segmentInsightSchema>