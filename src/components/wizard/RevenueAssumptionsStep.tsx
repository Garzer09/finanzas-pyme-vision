import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SliderInput } from "@/components/ui/slider-input"
import { NumberInput } from "@/components/ui/number-input"
import { type FinancialAssumptions } from "@/schemas/financial-assumptions"

interface RevenueAssumptionsStepProps {
  form: UseFormReturn<FinancialAssumptions>
}

export function RevenueAssumptionsStep({ form }: RevenueAssumptionsStepProps) {
  const { register, watch, setValue, formState: { errors } } = form

  const salesGrowth = watch("revenueAssumptions.salesGrowth") || 0
  const averageUnitPrice = watch("revenueAssumptions.averageUnitPrice") || 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary">Premisas de Ingresos</CardTitle>
        <CardDescription>
          Define los supuestos clave para las proyecciones de ingresos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Sales Growth */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Crecimiento de ventas anual (%)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tasa de crecimiento anual esperada de las ventas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label="Crecimiento de ventas anual"
              value={salesGrowth}
              onValueChange={(value) => setValue("revenueAssumptions.salesGrowth", value)}
              min={0}
              max={100}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              className="flex-1"
            />
            {errors.revenueAssumptions?.salesGrowth && (
              <p className="text-sm text-destructive mt-1">
                {errors.revenueAssumptions.salesGrowth.message}
              </p>
            )}
          </div>

          {/* Average Unit Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Precio unitario promedio (€)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Precio promedio esperado por unidad vendida</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <NumberInput
              label="Precio unitario promedio (€)"
              value={averageUnitPrice}
              onValueChange={(value) => setValue("revenueAssumptions.averageUnitPrice", value)}
              min={0}
              step={0.01}
              className="flex-1"
            />
            {errors.revenueAssumptions?.averageUnitPrice && (
              <p className="text-sm text-destructive mt-1">
                {errors.revenueAssumptions.averageUnitPrice.message}
              </p>
            )}
          </div>
        </div>

        {/* Product Mix */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Mix de productos (opcional)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Descripción del mix de productos y su participación en ventas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            placeholder="Ej: 60% productos premium, 40% productos estándar"
            className="min-h-[100px]"
            {...register("revenueAssumptions.productMix")}
          />
          {errors.revenueAssumptions?.productMix && (
            <p className="text-sm text-destructive mt-1">
              {errors.revenueAssumptions.productMix.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}