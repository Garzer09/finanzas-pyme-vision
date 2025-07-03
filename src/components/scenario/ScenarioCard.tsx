import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NumberInput } from "@/components/ui/number-input"
import { Edit3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomScenario } from "@/schemas/scenario-schemas"

interface ScenarioCardProps {
  scenario: CustomScenario
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updated: CustomScenario) => void
  disabled?: boolean
}

export function ScenarioCard({ 
  scenario, 
  isSelected, 
  onSelect, 
  onUpdate, 
  disabled = false 
}: ScenarioCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(scenario)

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(scenario)
    setIsEditing(false)
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        isSelected && "ring-2 ring-primary",
        !isSelected && "hover:ring-1 hover:ring-muted-foreground/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={!disabled ? onSelect : undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`Escenario ${scenario.name}, probabilidad ${scenario.probability}%`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground text-base">
              {scenario.name}
            </h4>
            <span className="text-sm text-muted-foreground">
              Probabilidad: {scenario.probability}%
            </span>
          </div>
          
          <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                aria-label={`Editar escenario ${scenario.name}`}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Settings className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">Editar Escenario</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      maxLength={50}
                      aria-describedby="name-help"
                    />
                    <p id="name-help" className="text-xs text-muted-foreground mt-1">
                      Máximo 50 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="note">Nota (opcional)</Label>
                    <Textarea
                      id="note"
                      value={editData.note || ""}
                      onChange={(e) => setEditData(prev => ({ ...prev, note: e.target.value }))}
                      maxLength={250}
                      rows={2}
                      aria-describedby="note-help"
                    />
                    <p id="note-help" className="text-xs text-muted-foreground mt-1">
                      Máximo 250 caracteres
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Ventas (%)"
                      value={editData.salesDelta}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, salesDelta: value }))}
                      min={-30}
                      max={30}
                      step={1}
                      formatValue={(value) => `${value > 0 ? '+' : ''}${value}%`}
                      aria-label="Variación de ventas en porcentaje"
                    />
                    <NumberInput
                      label="Costes (%)"
                      value={editData.costsDelta}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, costsDelta: value }))}
                      min={-20}
                      max={20}
                      step={1}
                      formatValue={(value) => `${value > 0 ? '+' : ''}${value}%`}
                      aria-label="Variación de costes en porcentaje"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Precios (%)"
                      value={editData.priceDelta}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, priceDelta: value }))}
                      min={-15}
                      max={15}
                      step={1}
                      formatValue={(value) => `${value > 0 ? '+' : ''}${value}%`}
                      aria-label="Variación de precios en porcentaje"
                    />
                    <NumberInput
                      label="Probabilidad (%)"
                      value={editData.probability}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, probability: value }))}
                      min={0}
                      max={100}
                      step={1}
                      formatValue={(value) => `${value}%`}
                      aria-label="Probabilidad del escenario en porcentaje"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} size="sm" className="flex-1">
                    Guardar
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {scenario.note && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {scenario.note}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-muted-foreground">
            <span>Ventas: </span>
            <span className={cn(
              "font-medium",
              scenario.salesDelta > 0 ? "text-success" : 
              scenario.salesDelta < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {scenario.salesDelta > 0 ? '+' : ''}{scenario.salesDelta}%
            </span>
          </div>
          <div className="text-muted-foreground">
            <span>Costes: </span>
            <span className={cn(
              "font-medium",
              scenario.costsDelta > 0 ? "text-destructive" : 
              scenario.costsDelta < 0 ? "text-success" : "text-muted-foreground"
            )}>
              {scenario.costsDelta > 0 ? '+' : ''}{scenario.costsDelta}%
            </span>
          </div>
          <div className="text-muted-foreground">
            <span>Precios: </span>
            <span className={cn(
              "font-medium",
              scenario.priceDelta > 0 ? "text-success" : 
              scenario.priceDelta < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {scenario.priceDelta > 0 ? '+' : ''}{scenario.priceDelta}%
            </span>
          </div>
          <div className="text-muted-foreground">
            <span>Prob: </span>
            <span className="font-medium text-primary">
              {scenario.probability}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}