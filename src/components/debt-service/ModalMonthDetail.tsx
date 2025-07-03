import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, TrendingDown, Info } from "lucide-react"

interface MonthData {
  mes: string
  servicio: number
  flujoDisponible: number
  dscr: number
}

interface ModalMonthDetailProps {
  isOpen: boolean
  onClose: () => void
  monthData: MonthData | null
}

export function ModalMonthDetail({ isOpen, onClose, monthData }: ModalMonthDetailProps) {
  if (!monthData) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getRiskLevel = (dscr: number) => {
    if (dscr >= 1.2) return { level: 'Bueno', variant: 'default', color: 'text-green-700' }
    if (dscr >= 1.0) return { level: 'Aceptable', variant: 'secondary', color: 'text-yellow-700' }
    return { level: 'Riesgo Alto', variant: 'destructive', color: 'text-red-700' }
  }

  const risk = getRiskLevel(monthData.dscr)
  const deficit = monthData.flujoDisponible < monthData.servicio
  const deficitAmount = deficit ? monthData.servicio - monthData.flujoDisponible : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="month-detail-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {deficit && <AlertTriangle className="h-5 w-5 text-red-500" />}
            Detalle de {monthData.mes}
          </DialogTitle>
          <DialogDescription id="month-detail-description">
            Análisis detallado del servicio de deuda y flujo de caja del mes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado general */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">Estado del DSCR</span>
            <Badge variant={risk.variant as any} className="font-medium">
              {risk.level}
            </Badge>
          </div>

          <Separator />

          {/* Métricas principales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">SERVICIO DE DEUDA</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(monthData.servicio)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">FLUJO DISPONIBLE</p>
              <p className={`text-lg font-bold ${deficit ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(monthData.flujoDisponible)}
              </p>
            </div>
          </div>

          {/* DSCR */}
          <div className="p-3 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">DSCR (Ratio de Cobertura)</span>
              <Info className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${risk.color}`}>
                {monthData.dscr.toFixed(2)}x
              </span>
              <span className="text-sm text-slate-500">
                (Flujo ÷ Servicio)
              </span>
            </div>
          </div>

          {/* Alerta de déficit */}
          {deficit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Déficit de Liquidez</span>
              </div>
              <p className="text-sm text-red-600">
                Falta <span className="font-bold">{formatCurrency(deficitAmount)}</span> para 
                cubrir el servicio de deuda del mes.
              </p>
            </div>
          )}

          {/* Recomendaciones */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-700 mb-1">RECOMENDACIÓN</p>
            <p className="text-sm text-blue-600">
              {monthData.dscr >= 1.2 
                ? "El mes mantiene un nivel de cobertura saludable."
                : monthData.dscr >= 1.0 
                ? "Se recomienda monitorear de cerca este mes y optimizar el flujo de caja."
                : "Mes crítico: considerar refinanciación o inyección de capital."
              }
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}