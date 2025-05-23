
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Download, FileText, BarChart as BarChartIcon, CirclePlus, CircleMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Formato para valores monetarios
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Datos para escenarios
const escenarios = [
  {
    nombre: "Base",
    ventas: 2500000,
    ebitda: 450000,
    beneficio: 195000,
    cashflow: 40000,
    roe: 24.4,
    deuda: 2.1,
    valor: 3100000,
    probabilidad: 60,
    color: "#B5D5C5"
  },
  {
    nombre: "Optimista",
    ventas: 2750000,
    ebitda: 550000,
    beneficio: 245000,
    cashflow: 85000,
    roe: 30.5,
    deuda: 1.8,
    valor: 3900000,
    probabilidad: 20,
    color: "#A5D7E8"
  },
  {
    nombre: "Pesimista",
    ventas: 2250000,
    ebitda: 360000,
    beneficio: 145000,
    cashflow: 5000,
    roe: 18.2,
    deuda: 2.5,
    valor: 2300000,
    probabilidad: 20,
    color: "#F8CBA6"
  }
];

// Datos para análisis de sensibilidad
const sensibilidadVentas = [
  { delta: "-15%", ebitda: 290000, margen: 15.1, cashflow: -25000, valor: 1900000 },
  { delta: "-10%", ebitda: 350000, margen: 16.3, cashflow: 0, valor: 2300000 },
  { delta: "-5%", ebitda: 400000, margen: 17.2, cashflow: 20000, valor: 2700000 },
  { delta: "Base", ebitda: 450000, margen: 18.0, cashflow: 40000, valor: 3100000 },
  { delta: "+5%", ebitda: 500000, margen: 19.0, cashflow: 65000, valor: 3500000 },
  { delta: "+10%", ebitda: 550000, margen: 20.0, cashflow: 90000, valor: 3900000 },
  { delta: "+15%", ebitda: 600000, margen: 20.9, cashflow: 120000, valor: 4300000 },
];

// Datos para radar de escenarios
const radarData = [
  { subject: 'Ventas', Base: 60, Optimista: 90, Pesimista: 35 },
  { subject: 'Margen', Base: 65, Optimista: 85, Pesimista: 45 },
  { subject: 'Cash Flow', Base: 55, Optimista: 80, Pesimista: 30 },
  { subject: 'ROI', Base: 70, Optimista: 95, Pesimista: 40 },
  { subject: 'Solvencia', Base: 60, Optimista: 75, Pesimista: 50 },
];

