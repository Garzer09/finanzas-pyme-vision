import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumberInputProps {
  label: string
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  formatValue?: (value: number) => string
  className?: string
  disabled?: boolean
  "aria-label"?: string
}

export function NumberInput({
  label,
  value,
  onValueChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  formatValue = (value) => value.toString(),
  className,
  disabled = false,
  "aria-label": ariaLabel,
  ...props
}: NumberInputProps) {
  const [inputValue, setInputValue] = React.useState(value.toString())

  React.useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
    setInputValue(inputVal)
    
    const numericValue = parseFloat(inputVal)
    if (!isNaN(numericValue) && numericValue >= min && numericValue <= max) {
      onValueChange(numericValue)
    }
  }

  const handleInputBlur = () => {
    const numericValue = parseFloat(inputValue)
    if (isNaN(numericValue) || numericValue < min || numericValue > max) {
      setInputValue(value.toString())
    }
  }

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max)
    onValueChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min)
    onValueChange(newValue)
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Label className="text-sm font-medium text-slate-700">
        {label}
      </Label>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="h-9 w-9 p-0"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="text-center flex-1"
          aria-label={ariaLabel || `${label} input`}
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="h-9 w-9 p-0"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-center">
        <span className="text-sm text-slate-600 font-medium">
          {formatValue(value)}
        </span>
      </div>
    </div>
  )
}