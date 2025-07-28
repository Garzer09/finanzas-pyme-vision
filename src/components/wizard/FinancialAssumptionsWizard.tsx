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

  const { watch, trigger, getValues } = form

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

  const progress = ((currentStep + 1) / steps.length) * 100

  const canProceed = async () => {
    const currentStepKey = Object.keys(defaultValues)[currentStep] as keyof FinancialAssumptions
    const currentStepData = getValues(currentStepKey)
    
    try {
      stepSchemas[currentStep].parse(currentStepData)
      return true
    } catch {
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
        toast({
          title: "Wizard completado",
          description: "Los supuestos financieros han sido configurados exitosamente.",
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
        // Here you would typically save to your API
        // await saveFinancialAssumptions(data)
        
        localStorage.setItem('financial-assumptions', JSON.stringify(data))
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