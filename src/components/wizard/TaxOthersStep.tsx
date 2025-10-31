import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { SliderInput } from "@/components/ui/slider-input"
import { TaxOthers } from "@/schemas/financial-assumptions"

interface TaxOthersStepProps {
  form: UseFormReturn<TaxOthers>
}

export function TaxOthersStep({ form }: TaxOthersStepProps) {
  const { watch, setValue, formState: { errors } } = form
  
  const effectiveTaxRate = watch("effectiveTaxRate") || 0
  const dividendPolicy = watch("dividendPolicy") || 0

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
              <Label>Tipo Impositivo Efectivo (%)</Label>
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
              label=""
              value={effectiveTaxRate}
              onValueChange={(value) => setValue("effectiveTaxRate", value)}
              min={0}
              max={50}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              aria-label="Tipo impositivo efectivo"
            />
            {errors.effectiveTaxRate && (
              <p className="text-destructive text-sm">{errors.effectiveTaxRate.message}</p>
            )}
          </div>

          {/* Dividend Policy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Política de Dividendos (%)</Label>
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
              label=""
              value={dividendPolicy}
              onValueChange={(value) => setValue("dividendPolicy", value)}
              min={0}
              max={100}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              aria-label="Política de dividendos"
            />
            {errors.dividendPolicy && (
              <p className="text-destructive text-sm">{errors.dividendPolicy.message}</p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Retención Fiscal</h4>
              <p className="text-lg font-bold text-primary">
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
              <p className="text-lg font-bold text-primary">
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