import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, TrendingUp, ArrowDownToLine, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const dataPyG = [
  { concepto: 'Ingresos', valor: 2500000 },
  { concepto: 'Coste de Ventas', valor: -1500000 },
  { concepto: 'Margen Bruto', valor: 1000000 },
  { concepto: 'Gastos Operativos', valor: -550000 },
  { concepto: 'EBITDA', valor: 450000 },
  { concepto: 'Amortización', valor: -150000 },
  { concepto: 'EBIT', valor: 300000 },
  { concepto: 'Gastos Financieros', valor: -40000 },
  { concepto: 'BAI', valor: 260000 },
  { concepto: 'Impuestos', valor: -65000 },
  { concepto: 'Beneficio Neto', valor: 195000 },
];

const dataBalance = [
  { grupo: 'Activo', concepto: 'Inmovilizado', valor: 1200000 },
  { grupo: 'Activo', concepto: 'Existencias', valor: 350000 },
  { grupo: 'Activo', concepto: 'Clientes', valor: 450000 },
  { grupo: 'Activo', concepto: 'Tesorería', valor: 125000 },
  { grupo: 'Pasivo', concepto: 'Patrimonio Neto', valor: 800000 },
  { grupo: 'Pasivo', concepto: 'Deuda L/P', valor: 750000 },
  { grupo: 'Pasivo', concepto: 'Deuda C/P', valor: 200000 },
  { grupo: 'Pasivo', concepto: 'Proveedores', valor: 375000 },
];

const dataRatios = [
  { name: 'ROE', value: 24.4, target: 20 },
  { name: 'ROA', value: 9.2, target: 8 },
  { name: 'Margen EBITDA', value: 18, target: 15 },
  { name: 'Liquidez', value: 1.5, target: 1.2 },
  { name: 'Solvencia', value: 1.4, target: 1.5 },
  { name: 'Endeudamiento', value: 0.95, target: 0.8 },
];

const dataNOF = [
  { mes: 'Ene', clientes: 420, existencias: 340, proveedores: -370, nof: 390 },
  { mes: 'Feb', clientes: 430, existencias: 345, proveedores: -375, nof: 400 },
  { mes: 'Mar', clientes: 440, existencias: 350, proveedores: -380, nof: 410 },
  { mes: 'Abr', clientes: 450, existencias: 355, proveedores: -385, nof: 420 },
  { mes: 'May', clientes: 460, existencias: 360, proveedores: -390, nof: 430 },
  { mes: 'Jun', clientes: 470, existencias: 365, proveedores: -395, nof: 440 },
];

