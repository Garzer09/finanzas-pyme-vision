import { useMemo } from 'react'

interface ProjectionInsight {
  id: string
  type: 'growth' | 'risk' | 'opportunity' | 'warning'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

interface UseProjectionInsightsProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  data: any
  activeTab: string
}

export function useProjectionInsights({ scenario, yearRange, data, activeTab }: UseProjectionInsightsProps) {
  const insights = useMemo((): ProjectionInsight[] => {
    const insights: ProjectionInsight[] = []
    
    // Insights basados en el escenario
    if (scenario === 'optimista') {
      insights.push({
        id: 'optimistic-growth',
        type: 'growth',
        title: 'Crecimiento Acelerado',
        description: `Escenario optimista proyecta crecimiento del 15% anual en años ${yearRange[0]}-${yearRange[1]}`,
        impact: 'high'
      })
    }
    
    if (scenario === 'pesimista') {
      insights.push({
        id: 'pessimistic-caution',
        type: 'risk',
        title: 'Precaución en Inversiones',
        description: 'Escenario pesimista sugiere mantener liquidez y reducir capex',
        impact: 'medium'
      })
    }
    
    // Insights específicos por tab
    switch (activeTab) {
      case 'pl-proyectado':
        insights.push({
          id: 'ebitda-margin',
          type: 'opportunity',
          title: 'Margen EBITDA Estable',
          description: 'Margen EBITDA se mantiene entre 18-22% durante el período proyectado',
          impact: 'medium'
        })
        break
        
      case 'balance-proyectado':
        insights.push({
          id: 'debt-structure',
          type: 'warning',
          title: 'Estructura de Deuda',
          description: 'Ratio deuda/patrimonio supera 2.5x en año 3-4, considerar refinanciación',
          impact: 'high'
        })
        break
        
      case 'cash-flow':
        insights.push({
          id: 'cash-generation',
          type: 'growth',
          title: 'Generación de Caja Positiva',
          description: 'FCF positivo desde año 2, acumulando €2.3M en 5 años',
          impact: 'high'
        })
        break
        
      case 'ratios':
        insights.push({
          id: 'roe-improvement',
          type: 'opportunity',
          title: 'Mejora en ROE',
          description: 'ROE evoluciona de 12% a 18% gracias a mejor eficiencia operativa',
          impact: 'medium'
        })
        break
    }
    
    return insights
  }, [scenario, yearRange, data, activeTab])
  
  return insights
}