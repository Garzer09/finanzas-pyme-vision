import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SliderInput } from "@/components/ui/slider-input"
import { type FinancialAssumptions } from "@/schemas/financial-assumptions"

interface TaxOthersStepProps {
  form: UseFormReturn<FinancialAssumptions>
}

export function TaxOthersStep({ form }: TaxOthersStepProps) {
  const { watch, setValue, formState: { errors } } = form

  const effectiveTaxRate = watch("taxOthers.effectiveTaxRate") || 0
  const dividendPolicy = watch("taxOthers.dividendPolicy") || 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary">Tasa Impositiva y Otros</CardTitle>
        <CardDescription>
          Define la política fiscal y de distribución de resultados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Effective Tax Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Tasa impositiva efectiva (%)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tasa impositiva efectiva aplicable a los beneficios</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label="Tasa impositiva efectiva"
              value={effectiveTaxRate}
              onValueChange={(value) => setValue("taxOthers.effectiveTaxRate", value)}
              min={0}
              max={50}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              className="flex-1"
            />
            {errors.taxOthers?.effectiveTaxRate && (
              <p className="text-sm text-destructive mt-1">
                {errors.taxOthers.effectiveTaxRate.message}
              </p>
            )}
          </div>

          {/* Dividend Policy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Política de dividendos (% de beneficios)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Porcentaje del beneficio neto destinado a dividendos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label="Política de dividendos (% de beneficios)"
              value={dividendPolicy}
              onValueChange={(value) => setValue("taxOthers.dividendPolicy", value)}
              min={0}
              max={100}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              className="flex-1"
            />
            {errors.taxOthers?.dividendPolicy && (
              <p className="text-sm text-destructive mt-1">
                {errors.taxOthers.dividendPolicy.message}
              </p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Retención Fiscal</h4>
              <p className="text-2xl font-bold text-primary">
                {effectiveTaxRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                del beneficio antes de impuestos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Retención de Beneficios</h4>
              <p className="text-2xl font-bold text-primary">
                {(100 - dividendPolicy).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                del beneficio neto se reinvierte
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}