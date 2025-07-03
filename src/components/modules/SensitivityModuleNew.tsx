import { useState } from "react"
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Settings, 
  BarChart3, 
  Gauge, 
  TrendingUp, 
  Save, 
  FileDown, 
  RotateCcw,
  Plus
} from "lucide-react"
import { ImpactSummaryCard } from "@/components/scenario/ImpactSummaryCard"
import { ScenarioCard } from "@/components/scenario/ScenarioCard"
import { CustomScenario } from "@/schemas/scenario-schemas"
import { cn } from "@/lib/utils"

export const SensitivityModuleNew = () => {
  const [activeTab, setActiveTab] = useState("configuracion")
  const [scenarioSaved, setScenarioSaved] = useState(false)
  const { toast } = useToast()

  // Slider states
  const [salesDelta, setSalesDelta] = useState([0])
  const [costsDelta, setCostsDelta] = useState([0])
  const [priceDelta, setPriceDelta] = useState([0])

  // Base financial data
  const baseData = {
    ebitda: 450,
    margin: 18.0,
    cashFlow: 320,
    revenue: 2500
  }

  // Predefined scenarios
  const [scenarios, setScenarios] = useState<CustomScenario[]>([
    {
      id: "pesimista",
      name: "Pesimista",
      note: "Escenario conservador con condiciones adversas del mercado",
      salesDelta: -15,
      costsDelta: 8,
      priceDelta: -5,
      probability: 25
    },
    {
      id: "base",
      name: "Base",
      note: "Escenario más probable basado en tendencias actuales",
      salesDelta: 5,
      costsDelta: 3,
      priceDelta: 0,
      probability: 50
    },
    {
      id: "optimista",
      name: "Optimista",
      note: "Escenario favorable con crecimiento acelerado",
      salesDelta: 20,
      costsDelta: -2,
      priceDelta: 8,
      probability: 25
    }
  ])

  const [selectedScenario, setSelectedScenario] = useState("base")

  // Calculate impact
  const calculateImpact = (sales: number, costs: number, prices: number) => {
    const salesImpact = (sales / 100) * baseData.ebitda * 0.6 // 60% flow-through
    const costsImpact = -(costs / 100) * baseData.ebitda * 0.4 // 40% cost impact
    const priceImpact = (prices / 100) * baseData.ebitda * 0.8 // 80% price flow-through
    
    const ebitdaSimulated = baseData.ebitda + salesImpact + costsImpact + priceImpact
    const deltaPercentage = ((ebitdaSimulated / baseData.ebitda) - 1) * 100
    const marginSimulated = (ebitdaSimulated / baseData.revenue) * 100
    const cashFlow = ebitdaSimulated * 0.75 // Simplified cash flow calculation
    const dscr = cashFlow / 180 // Assuming 180K debt service

    return {
      ebitdaBase: baseData.ebitda,
      ebitdaSimulated,
      deltaPercentage,
      marginSimulated,
      cashFlow,
      dscr
    }
  }

  const currentImpact = calculateImpact(salesDelta[0], costsDelta[0], priceDelta[0])

  const handleSaveScenario = () => {
    setScenarioSaved(true)
    toast({
      title: "Escenario guardado",
      description: "El escenario ha sido guardado exitosamente. Ahora puedes acceder a los análisis avanzados.",
    })
  }

  const handleReset = () => {
    setSalesDelta([0])
    setCostsDelta([0])
    setPriceDelta([0])
    setSelectedScenario("base")
    toast({
      title: "Valores restablecidos",
      description: "Todos los valores han sido restablecidos al escenario base.",
    })
  }

  const handleAddScenario = () => {
    if (scenarios.length >= 6) {
      toast({
        title: "Límite alcanzado",
        description: "No puedes crear más de 6 escenarios.",
        variant: "destructive"
      })
      return
    }

    const newScenario: CustomScenario = {
      id: `custom-${Date.now()}`,
      name: `Escenario ${scenarios.length + 1}`,
      note: "",
      salesDelta: 0,
      costsDelta: 0,
      priceDelta: 0,
      probability: 0
    }

    setScenarios(prev => [...prev, newScenario])
    setSelectedScenario(newScenario.id)
  }

  const updateScenario = (updated: CustomScenario) => {
    setScenarios(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Análisis de Sensibilidad y Escenarios
            </h1>
            <p className="text-muted-foreground">
              Evaluación de riesgos y planificación estratégica con análisis de impacto
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted h-12">
              <TabsTrigger 
                value="configuracion"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                aria-label="Configuración de escenarios"
              >
                <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                Configuración
              </TabsTrigger>
              <TabsTrigger 
                value="comparativa"
                disabled={!scenarioSaved}
                className={cn(
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  !scenarioSaved && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Comparativa de escenarios"
                aria-describedby={!scenarioSaved ? "tabs-disabled-help" : undefined}
              >
                <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                Comparativa
              </TabsTrigger>
              <TabsTrigger 
                value="tornado"
                disabled={!scenarioSaved}
                className={cn(
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  !scenarioSaved && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Análisis Tornado"
                aria-describedby={!scenarioSaved ? "tabs-disabled-help" : undefined}
              >
                <Gauge className="h-4 w-4 mr-2" aria-hidden="true" />
                Tornado
              </TabsTrigger>
              <TabsTrigger 
                value="unifactorial"
                disabled={!scenarioSaved}
                className={cn(
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  !scenarioSaved && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Análisis Unifactorial"
                aria-describedby={!scenarioSaved ? "tabs-disabled-help" : undefined}
              >
                <TrendingUp className="h-4 w-4 mr-2" aria-hidden="true" />
                Unifactorial
              </TabsTrigger>
            </TabsList>

            {!scenarioSaved && (
              <p id="tabs-disabled-help" className="text-sm text-muted-foreground mt-2">
                Guarda un escenario para habilitar los análisis avanzados
              </p>
            )}

            {/* Configuration Tab */}
            <TabsContent value="configuracion" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simulador de Variables */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
                      Simulador de Variables
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Sales Delta Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="sales-slider" className="text-sm font-medium">
                          Variación de Ventas
                        </Label>
                        <span className="text-sm font-bold text-primary">
                          {salesDelta[0] > 0 ? '+' : ''}{salesDelta[0]}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Slider
                          id="sales-slider"
                          value={salesDelta}
                          onValueChange={setSalesDelta}
                          min={-30}
                          max={30}
                          step={1}
                          className="w-full"
                          aria-label={`Variación de ventas: ${salesDelta[0]}%`}
                          aria-valuemin={-30}
                          aria-valuemax={30}
                          aria-valuenow={salesDelta[0]}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>-30%</span>
                          <span>+30%</span>
                        </div>
                      </div>
                    </div>

                    {/* Costs Delta Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="costs-slider" className="text-sm font-medium">
                          Variación de Costes
                        </Label>
                        <span className="text-sm font-bold text-primary">
                          {costsDelta[0] > 0 ? '+' : ''}{costsDelta[0]}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Slider
                          id="costs-slider"
                          value={costsDelta}
                          onValueChange={setCostsDelta}
                          min={-20}
                          max={20}
                          step={1}
                          className="w-full"
                          aria-label={`Variación de costes: ${costsDelta[0]}%`}
                          aria-valuemin={-20}
                          aria-valuemax={20}
                          aria-valuenow={costsDelta[0]}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>-20%</span>
                          <span>+20%</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Delta Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="price-slider" className="text-sm font-medium">
                          Variación de Precios
                        </Label>
                        <span className="text-sm font-bold text-primary">
                          {priceDelta[0] > 0 ? '+' : ''}{priceDelta[0]}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Slider
                          id="price-slider"
                          value={priceDelta}
                          onValueChange={setPriceDelta}
                          min={-15}
                          max={15}
                          step={1}
                          className="w-full"
                          aria-label={`Variación de precios: ${priceDelta[0]}%`}
                          aria-valuemin={-15}
                          aria-valuemax={15}
                          aria-valuenow={priceDelta[0]}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>-15%</span>
                          <span>+15%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Impact Summary */}
                <ImpactSummaryCard {...currentImpact} />
              </div>

              {/* Escenarios Predefinidos */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
                      Escenarios Predefinidos
                    </CardTitle>
                    <Button
                      onClick={handleAddScenario}
                      disabled={scenarios.length >= 6}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      aria-label="Añadir nuevo escenario"
                    >
                      <Plus className="h-4 w-4" />
                      Nuevo
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selecciona y personaliza escenarios de análisis (máximo 6)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scenarios.map((scenario) => (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        isSelected={selectedScenario === scenario.id}
                        onSelect={() => setSelectedScenario(scenario.id)}
                        onUpdate={updateScenario}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Button onClick={handleSaveScenario} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Escenario
                </Button>
                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exportar Excel
                </Button>
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Restablecer
                </Button>
              </div>
            </TabsContent>

            {/* Comparativa Tab */}
            <TabsContent value="comparativa" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Comparación de Escenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scenarios.map((scenario) => (
                        <div key={scenario.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{scenario.name}</span>
                            <p className="text-sm text-muted-foreground">
                              Ventas: {scenario.salesDelta > 0 ? '+' : ''}{scenario.salesDelta}% | 
                              Costes: {scenario.costsDelta > 0 ? '+' : ''}{scenario.costsDelta}%
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              €{(baseData.ebitda + (scenario.salesDelta * 2.5) - (scenario.costsDelta * 1.5)).toFixed(0)}K
                            </div>
                            <div className="text-sm text-muted-foreground">EBITDA</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Impactos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Escenario más favorable:</span>
                        <span className="text-success font-medium">Optimista</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mayor riesgo:</span>
                        <span className="text-destructive font-medium">Pesimista</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rango de variación:</span>
                        <span className="font-medium">±{Math.max(...scenarios.map(s => Math.abs(s.salesDelta)))}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tornado Tab */}
            <TabsContent value="tornado" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    Análisis de Sensibilidad Tornado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">
                        Impacto de cada variable en el EBITDA (ordenado por magnitud)
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        { variable: 'Ventas ±10%', impact: '±25K', color: 'bg-primary' },
                        { variable: 'Costes Variables ±5%', impact: '±15K', color: 'bg-warning' },
                        { variable: 'Precio ±3%', impact: '±7.5K', color: 'bg-success' },
                        { variable: 'Volumen ±8%', impact: '±20K', color: 'bg-destructive' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-32 text-sm font-medium">{item.variable}</div>
                          <div className="flex-1 relative">
                            <div className="h-8 bg-muted rounded-lg flex items-center justify-center">
                              <div className={`h-6 ${item.color} rounded opacity-70`} style={{width: `${60 + index * 10}%`}}></div>
                            </div>
                          </div>
                          <div className="w-20 text-sm font-medium text-right">{item.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Unifactorial Tab */}
            <TabsContent value="unifactorial" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Análisis Unifactorial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Variable a Analizar</h4>
                        <div className="space-y-2">
                          {['Ventas', 'Costes Variables', 'Precio de Venta', 'Volumen'].map((variable) => (
                            <label key={variable} className="flex items-center space-x-2">
                              <input type="radio" name="variable" value={variable} defaultChecked={variable === 'Ventas'} />
                              <span className="text-sm">{variable}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Rango de Análisis</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Desde: -20%</Label>
                            <Slider defaultValue={[-20]} max={0} min={-50} step={1} />
                          </div>
                          <div>
                            <Label>Hasta: +20%</Label>
                            <Slider defaultValue={[20]} max={50} min={0} step={1} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-3">Resultados del Análisis</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-destructive">€360K</div>
                          <div className="text-sm text-muted-foreground">Escenario -20%</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">€450K</div>
                          <div className="text-sm text-muted-foreground">Base</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-success">€540K</div>
                          <div className="text-sm text-muted-foreground">Escenario +20%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
