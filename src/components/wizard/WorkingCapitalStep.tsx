import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SliderInput } from "@/components/ui/slider-input"
import { type FinancialAssumptions } from "@/schemas/financial-assumptions"

interface WorkingCapitalStepProps {
  form: UseFormReturn<FinancialAssumptions>
}

export function WorkingCapitalStep({ form }: WorkingCapitalStepProps) {
  const { watch, setValue, formState: { errors } } = form

  const collectionDays = watch("workingCapital.collectionDays") || 0
  const paymentDays = watch("workingCapital.paymentDays") || 0
  const inventoryDays = watch("workingCapital.inventoryDays") || 0

  const cashConversionCycle = collectionDays + inventoryDays - paymentDays

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary">Capital de Trabajo</CardTitle>
        <CardDescription>
          Define los ciclos de cobro, pago e inventario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Collection Days */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Días de cobro promedio</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Número promedio de días que tardan en cobrarse las ventas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label="Días de cobro promedio"
              value={collectionDays}
              onValueChange={(value) => setValue("workingCapital.collectionDays", value)}
              min={0}
              max={365}
              step={1}
              formatValue={(value) => `${value} días`}
              className="flex-1"
            />
            {errors.workingCapital?.collectionDays && (
              <p className="text-sm text-destructive mt-1">
                {errors.workingCapital.collectionDays.message}
              </p>
            )}
          </div>

          {/* Payment Days */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Días de pago promedio</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Número promedio de días de pago a proveedores</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label="Días de pago promedio"
              value={paymentDays}
              onValueChange={(value) => setValue("workingCapital.paymentDays", value)}
              min={0}
              max={365}
              step={1}
              formatValue={(value) => `${value} días`}
              className="flex-1"
            />
            {errors.workingCapital?.paymentDays && (
              <p className="text-sm text-destructive mt-1">
                {errors.workingCapital.paymentDays.message}
              </p>
            )}
          </div>

          {/* Inventory Days */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Label>Días de inventario promedio</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Número promedio de días que el inventario permanece en stock</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label="Días de inventario promedio"
              value={inventoryDays}
              onValueChange={(value) => setValue("workingCapital.inventoryDays", value)}
              min={0}
              max={365}
              step={1}
              formatValue={(value) => `${value} días`}
              className="flex-1"
            />
            {errors.workingCapital?.inventoryDays && (
              <p className="text-sm text-destructive mt-1">
                {errors.workingCapital.inventoryDays.message}
              </p>
            )}
          </div>
        </div>

        {/* Cash Conversion Cycle Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">Ciclo de Conversión de Efectivo</h4>
            <p className="text-2xl font-bold text-primary">
              {cashConversionCycle} días
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Días de cobro + Días de inventario - Días de pago)
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}