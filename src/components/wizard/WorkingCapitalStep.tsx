import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { NumberInput } from "@/components/ui/number-input"
import { WorkingCapital } from "@/schemas/financial-assumptions"

interface WorkingCapitalStepProps {
  form: UseFormReturn<WorkingCapital>
}

export function WorkingCapitalStep({ form }: WorkingCapitalStepProps) {
  const { watch, setValue, formState: { errors } } = form
  
  const collectionDays = watch("collectionDays") || 0
  const paymentDays = watch("paymentDays") || 0
  const inventoryDays = watch("inventoryDays") || 0

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
              <Label>Días de Cobro</Label>
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
            <NumberInput
              label=""
              value={collectionDays}
              onValueChange={(value) => setValue("collectionDays", value)}
              min={0}
              max={365}
              step={1}
              formatValue={(value) => `${value} días`}
              aria-label="Días de cobro"
            />
            {errors.collectionDays && (
              <p className="text-destructive text-sm">{errors.collectionDays.message}</p>
            )}
          </div>

          {/* Payment Days */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Días de Pago</Label>
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
            <NumberInput
              label=""
              value={paymentDays}
              onValueChange={(value) => setValue("paymentDays", value)}
              min={0}
              max={365}
              step={1}
              formatValue={(value) => `${value} días`}
              aria-label="Días de pago"
            />
            {errors.paymentDays && (
              <p className="text-destructive text-sm">{errors.paymentDays.message}</p>
            )}
          </div>

          {/* Inventory Days */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Label>Días de Inventario</Label>
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
            <NumberInput
              label=""
              value={inventoryDays}
              onValueChange={(value) => setValue("inventoryDays", value)}
              min={0}
              max={365}
              step={1}
              formatValue={(value) => `${value} días`}
              aria-label="Días de inventario"
            />
            {errors.inventoryDays && (
              <p className="text-destructive text-sm">{errors.inventoryDays.message}</p>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">Ciclo de Conversión de Efectivo</h4>
            <p className="text-sm text-muted-foreground">
              {collectionDays + inventoryDays - paymentDays} días
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