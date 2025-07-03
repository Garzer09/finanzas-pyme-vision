import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface SliderInputProps {
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

export function SliderInput({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue = (value) => value.toString(),
  className,
  disabled = false,
  "aria-label": ariaLabel,
  ...props
}: SliderInputProps) {
  const [inputValue, setInputValue] = React.useState(value.toString())

  React.useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0]
    onValueChange(newValue)
    setInputValue(newValue.toString())
  }

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

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700">
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-24 h-8 text-sm"
            aria-label={ariaLabel || `${label} input`}
          />
          <span className="text-xs text-slate-500 min-w-max">
            {formatValue(value)}
          </span>
        </div>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full"
        aria-label={ariaLabel || `${label} slider`}
      />
      
      <div className="flex justify-between text-xs text-slate-400">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}