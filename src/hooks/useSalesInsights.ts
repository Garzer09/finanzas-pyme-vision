import { useState, useEffect, useMemo, useRef } from "react"
import { SegmentInsight } from "@/schemas/segment-schemas"

interface UseSalesInsightsProps {
  segmentType: "producto" | "region" | "cliente"
  data: Array<{
    name: string
    sales: number
    yoyGrowth: number
    participation: number
  }>
}

export function useSalesInsights({ segmentType, data }: UseSalesInsightsProps) {
  const [insights, setInsights] = useState<SegmentInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Memoize expensive calculations
  const calculatedInsights = useMemo(() => {
    if (data.length === 0) return []

    const newInsights: SegmentInsight[] = []

    // Insight 1: Segmento con mayor crecimiento
    const fastestGrowing = data.reduce((prev, current) => 
      current.yoyGrowth > prev.yoyGrowth ? current : prev
    )
    newInsights.push({
      id: "fastest-growth",
      type: "growth",
      title: "Mayor Crecimiento YoY",
      description: `${fastestGrowing.name} lidera con +${fastestGrowing.yoyGrowth.toFixed(1)}% de crecimiento interanual`,
      impact: fastestGrowing.yoyGrowth > 20 ? "high" : fastestGrowing.yoyGrowth > 10 ? "medium" : "low"
    })

    // Insight 2: Riesgo de concentración
    const topSegment = data.reduce((prev, current) => 
      current.participation > prev.participation ? current : prev
    )
    if (topSegment.participation > 30) {
      newInsights.push({
        id: "concentration-risk",
        type: "risk",
        title: "Riesgo de Concentración",
        description: `${topSegment.name} representa ${topSegment.participation.toFixed(1)}% de las ventas. Considera diversificar.`,
        impact: topSegment.participation > 50 ? "high" : topSegment.participation > 40 ? "medium" : "low"
      })
    }

    // Insight 3: Oportunidad de mejora
    const underperformer = data.find(item => item.yoyGrowth < 0)
    if (underperformer) {
      newInsights.push({
        id: "improvement-opportunity",
        type: "opportunity",
        title: "Oportunidad de Mejora",
        description: `${underperformer.name} muestra ${underperformer.yoyGrowth.toFixed(1)}% de decrecimiento. Revisar estrategia.`,
        impact: underperformer.yoyGrowth < -15 ? "high" : underperformer.yoyGrowth < -5 ? "medium" : "low"
      })
    }

    // Insight 4: Tendencia general
    const avgGrowth = data.reduce((sum, item) => sum + item.yoyGrowth, 0) / data.length
    newInsights.push({
      id: "general-trend",
      type: "trend",
      title: "Tendencia General",
      description: `Crecimiento promedio del ${avgGrowth.toFixed(1)}% indica ${avgGrowth > 10 ? 'expansión sólida' : avgGrowth > 5 ? 'crecimiento moderado' : 'estabilidad'}`,
      impact: avgGrowth > 15 ? "high" : avgGrowth > 5 ? "medium" : "low"
    })

    // Insight 5: Segmento emergente
    const emergingSegment = data.find(item => item.yoyGrowth > 15 && item.participation < 20)
    if (emergingSegment) {
      newInsights.push({
        id: "emerging-segment",
        type: "opportunity",
        title: "Segmento Emergente",
        description: `${emergingSegment.name} crece ${emergingSegment.yoyGrowth.toFixed(1)}% con potencial de expansión`,
        impact: "medium"
      })
    }

    return newInsights
  }, [data])

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsLoading(true)
    
    // Debounced update with reduced delay
    timeoutRef.current = setTimeout(() => {
      setInsights(calculatedInsights)
      setIsLoading(false)
    }, 100) // Reduced to 100ms for faster response

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [segmentType, calculatedInsights])

  return { insights, isLoading }
}