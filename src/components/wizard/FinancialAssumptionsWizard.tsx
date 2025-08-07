
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Stepper } from "@/components/ui/stepper"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import { 
  financialAssumptionsSchema, 
  type FinancialAssumptions,
  revenueAssumptionsSchema,
  operatingCostsSchema,
  workingCapitalSchema,
  debtWaccSchema,
  capexAmortizationSchema,
  taxOthersSchema
} from "@/schemas/financial-assumptions"
import { RevenueAssumptionsStep } from "./RevenueAssumptionsStep"
import { OperatingCostsStep } from "./OperatingCostsStep"
import { WorkingCapitalStep } from "./WorkingCapitalStep"
import { DebtWaccStep } from "./DebtWaccStep"
import { CapexAmortizationStep } from "./CapexAmortizationStep"
import { TaxOthersStep } from "./TaxOthersStep"
import { debounce } from "lodash"
import { useCompanyContext } from "@/contexts/CompanyContext"
import { useFinancialAssumptionsData } from "@/hooks/useFinancialAssumptionsData"
import { supabase } from "@/integrations/supabase/client"

const steps = [
  "Premisas de Ingresos",
  "Costes Operativos", 
  "Capital de Trabajo",
  "Endeudamiento y WACC",
  "CAPEX & Amortización",
  "Tasa Impositiva y Otros"
]

const stepSchemas = [
  revenueAssumptionsSchema,
  operatingCostsSchema,
  workingCapitalSchema,
  debtWaccSchema,
  capexAmortizationSchema,
  taxOthersSchema
]

const defaultValues: FinancialAssumptions = {
  revenueAssumptions: {
    salesGrowth: 10,
    averageUnitPrice: 100,
    productMix: ""
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
    executionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    amortizationMethod: "lineal"
  },
  taxOthers: {
    effectiveTaxRate: 25,
    dividendPolicy: 30
  }
}

