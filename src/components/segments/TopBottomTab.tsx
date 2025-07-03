import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface TopBottomTabProps {
  segmentType: "producto" | "region" | "cliente"
  data: Array<{
    id: string
    name: string
    sales: number
    yoyGrowth: number
    averageTicket: number
  }>
}

export function TopBottomTab({ segmentType, data }: TopBottomTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof typeof data[0]
    direction: 'asc' | 'desc'
  }>({ key: 'sales', direction: 'desc' })

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)

  const formatPercentage = (value: number) => 
    `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

  const handleSort = (key: keyof typeof data[0]) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const filteredAndSortedData = data
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })

  const getSegmentLabel = () => {
    switch (segmentType) {
      case "producto": return "Producto"
      case "region": return "Región"
      case "cliente": return "Tipo de Cliente"
      default: return "Segmento"
    }
  }

  const SortButton = ({ column, children }: { column: keyof typeof data[0], children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-semibold"
      onClick={() => handleSort(column)}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </Button>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">
              Ranking de {getSegmentLabel()}s
            </CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${getSegmentLabel().toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                aria-label={`Buscar ${getSegmentLabel().toLowerCase()}`}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>
                    <SortButton column="name">{getSegmentLabel()}</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton column="sales">Ventas €</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton column="yoyGrowth">Δ YoY %</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton column="averageTicket">Ticket Medio €</SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : "No hay datos disponibles"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedData.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.sales)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge
                            variant={item.yoyGrowth >= 0 ? "default" : "destructive"}
                            className={cn(
                              "gap-1",
                              item.yoyGrowth >= 0 ? "bg-success text-success-foreground" : "",
                              item.yoyGrowth <= -10 ? "bg-destructive text-destructive-foreground animate-pulse" : ""
                            )}
                          >
                            {item.yoyGrowth >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatPercentage(item.yoyGrowth)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.averageTicket)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedData.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredAndSortedData.length} de {data.length} registros
              {searchTerm && ` para "${searchTerm}"`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}