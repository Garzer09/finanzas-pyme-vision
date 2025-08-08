import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScenarioCard } from '@/components/scenario/ScenarioCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calculator, Plus } from 'lucide-react';
import { CustomScenario } from '@/schemas/scenario-schemas';

interface ScenarioAnalysisProps {
  className?: string;
  baseEbitdaK: number;
  baseRevenueK?: number;
  salesImpactPer1Percent: number; // K€ por 1%
  costsImpactPer1Percent: number; // K€ por 1%
  priceImpactPer1Percent?: number; // K€ por 1%
}

export const ScenarioAnalysis = ({ 
  className,
  baseEbitdaK,
  baseRevenueK,
  salesImpactPer1Percent,
  costsImpactPer1Percent,
  priceImpactPer1Percent = 10
}: ScenarioAnalysisProps) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('base');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogScenario, setDialogScenario] = useState<CustomScenario | null>(null);

  const [scenarios, setScenarios] = useState<CustomScenario[]>([
    {
      id: 'pessimistic',
      name: 'Pesimista',
      note: 'Escenario conservador con reducción de ventas y aumento de costes',
      salesDelta: -15,
      costsDelta: 10,
      priceDelta: -5,
      probability: 20
    },
    {
      id: 'base',
      name: 'Base',
      note: 'Escenario actual sin cambios significativos',
      salesDelta: 0,
      costsDelta: 0,
      priceDelta: 0,
      probability: 60
    },
    {
      id: 'optimistic',
      name: 'Optimista',
      note: 'Crecimiento sostenido con mejoras operativas',
      salesDelta: 20,
      costsDelta: -8,
      priceDelta: 5,
      probability: 20
    }
  ]);

  const calculateEbitda = (scenario: CustomScenario) => {
    const salesImpact = scenario.salesDelta * salesImpactPer1Percent;
    const costsImpact = scenario.costsDelta * costsImpactPer1Percent;
    const priceImpact = scenario.priceDelta * priceImpactPer1Percent;
    return baseEbitdaK + salesImpact - costsImpact + priceImpact;
  };

  const chartData = scenarios.map(scenario => ({
    scenario: scenario.name,
    ebitda: calculateEbitda(scenario),
    probability: scenario.probability,
    fill: scenario.id === 'pessimistic' ? '#dc2626' : 
          scenario.id === 'optimistic' ? '#16a34a' : '#005E8A'
  }));

  const handleBarClick = (data: any, index: number) => {
    const scenario = scenarios[index];
    setDialogScenario(scenario);
    setShowDialog(true);
  };

  const handleScenarioUpdate = (updatedScenario: CustomScenario) => {
    setScenarios(prev => 
      prev.map(s => s.id === updatedScenario.id ? updatedScenario : s)
    );
  };

  const addNewScenario = () => {
    if (scenarios.length >= 6) return;
    
    const newScenario: CustomScenario = {
      id: `custom-${Date.now()}`,
      name: `Escenario ${scenarios.length + 1}`,
      note: '',
      salesDelta: 0,
      costsDelta: 0,
      priceDelta: 0,
      probability: 0
    };
    
    setScenarios(prev => [...prev, newScenario]);
  };

  return (
    <div className={className}>
      <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              Escenarios de Análisis
            </CardTitle>
            {scenarios.length < 6 && (
              <Button 
                onClick={addNewScenario}
                size="sm"
                variant="outline"
                className="gap-2"
                aria-label="Añadir nuevo escenario"
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedScenario === scenario.id}
                onSelect={() => setSelectedScenario(scenario.id)}
                onUpdate={handleScenarioUpdate}
              />
            ))}
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="scenario" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  label={{ value: 'EBITDA (K€)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid rgba(0, 94, 138, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)'
                  }}
                  formatter={(value: number, name: string) => [
                    `€${value.toFixed(0)}K`,
                    'EBITDA'
                  ]}
                  labelFormatter={(label: string) => `Escenario ${label}`}
                />
                <Bar 
                  dataKey="ebitda" 
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Métricas del Escenario: {dialogScenario?.name}
            </DialogTitle>
          </DialogHeader>
          {dialogScenario && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">EBITDA:</span>
                  <p className="font-semibold text-lg">€{calculateEbitda(dialogScenario).toFixed(0)}K</p>
                </div>
                <div>
                  <span className="text-slate-600">Probabilidad:</span>
                  <p className="font-semibold text-lg">{dialogScenario.probability}%</p>
                </div>
                <div>
                  <span className="text-slate-600">Ventas Δ:</span>
                  <p className="font-semibold">{dialogScenario.salesDelta > 0 ? '+' : ''}{dialogScenario.salesDelta}%</p>
                </div>
                <div>
                  <span className="text-slate-600">Costes Δ:</span>
                  <p className="font-semibold">{dialogScenario.costsDelta > 0 ? '+' : ''}{dialogScenario.costsDelta}%</p>
                </div>
                <div>
                  <span className="text-slate-600">Precios Δ:</span>
                  <p className="font-semibold">{dialogScenario.priceDelta > 0 ? '+' : ''}{dialogScenario.priceDelta}%</p>
                </div>
                <div>
                  <span className="text-slate-600">Margen:</span>
                  <p className="font-semibold">{(() => {
                    const revenue = baseRevenueK && baseRevenueK > 0 ? baseRevenueK : 2500;
                    return ((calculateEbitda(dialogScenario) / revenue) * 100).toFixed(1);
                  })()}%</p>
                </div>
              </div>
              {dialogScenario.note && (
                <div>
                  <span className="text-slate-600 text-sm">Descripción:</span>
                  <p className="text-sm text-slate-700 mt-1">{dialogScenario.note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};