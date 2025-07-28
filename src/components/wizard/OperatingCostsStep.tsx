import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SliderInput } from "@/components/ui/slider-input"
import { NumberInput } from "@/components/ui/number-input"
import { type FinancialAssumptions } from "@/schemas/financial-assumptions"

interface OperatingCostsStepProps {
  form: UseFormReturn<FinancialAssumptions>
}

export function OperatingCostsStep({ form }: OperatingCostsStepProps) {
  const { watch, setValue, formState: { errors } } = form

  const variableCostPercentage = watch("operatingCosts.variableCostPercentage") || 0
  const fixedAnnualCost = watch("operatingCosts.fixedAnnualCost") || 0
  const personnelCost = watch("operatingCosts.personnelCost") || 0

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
              <Label>Costes variables (% de ventas)</Label>
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
              label="Costes variables (% de ventas)"
              value={variableCostPercentage}
              onValueChange={(value) => setValue("operatingCosts.variableCostPercentage", value)}
              min={0}
              max={100}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              className="flex-1"
            />
            {errors.operatingCosts?.variableCostPercentage && (
              <p className="text-sm text-destructive mt-1">
                {errors.operatingCosts.variableCostPercentage.message}
              </p>
            )}
          </div>

          {/* Fixed Annual Cost */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Costes fijos anuales (€)</Label>
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
              label="Costes fijos anuales (€)"
              value={fixedAnnualCost}
              onValueChange={(value) => setValue("operatingCosts.fixedAnnualCost", value)}
              min={0}
              step={1000}
              className="flex-1"
            />
            {errors.operatingCosts?.fixedAnnualCost && (
              <p className="text-sm text-destructive mt-1">
                {errors.operatingCosts.fixedAnnualCost.message}
              </p>
            )}
          </div>

          {/* Personnel Cost */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Label>Costes de personal (€)</Label>
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
              label="Costes de personal (€)"
              value={personnelCost}
              onValueChange={(value) => setValue("operatingCosts.personnelCost", value)}
              min={0}
              step={1000}
              className="flex-1"
            />
            {errors.operatingCosts?.personnelCost && (
              <p className="text-sm text-destructive mt-1">
                {errors.operatingCosts.personnelCost.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}