import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface InflationRate {
  id: string
  period_date: string
  region: string
  inflation_rate: number
  source: string
  data_type: string
  created_at: string
  updated_at: string
}

interface UseInflationDataProps {
  region?: string
  yearRange?: [number, number]
}

export function useInflationData({ region = 'EU', yearRange }: UseInflationDataProps) {
  const [inflationRates, setInflationRates] = useState<InflationRate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInflationData = async () => {
    setLoading(true)
    setError(null)

    try {
      // First try to fetch fresh data
      const response = await supabase.functions.invoke('inflation-data-fetcher', {
        body: { region }
      })

      if (response.error) {
        console.warn('Failed to fetch fresh inflation data:', response.error)
      }

      // Get inflation data from database
      let query = supabase
        .from('inflation_rates')
        .select('*')
        .eq('region', region)
        .order('period_date', { ascending: false })

      if (yearRange) {
        const startDate = `${yearRange[0]}-01-01`
        const endDate = `${yearRange[1]}-12-31`
        query = query.gte('period_date', startDate).lte('period_date', endDate)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        throw dbError
      }

      setInflationRates(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching inflation data')
      console.error('Error in useInflationData:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInflationData()
  }, [region, yearRange])

  const getAverageInflation = (startYear?: number, endYear?: number): number => {
    let filteredRates = inflationRates

    if (startYear && endYear) {
      filteredRates = inflationRates.filter(rate => {
        const year = new Date(rate.period_date).getFullYear()
        return year >= startYear && year <= endYear
      })
    }

    if (filteredRates.length === 0) return 2.0 // Default EU inflation target

    const sum = filteredRates.reduce((acc, rate) => acc + Number(rate.inflation_rate), 0)
    return sum / filteredRates.length
  }

  const applyInflationToValue = (value: number, years: number, customRate?: number): number => {
    const rate = customRate || getAverageInflation()
    return value * Math.pow(1 + rate / 100, years)
  }

  const getInflationForYear = (year: number): number => {
    const yearData = inflationRates.find(rate => 
      new Date(rate.period_date).getFullYear() === year
    )
    return yearData ? Number(yearData.inflation_rate) : getAverageInflation()
  }

  return {
    inflationRates,
    loading,
    error,
    fetchInflationData,
    getAverageInflation,
    applyInflationToValue,
    getInflationForYear
  }
}