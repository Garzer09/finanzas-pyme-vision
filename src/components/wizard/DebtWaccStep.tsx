import { UseFormReturn, useFieldArray } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HelpCircle, Plus, X } from "lucide-react"
import { SliderInput } from "@/components/ui/slider-input"
import { DebtWacc } from "@/schemas/financial-assumptions"

interface DebtWaccStepProps {
  form: UseFormReturn<DebtWacc>
}

export function DebtWaccStep({ form }: DebtWaccStepProps) {
  const { control, register, watch, setValue, formState: { errors } } = form
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "newFinancing"
  })

  const averageDebtCost = watch("averageDebtCost") || 0
  const wacc = watch("wacc") || 0

  const addFinancing = () => {
    append({
      entity: "",
      amount: 0,
      type: "",
      term: 1
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary">Endeudamiento y WACC</CardTitle>
        <CardDescription>
          Define las nuevas financiaciones y el coste de capital
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Financing Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Nuevas Financiaciones</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Detalle de las nuevas financiaciones previstas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFinancing}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </Button>
          </div>

          {fields.length > 0 && (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Importe (€)</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plazo (años)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Input
                          {...register(`newFinancing.${index}.entity`)}
                          placeholder="Banco/Entidad"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          {...register(`newFinancing.${index}.amount`, { valueAsNumber: true })}
                          placeholder="0"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          {...register(`newFinancing.${index}.type`)}
                          placeholder="Préstamo/Línea..."
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          {...register(`newFinancing.${index}.term`, { valueAsNumber: true })}
                          placeholder="5"
                          className="w-full"
                          min="1"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Average Debt Cost and WACC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Coste Medio de la Deuda (%)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coste promedio ponderado de toda la deuda</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label=""
              value={averageDebtCost}
              onValueChange={(value) => setValue("averageDebtCost", value)}
              min={0}
              max={25}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              aria-label="Coste medio de la deuda"
            />
            {errors.averageDebtCost && (
              <p className="text-destructive text-sm">{errors.averageDebtCost.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>WACC Proporcionado (%)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coste promedio ponderado del capital (WACC)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SliderInput
              label=""
              value={wacc}
              onValueChange={(value) => setValue("wacc", value)}
              min={0}
              max={30}
              step={0.1}
              formatValue={(value) => `${value.toFixed(1)}%`}
              aria-label="WACC proporcionado"
            />
            {errors.wacc && (
              <p className="text-destructive text-sm">{errors.wacc.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}