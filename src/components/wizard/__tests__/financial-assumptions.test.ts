import { describe, it, expect } from 'vitest'
import { 
  revenueAssumptionsSchema,
  operatingCostsSchema,
  workingCapitalSchema,
  debtWaccSchema,
  capexAmortizationSchema,
  taxOthersSchema,
  financialAssumptionsSchema
} from '@/schemas/financial-assumptions'

describe('Financial Assumptions Validation', () => {
  describe('Revenue Assumptions Schema', () => {
    it('should validate correct revenue assumptions', () => {
      const validData = {
        salesGrowth: 10.5,
        averageUnitPrice: 99.99,
        productMix: 'Product A: 60%, Product B: 40%'
      }
      
      expect(() => revenueAssumptionsSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid sales growth percentage', () => {
      const invalidData = {
        salesGrowth: 150, // > 100%
        averageUnitPrice: 50,
        productMix: ''
      }
      
      expect(() => revenueAssumptionsSchema.parse(invalidData)).toThrow()
    })

    it('should reject negative unit price', () => {
      const invalidData = {
        salesGrowth: 10,
        averageUnitPrice: -5,
        productMix: ''
      }
      
      expect(() => revenueAssumptionsSchema.parse(invalidData)).toThrow()
    })
  })

  describe('Operating Costs Schema', () => {
    it('should validate correct operating costs', () => {
      const validData = {
        variableCostPercentage: 65.5,
        fixedAnnualCost: 100000,
        personnelCost: 250000
      }
      
      expect(() => operatingCostsSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid percentage values', () => {
      const invalidData = {
        variableCostPercentage: 105, // > 100%
        fixedAnnualCost: 100000,
        personnelCost: 250000
      }
      
      expect(() => operatingCostsSchema.parse(invalidData)).toThrow()
    })
  })

  describe('Working Capital Schema', () => {
    it('should validate correct working capital data', () => {
      const validData = {
        collectionDays: 30,
        paymentDays: 45,
        inventoryDays: 60
      }
      
      expect(() => workingCapitalSchema.parse(validData)).not.toThrow()
    })

    it('should reject negative days', () => {
      const invalidData = {
        collectionDays: -5,
        paymentDays: 45,
        inventoryDays: 60
      }
      
      expect(() => workingCapitalSchema.parse(invalidData)).toThrow()
    })
  })

  describe('Tax Others Schema', () => {
    it('should validate correct tax data', () => {
      const validData = {
        effectiveTaxRate: 25,
        dividendPolicy: 30
      }
      
      expect(() => taxOthersSchema.parse(validData)).not.toThrow()
    })

    it('should reject out of range percentages', () => {
      const invalidData = {
        effectiveTaxRate: 150, // > 100%
        dividendPolicy: 30
      }
      
      expect(() => taxOthersSchema.parse(invalidData)).toThrow()
    })
  })

  describe('Complete Financial Assumptions Schema', () => {
    it('should validate complete valid data structure', () => {
      const validData = {
        revenueAssumptions: {
          salesGrowth: 10,
          averageUnitPrice: 100,
          productMix: 'Mixed products'
        },
        operatingCosts: {
          variableCostPercentage: 60,
          fixedAnnualCost: 100000,
          personnelCost: 200000
        },
        workingCapital: {
          collectionDays: 30,
          paymentDays: 45,
          inventoryDays: 60
        },
        debtWacc: {
          newFinancing: [],
          averageDebtCost: 4.5,
          wacc: 8.0
        },
        capexAmortization: {
          plannedInvestment: 50000,
          executionDate: new Date('2025-12-31'),
          amortizationMethod: 'lineal' as const
        },
        taxOthers: {
          effectiveTaxRate: 25,
          dividendPolicy: 30
        }
      }
      
      expect(() => financialAssumptionsSchema.parse(validData)).not.toThrow()
    })
  })
})