export function FinancialAssumptionsWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { companyId } = useCompanyContext()
  const { getLatestAssumption, hasRealData, refetch } = useFinancialAssumptionsData(companyId || undefined)

  // Load data from localStorage on mount
  const [savedData, setSavedData] = useState<FinancialAssumptions>(() => {
    try {
      const saved = localStorage.getItem('financial-assumptions')
      return saved ? JSON.parse(saved) : defaultValues
    } catch {
      return defaultValues
    }
  })

  const form = useForm<FinancialAssumptions>({
    resolver: zodResolver(financialAssumptionsSchema),
    defaultValues: savedData,
    mode: "onChange"
  })

  const { watch, trigger, getValues, setError, clearErrors, setValue, reset } = form

  // Auto-save with debounce
  const debouncedSave = debounce((data: FinancialAssumptions) => {
    localStorage.setItem('financial-assumptions', JSON.stringify(data))
  }, 500)

  useEffect(() => {
    const subscription = watch((data) => {
      if (data) {
        debouncedSave(data as FinancialAssumptions)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, debouncedSave])

  // Precargar desde Supabase cuando existan supuestos para la empresa
  useEffect(() => {
    if (!companyId) return
    const mappings = [
      { path: 'revenueAssumptions.salesGrowth', name: 'crecimiento_ingresos' },
      { path: 'revenueAssumptions.averageUnitPrice', name: 'precio_medio' },
      { path: 'operatingCosts.variableCostPercentage', name: 'costes_variables' },
      { path: 'operatingCosts.fixedAnnualCost', name: 'costes_fijos' },
      { path: 'operatingCosts.personnelCost', name: 'costes_personal' },
      { path: 'workingCapital.collectionDays', name: 'dias_cobro' },
      { path: 'workingCapital.paymentDays', name: 'dias_pago' },
      { path: 'workingCapital.inventoryDays', name: 'dias_inventario' },
      { path: 'debtWacc.averageDebtCost', name: 'coste_deuda' },
      { path: 'debtWacc.wacc', name: 'wacc' },
      { path: 'capexAmortization.plannedInvestment', name: 'capex' },
      { path: 'taxOthers.effectiveTaxRate', name: 'tasa_impositiva' },
      { path: 'taxOthers.dividendPolicy', name: 'politica_dividendos' },
    ] as const

    let updated: Record<string, any> = {}
    mappings.forEach(m => {
      const a = getLatestAssumption(m.name)
      if (a && isFinite(Number(a.assumption_value))) {
        // construir objeto anidado tipo { revenueAssumptions: { salesGrowth: value } }
        const keys = m.path.split('.')
        let cursor: any = updated
        keys.forEach((k, idx) => {
          if (idx === keys.length - 1) {
            cursor[k] = Number(a.assumption_value)
          } else {
            cursor[k] = cursor[k] || {}
            cursor = cursor[k]
          }
        })
      }
    })
    if (Object.keys(updated).length > 0) {
      reset({ ...defaultValues, ...savedData, ...updated })
    }
  }, [companyId, hasRealData, getLatestAssumption, reset])  

  const progress = ((currentStep + 1) / steps.length) * 100

  const canProceed = async () => {
    const currentStepKey = Object.keys(defaultValues)[currentStep] as keyof FinancialAssumptions
    const currentStepData = getValues(currentStepKey)
    
    console.log(`Validando paso ${currentStep} (${currentStepKey}):`, currentStepData)
    
    try {
      const result = stepSchemas[currentStep].safeParse(currentStepData)
      
      if (!result.success) {
        console.log('Errores de validación:', result.error.errors)
        
        // Limpiar errores previos del paso actual
        clearErrors(currentStepKey)
        
        // Marcar campos con errores en el formulario
        result.error.errors.forEach(error => {
          const fieldPath = `${currentStepKey}.${error.path.join('.')}` as any
          setError(fieldPath, {
            type: 'manual',
            message: error.message
          })
        })
        
        return false
      }
      
      // Limpiar errores si la validación es exitosa
      clearErrors(currentStepKey)
      return true
    } catch (error) {
      console.error('Error en validación:', error)
      return false
    }
  }

  // Persistencia en Supabase para campos numéricos clave
  const persistToDB = async (data: FinancialAssumptions) => {
    if (!companyId) {
      toast({
        title: "Empresa no seleccionada",
        description: "Selecciona una empresa para guardar los supuestos.",
        variant: "destructive",
      })
      return false
    }

    const year = new Date().getFullYear()
    const mapping = [
      { path: 'revenueAssumptions.salesGrowth', name: 'crecimiento_ingresos', category: 'ingresos', unit: 'percentage' },
      { path: 'revenueAssumptions.averageUnitPrice', name: 'precio_medio', category: 'ingresos', unit: 'EUR' },
      { path: 'operatingCosts.variableCostPercentage', name: 'costes_variables', category: 'costes', unit: 'percentage' },
      { path: 'operatingCosts.fixedAnnualCost', name: 'costes_fijos', category: 'costes', unit: 'EUR' },
      { path: 'operatingCosts.personnelCost', name: 'costes_personal', category: 'costes', unit: 'EUR' },
      { path: 'workingCapital.collectionDays', name: 'dias_cobro', category: 'capital_trabajo', unit: 'days' },
      { path: 'workingCapital.paymentDays', name: 'dias_pago', category: 'capital_trabajo', unit: 'days' },
      { path: 'workingCapital.inventoryDays', name: 'dias_inventario', category: 'capital_trabajo', unit: 'days' },
      { path: 'debtWacc.averageDebtCost', name: 'coste_deuda', category: 'financiacion', unit: 'percentage' },
      { path: 'debtWacc.wacc', name: 'wacc', category: 'financiacion', unit: 'percentage' },
      { path: 'capexAmortization.plannedInvestment', name: 'capex', category: 'capex', unit: 'EUR' },
      { path: 'taxOthers.effectiveTaxRate', name: 'tasa_impositiva', category: 'impuestos', unit: 'percentage' },
      { path: 'taxOthers.dividendPolicy', name: 'politica_dividendos', category: 'impuestos', unit: 'percentage' },
    ] as const

    const getByPath = (obj: any, path: string) => path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj)

    const rows = mapping.map(m => {
      const raw = getByPath(data, m.path)
      const val = Number(raw)
      if (!isFinite(val)) return null
      return {
        company_id: companyId,
        assumption_value: val,
        period_year: year,
        period_quarter: null,
        period_month: null,
        uploaded_by: null,
        job_id: null,
        assumption_category: m.category,
        assumption_name: m.name,
        unit: m.unit,
        period_type: 'annual',
        notes: null
      }
    }).filter(Boolean) as any[]

    try {
      // Borrado previo para las mismas claves del año actual (evita duplicados)
      if (rows.length > 0) {
        const names = rows.map(r => r.assumption_name)
        await supabase
          .from('financial_assumptions_normalized')
          .delete()
          .eq('company_id', companyId)
          .eq('period_year', year)
          .in('assumption_name', names)
      }

      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from('financial_assumptions_normalized')
          .insert(rows)

        if (insertError) throw insertError
      }

      await refetch()
      return true
    } catch (err) {
      console.error('Error guardando supuestos en DB:', err)
      return false
    }
  }

  const handleNext = async () => {
    const isValid = await canProceed()
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else if (isValid && currentStep === steps.length - 1) {
      handleFinish()
    } else if (!isValid) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, complete todos los campos obligatorios antes de continuar.",
        variant: "destructive",
      })
    }
  }

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      const isValid = await trigger()
      if (isValid) {
        const data = getValues()
        localStorage.setItem('financial-assumptions', JSON.stringify(data))

        const ok = await persistToDB(data)
        if (!ok) {
          toast({
            title: "Guardado parcial",
            description: "Se guardó en local pero hubo un problema guardando en la base de datos.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Wizard completado",
          description: "Los supuestos financieros han sido configurados y guardados.",
        })
      } else {
        toast({
          title: "Error de validación",
          description: "Por favor, revise los campos marcados en rojo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron finalizar los supuestos. Inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const isValid = await trigger()
      if (isValid) {
        const data = getValues()
        localStorage.setItem('financial-assumptions', JSON.stringify(data))
        
        const ok = await persistToDB(data)
        if (!ok) {
          toast({
            title: "Error al guardar en base de datos",
            description: "Los datos se guardaron localmente pero no en Supabase.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Guardado exitoso",
          description: "Los supuestos financieros han sido guardados correctamente.",
        })
      } else {
        toast({
          title: "Error de validación",
          description: "Por favor, revise los campos marcados en rojo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos. Inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    const stepProps = { form: form as any }
    
    switch (currentStep) {
      case 0: return <RevenueAssumptionsStep {...stepProps} />
      case 1: return <OperatingCostsStep {...stepProps} />
      case 2: return <WorkingCapitalStep {...stepProps} />
      case 3: return <DebtWaccStep {...stepProps} />
      case 4: return <CapexAmortizationStep {...stepProps} />
      case 5: return <TaxOthersStep {...stepProps} />
      default: return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">
          Supuestos Financieros Clave
        </h1>
        <p className="text-muted-foreground">
          Configure los parámetros fundamentales para las proyecciones financieras
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <Stepper steps={steps} currentStep={currentStep} />
        <Progress value={progress} className="w-full" />
        <p className="text-center text-sm text-muted-foreground">
          Paso {currentStep + 1} de {steps.length}
        </p>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          variant="secondary"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>

        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="gap-2"
        >
          {currentStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
