import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HelpCircle, Calendar as CalendarIcon } from "lucide-react"
import { NumberInput } from "@/components/ui/number-input"
import { CapexAmortization } from "@/schemas/financial-assumptions"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface CapexAmortizationStepProps {
  form: UseFormReturn<CapexAmortization>
}

export function CapexAmortizationStep({ form }: CapexAmortizationStepProps) {
  const { watch, setValue, formState: { errors } } = form
  
  const plannedInvestment = watch("plannedInvestment") || 0
  const executionDate = watch("executionDate")
  const amortizationMethod = watch("amortizationMethod")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary">CAPEX & Amortización</CardTitle>
        <CardDescription>
          Define las inversiones de capital y su método de amortización
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Planned Investment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Inversión Prevista (€)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Importe total de la inversión en activos fijos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <NumberInput
              label=""
              value={plannedInvestment}
              onValueChange={(value) => setValue("plannedInvestment", value)}
              min={0}
              step={1000}
              formatValue={(value) => `${value.toLocaleString()}€`}
              aria-label="Inversión prevista"
            />
            {errors.plannedInvestment && (
              <p className="text-destructive text-sm">{errors.plannedInvestment.message}</p>
            )}
          </div>

          {/* Execution Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Fecha de Ejecución</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fecha prevista para la realización de la inversión</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !executionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {executionDate ? (
                    format(executionDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={executionDate}
                  onSelect={(date) => setValue("executionDate", date || new Date())}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.executionDate && (
              <p className="text-destructive text-sm">{errors.executionDate.message}</p>
            )}
          </div>

          {/* Amortization Method */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Label>Método de Amortización</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Método contable para distribuir el coste de la inversión</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={amortizationMethod}
              onValueChange={(value: "lineal" | "degresiva" | "otro") => 
                setValue("amortizationMethod", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lineal">Lineal</SelectItem>
                <SelectItem value="degresiva">Degresiva</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            {errors.amortizationMethod && (
              <p className="text-destructive text-sm">{errors.amortizationMethod.message}</p>
            )}
          </div>
        </div>

        {/* Method Description */}
        {amortizationMethod && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Descripción del Método</h4>
              <p className="text-sm text-muted-foreground">
                {amortizationMethod === "lineal" && 
                  "Amortización constante durante toda la vida útil del activo"}
                {amortizationMethod === "degresiva" && 
                  "Mayor amortización en los primeros años, disminuyendo progresivamente"}
                {amortizationMethod === "otro" && 
                  "Método específico según las características del activo"}
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}