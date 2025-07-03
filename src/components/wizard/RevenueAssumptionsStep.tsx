import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { SliderInput } from "@/components/ui/slider-input"
import { NumberInput } from "@/components/ui/number-input"
import { RevenueAssumptions } from "@/schemas/financial-assumptions"

interface RevenueAssumptionsStepProps {
  form: UseFormReturn<RevenueAssumptions>
}

export function RevenueAssumptionsStep({ form }: RevenueAssumptionsStepProps) {
  const { register, watch, setValue, formState: { errors } } = form
  
  const salesGrowth = watch("salesGrowth") || 0
  const averageUnitPrice = watch("averageUnitPrice") || 0

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
              <Label htmlFor="salesGrowth">Crecimiento de Ventas (%)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Porcentaje de crecimiento anual esperado en las ventas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label=""
              value={salesGrowth}
              onValueChange={(value) => setValue("salesGrowth", value)}
              min={0}
              max={100}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              aria-label="Crecimiento de ventas"
            />
            {errors.salesGrowth && (
              <p className="text-destructive text-sm">{errors.salesGrowth.message}</p>
            )}
          </div>

          {/* Average Unit Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="averageUnitPrice">Precio Medio por Unidad (€)</Label>
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
              label=""
              value={averageUnitPrice}
              onValueChange={(value) => setValue("averageUnitPrice", value)}
              min={0}
              step={0.01}
              formatValue={(value) => `${value.toFixed(2)}€`}
              aria-label="Precio medio por unidad"
            />
            {errors.averageUnitPrice && (
              <p className="text-destructive text-sm">{errors.averageUnitPrice.message}</p>
            )}
          </div>
        </div>

        {/* Product Mix */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="productMix">Mix de Productos (Opcional)</Label>
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
            id="productMix"
            placeholder="Describe la composición de productos y su peso en las ventas..."
            className="min-h-[100px]"
            {...register("productMix")}
          />
          {errors.productMix && (
            <p className="text-destructive text-sm">{errors.productMix.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}