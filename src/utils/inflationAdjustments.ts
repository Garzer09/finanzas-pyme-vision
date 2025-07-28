import { useInflationData } from '@/hooks/useInflationData'

export interface ProjectionData {
  year: number
  [key: string]: number | string
}

export interface InflationAdjustmentOptions {
  includeInflation: boolean
  region?: string
  baseYear?: number
  customRates?: { [year: number]: number }
}

export function applyInflationToProjections(
  data: ProjectionData[],
  options: InflationAdjustmentOptions
): ProjectionData[] {
  if (!options.includeInflation || !data.length) {
    return data
  }

  const baseYear = options.baseYear || new Date().getFullYear()
  
  return data.map(item => {
    const yearDiff = Number(item.year) - baseYear
    
    if (yearDiff <= 0) {
      return item // No adjustment for base year or past years
    }

    const adjustedItem = { ...item }
    
    // Fields that should be adjusted for inflation (monetary values)
    const monetaryFields = [
      'ventas', 'ingresos', 'revenue', 'sales',
      'costes', 'costos', 'costs', 'expenses',
      'ebitda', 'beneficio', 'profit',
      'activo', 'pasivo', 'patrimonio',
      'assets', 'liabilities', 'equity',
      'capex', 'depreciation', 'amortization',
      'cashFlow', 'flujoEfectivo'
    ]

    // Apply inflation to monetary fields
    Object.keys(adjustedItem).forEach(key => {
      const value = adjustedItem[key]
      
      if (typeof value === 'number' && monetaryFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        // Use custom rate if provided, otherwise use a default 2.5% annual inflation
        const inflationRate = options.customRates?.[Number(item.year)] || 2.5
        const cumulativeInflation = Math.pow(1 + inflationRate / 100, yearDiff)
        adjustedItem[key] = value * cumulativeInflation
      }
    })

    return adjustedItem
  })
}

export function calculateRealVsNominal(
  nominalValue: number,
  year: number,
  baseYear: number = new Date().getFullYear(),
  inflationRate: number = 2.5
): { nominal: number; real: number; adjustment: number } {
  const yearDiff = year - baseYear
  
  if (yearDiff <= 0) {
    return {
      nominal: nominalValue,
      real: nominalValue,
      adjustment: 0
    }
  }
  
  const cumulativeInflation = Math.pow(1 + inflationRate / 100, yearDiff)
  const realValue = nominalValue / cumulativeInflation
  
  return {
    nominal: nominalValue,
    real: realValue,
    adjustment: (nominalValue - realValue) / nominalValue * 100
  }
}

export function getInflationAdjustedGrowth(
  currentValue: number,
  previousValue: number,
  inflationRate: number
): number {
  const nominalGrowth = (currentValue - previousValue) / previousValue * 100
  return nominalGrowth - inflationRate
}

export function formatInflationAdjustedValue(
  value: number,
  showReal: boolean = true,
  unit: 'k€' | 'm€' | '%' = 'k€'
): string {
  const prefix = showReal ? 'Real: ' : ''
  
  switch (unit) {
    case 'm€':
      return `${prefix}€${(value / 1000000).toFixed(1)}M`
    case 'k€':
      return `${prefix}€${(value / 1000).toFixed(0)}K`
    case '%':
      return `${prefix}${value.toFixed(1)}%`
    default:
      return `${prefix}€${value.toLocaleString()}`
  }
}