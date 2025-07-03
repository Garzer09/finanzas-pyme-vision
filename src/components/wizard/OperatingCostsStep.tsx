import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { SliderInput } from "@/components/ui/slider-input"
import { NumberInput } from "@/components/ui/number-input"
import { OperatingCosts } from "@/schemas/financial-assumptions"

interface OperatingCostsStepProps {
  form: UseFormReturn<OperatingCosts>
}

export function OperatingCostsStep({ form }: OperatingCostsStepProps) {
  const { watch, setValue, formState: { errors } } = form
  
  const variableCostPercentage = watch("variableCostPercentage") || 0
  const fixedAnnualCost = watch("fixedAnnualCost") || 0
  const personnelCost = watch("personnelCost") || 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary">Costes Operativos</CardTitle>
        <CardDescription>
          Define los principales componentes de costes de la operación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Variable Cost Percentage */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Coste Variable sobre Ventas (%)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Porcentaje de las ventas que representan los costes variables</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label=""
              value={variableCostPercentage}
              onValueChange={(value) => setValue("variableCostPercentage", value)}
              min={0}
              max={100}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              aria-label="Coste variable sobre ventas"
            />
            {errors.variableCostPercentage && (
              <p className="text-destructive text-sm">{errors.variableCostPercentage.message}</p>
            )}
          </div>

          {/* Fixed Annual Cost */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Coste Fijo Anual (€)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Costes fijos anuales independientes del volumen de ventas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <NumberInput
              label=""
              value={fixedAnnualCost}
              onValueChange={(value) => setValue("fixedAnnualCost", value)}
              min={0}
              step={1000}
              formatValue={(value) => `${value.toLocaleString()}€`}
              aria-label="Coste fijo anual"
            />
            {errors.fixedAnnualCost && (
              <p className="text-destructive text-sm">{errors.fixedAnnualCost.message}</p>
            )}
          </div>

          {/* Personnel Cost */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Label>Coste de Personal (€)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coste anual total de personal incluyendo salarios y cargas sociales</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <NumberInput
              label=""
              value={personnelCost}
              onValueChange={(value) => setValue("personnelCost", value)}
              min={0}
              step={1000}
              formatValue={(value) => `${value.toLocaleString()}€`}
              aria-label="Coste de personal"
            />
            {errors.personnelCost && (
              <p className="text-destructive text-sm">{errors.personnelCost.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}