// Formato para valores monetarios
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const FinancialAnalysisModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('2024');

  const periodOptions = [
    { value: '2024', label: '2024 (Actual)' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: 'q4-2024', label: 'Q4 2024' },
    { value: 'q3-2024', label: 'Q3 2024' },
    { value: 'monthly', label: 'Vista Mensual' },
  ];

  return (
    <div className="flex flex-col max-w-[960px] flex-1 mx-auto bg-gradient-to-br from-dashboard-green-50 to-dashboard-orange-50 min-h-screen">
      <div className="flex flex-wrap justify-between gap-3 p-6">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-dashboard-green-600 tracking-light text-[32px] font-bold leading-tight">Análisis de la Situación Financiera Actual</p>
          <p className="text-dashboard-green-500 text-sm font-normal leading-normal">Estado financiero detallado del período seleccionado</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-dashboard-green-500" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48 border-dashboard-green-200 bg-white">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="pyg" className="w-full px-6">
        <TabsList className="grid w-full grid-cols-5 bg-dashboard-green-100 rounded-xl p-1">
          <TabsTrigger value="pyg" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">P&G</TabsTrigger>
          <TabsTrigger value="balance" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Balance</TabsTrigger>
          <TabsTrigger value="flujos" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Flujos de Caja</TabsTrigger>
          <TabsTrigger value="ratios" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Ratios</TabsTrigger>
          <TabsTrigger value="nof" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">NOF</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pyg" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4 text-dashboard-green-600">Cuenta de Pérdidas y Ganancias</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {dataPyG.map((item, index) => (
                        <tr key={index} className={`border-b border-dashboard-green-100 ${item.concepto === 'Margen Bruto' || item.concepto === 'EBITDA' || item.concepto === 'EBIT' || item.concepto === 'BAI' || item.concepto === 'Beneficio Neto' ? 'font-semibold bg-dashboard-green-50' : ''}`}>
                          <td className="p-3 text-dashboard-green-700">{item.concepto}</td>
                          <td className="text-right p-3 font-mono text-dashboard-green-600">{formatCurrency(item.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4 text-dashboard-green-600">Modelo Analítico</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataPyG.filter(item => ['Margen Bruto', 'EBITDA', 'EBIT', 'Beneficio Neto'].includes(item.concepto))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                      <XAxis dataKey="concepto" stroke="#4A7C59" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value / 1000}K`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), 'Valor']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #B5D5C5',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="valor" fill="url(#greenGradient)" name="Valor" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9DC88D" />
                          <stop offset="100%" stopColor="#B5D5C5" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="balance" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Balance de Situación</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="font-bold bg-[#f0f3f4]">
                        <td className="p-2">Activo</td>
                        <td className="text-right p-2">
                          {formatCurrency(dataBalance
                            .filter(item => item.grupo === 'Activo')
                            .reduce((sum, item) => sum + item.valor, 0)
                          )}
                        </td>
                      </tr>
                      {dataBalance
                        .filter(item => item.grupo === 'Activo')
                        .map((item, index) => (
                          <tr key={index} className="border-b border-[#dce1e5]">
                            <td className="pl-6 p-2">{item.concepto}</td>
                            <td className="text-right p-2">{formatCurrency(item.valor)}</td>
                          </tr>
                        ))
                      }
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Pasivo</td>
                        <td className="text-right p-2">
                          {formatCurrency(dataBalance
                            .filter(item => item.grupo === 'Pasivo')
                            .reduce((sum, item) => sum + item.valor, 0)
                          )}
                        </td>
                      </tr>
                      {dataBalance
                        .filter(item => item.grupo === 'Pasivo')
                        .map((item, index) => (
                          <tr key={index} className="border-b border-[#dce1e5]">
                            <td className="pl-6 p-2">{item.concepto}</td>
                            <td className="text-right p-2">{formatCurrency(item.valor)}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Estructura del Balance</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        {name: 'Estructura', 
                         activo_fijo: dataBalance.find(item => item.concepto === 'Inmovilizado')?.valor || 0,
                         activo_circulante: dataBalance
                           .filter(item => ['Existencias', 'Clientes', 'Tesorería'].includes(item.concepto))
                           .reduce((sum, item) => sum + item.valor, 0),
                         patrimonio: dataBalance.find(item => item.concepto === 'Patrimonio Neto')?.valor || 0,
                         pasivo_lp: dataBalance.find(item => item.concepto === 'Deuda L/P')?.valor || 0,
                         pasivo_cp: dataBalance
                           .filter(item => ['Deuda C/P', 'Proveedores'].includes(item.concepto))
                           .reduce((sum, item) => sum + item.valor, 0)
                        }
                      ]} 
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#637988" />
                      <YAxis type="category" dataKey="name" stroke="#637988" />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value))]} />
                      <Legend />
                      <Bar dataKey="activo_fijo" name="Activo Fijo" fill="#B5D5C5" stackId="activo" />
                      <Bar dataKey="activo_circulante" name="Activo Circulante" fill="#EEE9DA" stackId="activo" />
                      <Bar dataKey="patrimonio" name="Patrimonio Neto" fill="#F8CBA6" stackId="pasivo" />
                      <Bar dataKey="pasivo_lp" name="Pasivo L/P" fill="#A5D7E8" stackId="pasivo" />
                      <Bar dataKey="pasivo_cp" name="Pasivo C/P" fill="#D2E0FB" stackId="pasivo" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="flujos" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Estado de Flujos de Efectivo</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="font-bold bg-[#f0f3f4]">
                        <td className="p-2">Flujo de Operaciones</td>
                        <td className="text-right p-2">{formatCurrency(350000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">EBITDA</td>
                        <td className="text-right p-2">{formatCurrency(450000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Variación NOF</td>
                        <td className="text-right p-2">{formatCurrency(-35000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Impuestos</td>
                        <td className="text-right p-2">{formatCurrency(-65000)}</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Flujo de Inversión</td>
                        <td className="text-right p-2">{formatCurrency(-220000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">CAPEX</td>
                        <td className="text-right p-2">{formatCurrency(-220000)}</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Flujo de Financiación</td>
                        <td className="text-right p-2">{formatCurrency(-90000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Amortización Deuda</td>
                        <td className="text-right p-2">{formatCurrency(-50000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Intereses</td>
                        <td className="text-right p-2">{formatCurrency(-40000)}</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Free Cash Flow</td>
                        <td className="text-right p-2">{formatCurrency(40000)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Análisis del Flujo de Caja</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { name: 'Flujo de Caja', 
                          operaciones: 350000, 
                          inversion: -220000, 
                          financiacion: -90000, 
                          fcf: 40000 
                        }
                      ]} 
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#637988" />
                      <YAxis type="category" dataKey="name" stroke="#637988" />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value))]} />
                      <Legend />
                      <Bar dataKey="operaciones" name="Operaciones" fill="#B5D5C5" stackId="flujos" />
                      <Bar dataKey="inversion" name="Inversión" fill="#F8CBA6" stackId="flujos" />
                      <Bar dataKey="financiacion" name="Financiación" fill="#A5D7E8" stackId="flujos" />
                      <Bar dataKey="fcf" name="Free Cash Flow" fill="#EEE9DA" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ratios" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Rentabilidad</h3>
                <div className="space-y-4 mt-4">
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">ROE</p>
                      <p className="text-sm text-[#111518] font-medium">24.4%</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#B5D5C5] h-2.5 rounded-full" style={{ width: '122%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#078838]">122% del objetivo</p>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">ROA</p>
                      <p className="text-sm text-[#111518] font-medium">9.2%</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#B5D5C5] h-2.5 rounded-full" style={{ width: '115%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#078838]">115% del objetivo</p>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">Margen EBITDA</p>
                      <p className="text-sm text-[#111518] font-medium">18%</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#B5D5C5] h-2.5 rounded-full" style={{ width: '120%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#078838]">120% del objetivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Liquidez</h3>
                <div className="space-y-4 mt-4">
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">Liquidez General</p>
                      <p className="text-sm text-[#111518] font-medium">1.5x</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#B5D5C5] h-2.5 rounded-full" style={{ width: '125%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#078838]">125% del objetivo</p>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">Prueba Ácida</p>
                      <p className="text-sm text-[#111518] font-medium">1.0x</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#B5D5C5] h-2.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#637988]">100% del objetivo</p>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">Tesorería</p>
                      <p className="text-sm text-[#111518] font-medium">0.22x</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#F8CBA6] h-2.5 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#e73508]">88% del objetivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Endeudamiento</h3>
                <div className="space-y-4 mt-4">
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">Solvencia</p>
                      <p className="text-sm text-[#111518] font-medium">1.4x</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#F8CBA6] h-2.5 rounded-full" style={{ width: '93%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#e73508]">93% del objetivo</p>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">Deuda/EBITDA</p>
                      <p className="text-sm text-[#111518] font-medium">2.1x</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#F8CBA6] h-2.5 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#e73508]">95% del objetivo</p>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-[#111518] font-medium">Cobertura Intereses</p>
                      <p className="text-sm text-[#111518] font-medium">7.5x</p>
                    </div>
                    <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                      <div className="bg-[#B5D5C5] h-2.5 rounded-full" style={{ width: '150%' }}></div>
                    </div>
                    <p className="mt-1 text-xs text-[#078838]">150% del objetivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="nof" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Necesidades Operativas de Financiación</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="text-left p-2">Componente</th>
                        <th className="text-right p-2">Valor</th>
                        <th className="text-right p-2">Días</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Clientes</td>
                        <td className="text-right p-2">{formatCurrency(450000)}</td>
                        <td className="text-right p-2">65</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Existencias</td>
                        <td className="text-right p-2">{formatCurrency(350000)}</td>
                        <td className="text-right p-2">85</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Proveedores</td>
                        <td className="text-right p-2">{formatCurrency(-375000)}</td>
                        <td className="text-right p-2">90</td>
                      </tr>
                      <tr className="font-bold bg-[#f0f3f4]">
                        <td className="p-2">NOF Total</td>
                        <td className="text-right p-2">{formatCurrency(425000)}</td>
                        <td className="text-right p-2"></td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Tesorería</td>
                        <td className="text-right p-2">{formatCurrency(125000)}</td>
                        <td className="text-right p-2"></td>
                      </tr>
                      <tr className="font-bold">
                        <td className="p-2">Necesidades Financieras</td>
                        <td className="text-right p-2">{formatCurrency(300000)}</td>
                        <td className="text-right p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Evolución NOF</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataNOF}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#637988" />
                      <YAxis stroke="#637988" />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value))]}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="clientes" name="Clientes" stroke="#B5D5C5" strokeWidth={2} />
                      <Line type="monotone" dataKey="existencias" name="Existencias" stroke="#EEE9DA" strokeWidth={2} />
                      <Line type="monotone" dataKey="proveedores" name="Proveedores" stroke="#F8CBA6" strokeWidth={2} />
                      <Line type="monotone" dataKey="nof" name="NOF Total" stroke="#A5D7E8" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-4 p-6 mt-6">
        <Button variant="outline" className="gap-2 border-dashboard-green-200 text-dashboard-green-600 hover:bg-dashboard-green-50">
          <FileText className="h-4 w-4" /> Ver Informe Completo
        </Button>
        <Button variant="outline" className="gap-2 border-dashboard-green-200 text-dashboard-green-600 hover:bg-dashboard-green-50">
          <ArrowDownToLine className="h-4 w-4" /> Exportar Datos
        </Button>
        <Button className="bg-gradient-to-r from-dashboard-green-300 to-dashboard-green-400 hover:from-dashboard-green-400 hover:to-dashboard-green-500 text-dashboard-green-700 gap-2 shadow-lg">
          <Download className="h-4 w-4" /> Descargar PDF
        </Button>
      </div>
    </div>
  );
};