export const SensitivityModule = () => {
  return (
    <div className="flex flex-col max-w-[960px] flex-1 mx-auto">
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight">Análisis de Sensibilidad y Escenarios</p>
          <p className="text-[#637988] text-sm font-normal leading-normal">Evaluación de la empresa ante diferentes condiciones de mercado</p>
        </div>
      </div>
      
      <Tabs defaultValue="escenarios" className="w-full px-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="escenarios">Escenarios Principales</TabsTrigger>
          <TabsTrigger value="sensibilidad">Análisis de Sensibilidad</TabsTrigger>
          <TabsTrigger value="simulacion">Simulación Monte Carlo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="escenarios" className="pt-6">
          <div className="grid grid-cols-1 mb-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Comparativa de Escenarios</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="text-left p-2">Indicador</th>
                        <th className="text-right p-2">Base</th>
                        <th className="text-right p-2">Optimista</th>
                        <th className="text-right p-2">Pesimista</th>
                        <th className="text-right p-2">Amplitud</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Ventas</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[0].ventas)}</td>
                        <td className="text-right p-2 text-[#078838]">{formatCurrency(escenarios[1].ventas)}</td>
                        <td className="text-right p-2 text-[#e73508]">{formatCurrency(escenarios[2].ventas)}</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[1].ventas - escenarios[2].ventas)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">EBITDA</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[0].ebitda)}</td>
                        <td className="text-right p-2 text-[#078838]">{formatCurrency(escenarios[1].ebitda)}</td>
                        <td className="text-right p-2 text-[#e73508]">{formatCurrency(escenarios[2].ebitda)}</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[1].ebitda - escenarios[2].ebitda)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Beneficio Neto</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[0].beneficio)}</td>
                        <td className="text-right p-2 text-[#078838]">{formatCurrency(escenarios[1].beneficio)}</td>
                        <td className="text-right p-2 text-[#e73508]">{formatCurrency(escenarios[2].beneficio)}</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[1].beneficio - escenarios[2].beneficio)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Cash Flow</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[0].cashflow)}</td>
                        <td className="text-right p-2 text-[#078838]">{formatCurrency(escenarios[1].cashflow)}</td>
                        <td className="text-right p-2 text-[#e73508]">{formatCurrency(escenarios[2].cashflow)}</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[1].cashflow - escenarios[2].cashflow)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">ROE (%)</td>
                        <td className="text-right p-2">{escenarios[0].roe.toFixed(1)}%</td>
                        <td className="text-right p-2 text-[#078838]">{escenarios[1].roe.toFixed(1)}%</td>
                        <td className="text-right p-2 text-[#e73508]">{escenarios[2].roe.toFixed(1)}%</td>
                        <td className="text-right p-2">{(escenarios[1].roe - escenarios[2].roe).toFixed(1)}%</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Deuda/EBITDA</td>
                        <td className="text-right p-2">{escenarios[0].deuda.toFixed(1)}x</td>
                        <td className="text-right p-2 text-[#078838]">{escenarios[1].deuda.toFixed(1)}x</td>
                        <td className="text-right p-2 text-[#e73508]">{escenarios[2].deuda.toFixed(1)}x</td>
                        <td className="text-right p-2">{(escenarios[1].deuda - escenarios[2].deuda).toFixed(1)}x</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Valoración</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[0].valor)}</td>
                        <td className="text-right p-2 text-[#078838]">{formatCurrency(escenarios[1].valor)}</td>
                        <td className="text-right p-2 text-[#e73508]">{formatCurrency(escenarios[2].valor)}</td>
                        <td className="text-right p-2">{formatCurrency(escenarios[1].valor - escenarios[2].valor)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5] font-medium">
                        <td className="p-2">Probabilidad</td>
                        <td className="text-right p-2">{escenarios[0].probabilidad}%</td>
                        <td className="text-right p-2">{escenarios[1].probabilidad}%</td>
                        <td className="text-right p-2">{escenarios[2].probabilidad}%</td>
                        <td className="text-right p-2">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Distribución de Escenarios</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={escenarios}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="probabilidad"
                        nameKey="nombre"
                      >
                        {escenarios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Probabilidad']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Comparativa de Rendimiento</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={100} data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Base" dataKey="Base" stroke="#B5D5C5" fill="#B5D5C5" fillOpacity={0.6} />
                      <Radar name="Optimista" dataKey="Optimista" stroke="#A5D7E8" fill="#A5D7E8" fillOpacity={0.6} />
                      <Radar name="Pesimista" dataKey="Pesimista" stroke="#F8CBA6" fill="#F8CBA6" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Variables Críticas por Escenario</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <p className="font-semibold">Escenario Base</p>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Crecimiento Ventas</p>
                        <p className="text-sm text-[#111518] font-medium">+12%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Margen Bruto</p>
                        <p className="text-sm text-[#111518] font-medium">40%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Costes Fijos</p>
                        <p className="text-sm text-[#111518] font-medium">+3%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">CAPEX</p>
                        <p className="text-sm text-[#111518] font-medium">{formatCurrency(220000)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="font-semibold text-[#078838]">Escenario Optimista</p>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Crecimiento Ventas</p>
                        <p className="text-sm text-[#078838] font-medium">+18%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Margen Bruto</p>
                        <p className="text-sm text-[#078838] font-medium">42%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Costes Fijos</p>
                        <p className="text-sm text-[#078838] font-medium">+2%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">CAPEX</p>
                        <p className="text-sm text-[#078838] font-medium">{formatCurrency(250000)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="font-semibold text-[#e73508]">Escenario Pesimista</p>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Crecimiento Ventas</p>
                        <p className="text-sm text-[#e73508] font-medium">+5%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Margen Bruto</p>
                        <p className="text-sm text-[#e73508] font-medium">38%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">Costes Fijos</p>
                        <p className="text-sm text-[#e73508] font-medium">+5%</p>
                      </div>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">CAPEX</p>
                        <p className="text-sm text-[#e73508] font-medium">{formatCurrency(180000)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sensibilidad" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Análisis de Sensibilidad - Ventas</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={sensibilidadVentas}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="delta" stroke="#637988" />
                      <YAxis yAxisId="left" orientation="left" stroke="#B5D5C5" />
                      <YAxis yAxisId="right" orientation="right" stroke="#F8CBA6" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "ebitda") return [formatCurrency(Number(value)), "EBITDA"];
                          if (name === "cashflow") return [formatCurrency(Number(value)), "Cash Flow"];
                          return [value, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="ebitda" name="EBITDA" stroke="#B5D5C5" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="cashflow" name="Cash Flow" stroke="#F8CBA6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Elasticidad EBITDA/Ventas</p>
                    <p className="text-xl font-bold">1.35x</p>
                    <p className="text-xs text-[#637988] mt-1">Por cada 1% de cambio en ventas, EBITDA cambia 1.35%</p>
                  </div>
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Punto de equilibrio</p>
                    <p className="text-xl font-bold">{formatCurrency(1800000)}</p>
                    <p className="text-xs text-[#637988] mt-1">Nivel de ventas para alcanzar break-even</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Impacto en Valoración</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sensibilidadVentas}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="delta" stroke="#637988" />
                      <YAxis stroke="#637988" />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), "Valoración"]}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="valor" fill="#A5D7E8" name="Valoración" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Múltiplo valor/EBITDA</p>
                    <p className="text-xl font-bold">7.0x</p>
                    <p className="text-xs text-[#637988] mt-1">Múltiplo medio utilizado en la valoración</p>
                  </div>
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Variación máxima</p>
                    <p className="text-xl font-bold">+/- 38%</p>
                    <p className="text-xs text-[#637988] mt-1">Diferencia entre extremos de valoración</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Tabla de Sensibilidad Cruzada</h3>
                <div className="flex justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Variable X:</p>
                    <Select defaultValue="ventas">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ventas">% Crecimiento Ventas</SelectItem>
                        <SelectItem value="margen">% Margen Bruto</SelectItem>
                        <SelectItem value="costes">% Costes Fijos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Variable Y:</p>
                    <Select defaultValue="margen">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="margen">% Margen Bruto</SelectItem>
                        <SelectItem value="ventas">% Crecimiento Ventas</SelectItem>
                        <SelectItem value="costes">% Costes Fijos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="p-2 border-r border-[#dce1e5]">EBITDA (€)</th>
                        <th className="p-2 text-center" colSpan={5}>% Crecimiento Ventas</th>
                      </tr>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="p-2 border-r border-[#dce1e5]">% Margen</th>
                        <th className="p-2 text-center">-5%</th>
                        <th className="p-2 text-center">0%</th>
                        <th className="p-2 text-center">+5%</th>
                        <th className="p-2 text-center">+10%</th>
                        <th className="p-2 text-center">+15%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2 font-medium border-r border-[#dce1e5]">35%</td>
                        <td className="p-2 text-center bg-[#FDE68A]">{formatCurrency(315000)}</td>
                        <td className="p-2 text-center bg-[#FEF3C7]">{formatCurrency(332000)}</td>
                        <td className="p-2 text-center bg-[#FEF9E7]">{formatCurrency(348000)}</td>
                        <td className="p-2 text-center bg-[#F0FDF4]">{formatCurrency(365000)}</td>
                        <td className="p-2 text-center bg-[#DCFCE7]">{formatCurrency(382000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2 font-medium border-r border-[#dce1e5]">38%</td>
                        <td className="p-2 text-center bg-[#FEF3C7]">{formatCurrency(380000)}</td>
                        <td className="p-2 text-center bg-[#FEF9E7]">{formatCurrency(400000)}</td>
                        <td className="p-2 text-center bg-[#F0FDF4]">{formatCurrency(420000)}</td>
                        <td className="p-2 text-center bg-[#DCFCE7]">{formatCurrency(440000)}</td>
                        <td className="p-2 text-center bg-[#86EFAC]">{formatCurrency(460000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2 font-medium border-r border-[#dce1e5]">40%</td>
                        <td className="p-2 text-center bg-[#FEF9E7]">{formatCurrency(427500)}</td>
                        <td className="p-2 text-center bg-[#F0FDF4]">{formatCurrency(450000)}</td>
                        <td className="p-2 text-center bg-[#DCFCE7]">{formatCurrency(472500)}</td>
                        <td className="p-2 text-center bg-[#86EFAC]">{formatCurrency(495000)}</td>
                        <td className="p-2 text-center bg-[#4ADE80]">{formatCurrency(517500)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2 font-medium border-r border-[#dce1e5]">42%</td>
                        <td className="p-2 text-center bg-[#F0FDF4]">{formatCurrency(475000)}</td>
                        <td className="p-2 text-center bg-[#DCFCE7]">{formatCurrency(500000)}</td>
                        <td className="p-2 text-center bg-[#86EFAC]">{formatCurrency(525000)}</td>
                        <td className="p-2 text-center bg-[#4ADE80]">{formatCurrency(550000)}</td>
                        <td className="p-2 text-center bg-[#22C55E]">{formatCurrency(575000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2 font-medium border-r border-[#dce1e5]">45%</td>
                        <td className="p-2 text-center bg-[#DCFCE7]">{formatCurrency(522500)}</td>
                        <td className="p-2 text-center bg-[#86EFAC]">{formatCurrency(550000)}</td>
                        <td className="p-2 text-center bg-[#4ADE80]">{formatCurrency(577500)}</td>
                        <td className="p-2 text-center bg-[#22C55E]">{formatCurrency(605000)}</td>
                        <td className="p-2 text-center bg-[#16A34A]">{formatCurrency(632500)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-right mt-4">
                  <p className="text-xs text-[#637988]">Valores expresados en EBITDA proyectado (€)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="simulacion" className="pt-6">
          <div className="grid grid-cols-1 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Simulación Monte Carlo</h3>
                  <Button size="sm" variant="outline">Ejecutar 1000 simulaciones</Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-6">
                    <p className="font-semibold">Parámetros de entrada</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm">Crecimiento Ventas (%)</p>
                        <p className="text-sm font-medium">12%</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CircleMinus className="h-4 w-4 text-[#637988]" />
                        <Slider defaultValue={[12]} max={30} step={1} className="flex-1" />
                        <CirclePlus className="h-4 w-4 text-[#637988]" />
                      </div>
                      <div className="flex justify-between text-xs text-[#637988]">
                        <span>±5%</span>
                        <span>Distribución Normal</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm">Margen Bruto (%)</p>
                        <p className="text-sm font-medium">40%</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CircleMinus className="h-4 w-4 text-[#637988]" />
                        <Slider defaultValue={[40]} max={60} step={1} className="flex-1" />
                        <CirclePlus className="h-4 w-4 text-[#637988]" />
                      </div>
                      <div className="flex justify-between text-xs text-[#637988]">
                        <span>±3%</span>
                        <span>Distribución Normal</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm">Incremento Costes (%)</p>
                        <p className="text-sm font-medium">3%</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CircleMinus className="h-4 w-4 text-[#637988]" />
                        <Slider defaultValue={[3]} max={10} step={0.5} className="flex-1" />
                        <CirclePlus className="h-4 w-4 text-[#637988]" />
                      </div>
                      <div className="flex justify-between text-xs text-[#637988]">
                        <span>±2%</span>
                        <span>Distribución Normal</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm">CAPEX anual</p>
                        <p className="text-sm font-medium">{formatCurrency(220000)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CircleMinus className="h-4 w-4 text-[#637988]" />
                        <Slider defaultValue={[220]} max={500} step={10} className="flex-1" />
                        <CirclePlus className="h-4 w-4 text-[#637988]" />
                      </div>
                      <div className="flex justify-between text-xs text-[#637988]">
                        <span>±15%</span>
                        <span>Distribución Uniforme</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="h-[380px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { valor: "<2.0M€", frecuencia: 5 },
                            { valor: "2.0-2.5M€", frecuencia: 18 },
                            { valor: "2.5-3.0M€", frecuencia: 35 },
                            { valor: "3.0-3.5M€", frecuencia: 58 },
                            { valor: "3.5-4.0M€", frecuencia: 42 },
                            { valor: "4.0-4.5M€", frecuencia: 30 },
                            { valor: ">4.5M€", frecuencia: 12 },
                          ]}
                          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="valor" stroke="#637988" />
                          <YAxis stroke="#637988" />
                          <Tooltip 
                            formatter={(value) => [`${value} simulaciones`, "Frecuencia"]}
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="frecuencia" fill="#A5D7E8" name="Distribución de valoraciones" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <p className="text-sm font-medium">Valor Medio</p>
                    <p className="text-xl font-bold">{formatCurrency(3250000)}</p>
                  </div>
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <p className="text-sm font-medium">Percentil 10%</p>
                    <p className="text-xl font-bold">{formatCurrency(2400000)}</p>
                  </div>
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <p className="text-sm font-medium">Percentil 90%</p>
                    <p className="text-xl font-bold">{formatCurrency(4100000)}</p>
                  </div>
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <p className="text-sm font-medium">Desviación</p>
                    <p className="text-xl font-bold">±27%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-4 p-4 mt-6">
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" /> Metodología
        </Button>
        <Button variant="outline" className="gap-2">
          <BarChartIcon className="h-4 w-4" /> Más Análisis
        </Button>
        <Button className="bg-[#B5D5C5] hover:bg-[#B5D5C5]/80 text-black gap-2">
          <Download className="h-4 w-4" /> Exportar Escenarios
        </Button>
      </div>
    </div>
  );
};
