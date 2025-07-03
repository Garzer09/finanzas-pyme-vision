import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"

interface SegmentFilterProps {
  segmentType: "producto" | "region" | "cliente"
  onSegmentTypeChange: (type: "producto" | "region" | "cliente") => void
  className?: string
}

export function SegmentFilter({
  segmentType,
  onSegmentTypeChange,
  className
}: SegmentFilterProps) {
  const segmentTypes = [
    { 
      value: "producto", 
      label: "Por Producto",
      description: "Análisis por líneas de productos"
    },
    { 
      value: "region", 
      label: "Por Región",
      description: "Análisis por áreas geográficas"
    },
    { 
      value: "cliente", 
      label: "Por Tipo de Cliente",
      description: "Análisis por categorías de clientes"
    }
  ] as const

  const currentSegment = segmentTypes.find(s => s.value === segmentType)

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="segment-filter" className="text-sm font-medium flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
        Tipo de Segmentación
      </Label>
      <Select
        value={segmentType}
        onValueChange={onSegmentTypeChange}
      >
        <SelectTrigger 
          id="segment-filter"
          className="w-full"
          aria-label={`Segmentación seleccionada: ${currentSegment?.label}`}
        >
          <SelectValue placeholder="Selecciona tipo de análisis" />
        </SelectTrigger>
        <SelectContent>
          {segmentTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex flex-col">
                <span className="font-medium">{type.label}</span>
                <span className="text-xs text-muted-foreground">{type.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}