
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, AlertTriangle, XCircle, Download, Save, CheckSquare } from 'lucide-react';

export const KeyFinancialAssumptionsModule = () => {
  const [activeSection, setActiveSection] = useState<'ingresos' | 'costes' | 'capital' | 'capex' | 'fiscal'>('ingresos');
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sample data for revenue growth by month
  const growthByMonth = [
    { mes: 'Ene', crecimiento: 12 },
    { mes: 'Feb', crecimiento: 14 },
    { mes: 'Mar', crecimiento: 10 },
    { mes: 'Abr', crecimiento: 8 },
    { mes: 'May', crecimiento: 15 },
    { mes: 'Jun', crecimiento: 11 },
    { mes: 'Jul', crecimiento: 13 },
    { mes: 'Ago', crecimiento: 7 },
    { mes: 'Sep', crecimiento: 9 },
    { mes: 'Oct', crecimiento: 11 },
    { mes: 'Nov', crecimiento: 14 },
    { mes: 'Dic', crecimiento: 16 },
  ];

  // Sample data for product lines
  const productLines = [
    { producto: 'Producto A', volumen: 1200, precio: 120, crecimiento: 15, elasticidad: 0.8 },
    { producto: 'Producto B', volumen: 850, precio: 180, crecimiento: 10, elasticidad: 1.2 },
    { producto: 'Producto C', volumen: 2000, precio: 75, crecimiento: 5, elasticidad: 0.5 },
    { producto: 'Servicio X', volumen: 300, precio: 450, crecimiento: 25, elasticidad: 1.5 },
  ];

  // Sample data for cash flow projection
  const cashFlowData = [
    { mes: 'Ene', generacion: 58, consumo: -35 },
    { mes: 'Feb', generacion: 60, consumo: -42 },
    { mes: 'Mar', generacion: 58, consumo: -38 },
    { mes: 'Abr', generacion: 45, consumo: -45 },
    { mes: 'May', generacion: 62, consumo: -40 },
    { mes: 'Jun', generacion: 55, consumo: -48 },
    { mes: 'Jul', generacion: 59, consumo: -40 },
  ];
  
  // Sample data for sales mix
  const salesMixData = [
    { name: 'Producto A', value: 35 },
    { name: 'Producto B', value: 25 },
    { name: 'Producto C', value: 25 },
    { name: 'Servicio X', value: 15 },
  ];
  
  const COLORS = ['#B5D5C5', '#EEE9DA', '#F8CBA6', '#A5D7E8'];
  
  // Sample data for cost structure
  const costStructureData = [
    { categoria: 'Mat. Prima', porcentaje: 35, tendencia: 2, tipo: 'Variable' },
    { categoria: 'Personal', porcentaje: 25, tendencia: 0, tipo: 'Fijo' },
    { categoria: 'Comisiones', porcentaje: 5, tendencia: 0, tipo: 'Variable' },
    { categoria: 'Alquiler', porcentaje: 8, tendencia: 1, tipo: 'Fijo' },
    { categoria: 'Marketing', porcentaje: 10, tendencia: -1, tipo: 'Mixto' },
    { categoria: 'Logística', porcentaje: 7, tendencia: 2, tipo: 'Variable' },
    { categoria: 'IT', porcentaje: 5, tendencia: 0, tipo: 'Fijo' },
    { categoria: 'Otros', porcentaje: 5, tendencia: 0, tipo: 'Mixto' },
  ];
  
  // Sample data for CAPEX projects
  const capexProjects = [
    { proyecto: 'Ampliación planta', inversion: 250000, TIR: 18, payback: 3.2, estado: 'En Curso' },
    { proyecto: 'Software ERP', inversion: 75000, TIR: 22, payback: 2.1, estado: 'Evaluación' },
    { proyecto: 'Renovación equipos', inversion: 120000, TIR: 15, payback: 4.0, estado: 'Aprobado' },
    { proyecto: 'Vehículos eco', inversion: 60000, TIR: 12, payback: 5.2, estado: 'En Curso' },
    { proyecto: 'I+D producto nuevo', inversion: 180000, TIR: 25, payback: 2.5, estado: 'Idea' },
  ];

  const getColorForState = (estado: string) => {
    switch (estado) {
      case 'Idea': return 'bg-gray-100';
      case 'Evaluación': return 'bg-yellow-100';
      case 'Aprobado': return 'bg-blue-100';
      case 'En Curso': return 'bg-green-100';
      case 'Completado': return 'bg-purple-100';
      default: return 'bg-gray-100';
    }
  };

  const getColorForTrend = (trend: number) => {
    if (trend > 0) return 'text-[#e73508]';
    if (trend < 0) return 'text-[#078838]';
    return 'text-[#637988]';
  };

  return (
    <div className="flex flex-col max-w-[960px] flex-1 mx-auto">
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight">Supuestos Financieros Clave</p>
          <p className="text-[#637988] text-sm font-normal leading-normal">Centro de control para la planificación estratégica</p>
        </div>
      </div>
      
      <div className="flex flex-wrap pb-3 border-b border-[#dce1e5] px-4">
        <button
          onClick={() => setActiveSection('ingresos')}
          className={`flex flex-col items-center justify-center pb-[13px] pt-4 px-8 ${
            activeSection === 'ingresos' 
              ? 'border-b-[3px] border-b-[#111518] text-[#111518]' 
              : 'border-b-[3px] border-b-transparent text-[#637988]'
          }`}
        >
          <p className="text-sm font-bold leading-normal tracking-[0.015em]">Premisas de Ingresos</p>
        </button>
        <button
          onClick={() => setActiveSection('costes')}
          className={`flex flex-col items-center justify-center pb-[13px] pt-4 px-8 ${
            activeSection === 'costes' 
              ? 'border-b-[3px] border-b-[#111518] text-[#111518]' 
              : 'border-b-[3px] border-b-transparent text-[#637988]'
          }`}
        >
          <p className="text-sm font-bold leading-normal tracking-[0.015em]">Estructura de Costes</p>
        </button>
        <button
          onClick={() => setActiveSection('capital')}
          className={`flex flex-col items-center justify-center pb-[13px] pt-4 px-8 ${
            activeSection === 'capital' 
              ? 'border-b-[3px] border-b-[#111518] text-[#111518]' 
              : 'border-b-[3px] border-b-transparent text-[#637988]'
          }`}
        >
          <p className="text-sm font-bold leading-normal tracking-[0.015em]">Capital de Trabajo</p>
        </button>
        <button
          onClick={() => setActiveSection('capex')}
          className={`flex flex-col items-center justify-center pb-[13px] pt-4 px-8 ${
            activeSection === 'capex' 
              ? 'border-b-[3px] border-b-[#111518] text-[#111518]' 
              : 'border-b-[3px] border-b-transparent text-[#637988]'
          }`}
        >
          <p className="text-sm font-bold leading-normal tracking-[0.015em]">Plan de Inversiones</p>
        </button>
        <button
          onClick={() => setActiveSection('fiscal')}
          className={`flex flex-col items-center justify-center pb-[13px] pt-4 px-8 ${
            activeSection === 'fiscal' 
              ? 'border-b-[3px] border-b-[#111518] text-[#111518]' 
              : 'border-b-[3px] border-b-transparent text-[#637988]'
          }`}
        >
          <p className="text-sm font-bold leading-normal tracking-[0.015em]">Fiscal y Otros</p>
        </button>
      </div>
      
      {activeSection === 'ingresos' && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-blue bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Crecimiento Base Anual</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">12%</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-[#637988]">0%</span>
                <Slider defaultValue={[12]} max={30} step={1} className="flex-1" />
                <span className="text-sm text-[#637988]">30%</span>
              </div>
            </div>
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-green bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Inflación Esperada</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">3.5%</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-[#637988]">0%</span>
                <Slider defaultValue={[3.5]} max={10} step={0.5} className="flex-1" />
                <span className="text-sm text-[#637988]">10%</span>
              </div>
            </div>
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-yellow bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Probabilidad Consecución</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">85%</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-[#637988]">0%</span>
                <Slider defaultValue={[85]} max={100} step={5} className="flex-1" />
                <span className="text-sm text-[#637988]">100%</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">Estacionalidad Mensual</h2>
          <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6 mb-6">
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={growthByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#637988" />
                  <YAxis stroke="#637988" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value}%`, 'Crecimiento']}
                  />
                  <Bar dataKey="crecimiento" fill="#B5D5C5" name="% Crecimiento" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-6 gap-4 mt-4">
              <div className="col-span-6 md:col-span-2 bg-pastel-blue bg-opacity-10 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Crecimiento Promedio</p>
                <p className="text-xl font-bold text-[#111518]">11.67%</p>
              </div>
              <div className="col-span-6 md:col-span-2 bg-pastel-green bg-opacity-10 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Mejor Mes</p>
                <p className="text-xl font-bold text-[#111518]">Dic: 16%</p>
              </div>
              <div className="col-span-6 md:col-span-2 bg-pastel-yellow bg-opacity-10 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-1">Peor Mes</p>
                <p className="text-xl font-bold text-[#111518]">Ago: 7%</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Líneas de Negocio</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mt-4">
                  <thead>
                    <tr className="border-b border-[#dce1e5]">
                      <th className="text-left p-2">Producto</th>
                      <th className="text-right p-2">Volumen</th>
                      <th className="text-right p-2">Precio</th>
                      <th className="text-right p-2">% Crec.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productLines.map((product, index) => (
                      <tr key={index} className="border-b border-[#dce1e5]">
                        <td className="p-2">{product.producto}</td>
                        <td className="text-right p-2">{product.volumen.toLocaleString()}</td>
                        <td className="text-right p-2">{formatCurrency(product.precio)}</td>
                        <td className="text-right p-2">{product.crecimiento}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center mt-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={salesMixData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {salesMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Generación vs Consumo de Caja</p>
              <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight truncate">€125K</p>
              <p className="text-[#637988] text-base font-normal leading-normal">Saldo Actual</p>
              <div className="min-h-[220px] mt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" stroke="#637988" />
                    <YAxis stroke="#637988" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                      formatter={(value) => [`${Math.abs(Number(value))}K €`, Number(value) >= 0 ? 'Generación' : 'Consumo']}
                    />
                    <Legend />
                    <Bar dataKey="generacion" fill="#B5D5C5" name="Generación" />
                    <Bar dataKey="consumo" fill="#F8CBA6" name="Consumo" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeSection === 'costes' && (
        <div className="p-4">
          <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">Estructura de Costes Operativos</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-blue bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Costes Fijos</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">38%</p>
              <p className="text-[#637988] text-base font-normal leading-normal">del total</p>
            </div>
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-green bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Costes Variables</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">47%</p>
              <p className="text-[#637988] text-base font-normal leading-normal">del total</p>
            </div>
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-yellow bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Costes Mixtos</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">15%</p>
              <p className="text-[#637988] text-base font-normal leading-normal">del total</p>
            </div>
          </div>

          <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6 mb-6">
            <p className="text-[#111518] text-base font-medium leading-normal">Clasificador de Costes</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="border-b border-[#dce1e5]">
                    <th className="text-left p-2">Categoría</th>
                    <th className="text-right p-2">% sobre ventas</th>
                    <th className="text-center p-2">Tendencia</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-center p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {costStructureData.map((cost, index) => (
                    <tr key={index} className="border-b border-[#dce1e5]">
                      <td className="p-2">{cost.categoria}</td>
                      <td className="text-right p-2">{cost.porcentaje}%</td>
                      <td className={`text-center p-2 ${getColorForTrend(cost.tendencia)}`}>
                        {cost.tendencia > 0 && '↑'}{cost.tendencia < 0 && '↓'}{cost.tendencia === 0 && '→'}
                        {Math.abs(cost.tendencia)}%
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cost.tipo === 'Variable' ? 'bg-pastel-green bg-opacity-30 text-green-800' :
                          cost.tipo === 'Fijo' ? 'bg-pastel-blue bg-opacity-30 text-blue-800' :
                          'bg-pastel-yellow bg-opacity-30 text-yellow-800'
                        }`}>
                          {cost.tipo}
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <button className="px-3 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200 text-gray-700">
                          {cost.tendencia > 0 ? 'Negociar' : 'Mantener'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Simulador de Productividad</p>
              <div className="space-y-4 mt-4">
                <div className="bg-pastel-blue bg-opacity-10 p-4 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-blue-800 font-medium">Ventas por empleado</p>
                    <p className="text-sm text-blue-800 font-medium">{formatCurrency(180000)}</p>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <p className="mt-1 text-xs text-blue-600">70% del objetivo</p>
                </div>
                
                <div className="bg-pastel-green bg-opacity-10 p-4 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-green-800 font-medium">Coste por unidad</p>
                    <p className="text-sm text-green-800 font-medium">{formatCurrency(85)}</p>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '55%' }}></div>
                  </div>
                  <p className="mt-1 text-xs text-green-600">55% del objetivo</p>
                </div>
                
                <div className="bg-pastel-yellow bg-opacity-10 p-4 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-yellow-800 font-medium">Utilización de capacidad</p>
                    <p className="text-sm text-yellow-800 font-medium">78%</p>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2.5">
                    <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <p className="mt-1 text-xs text-yellow-600">78% del objetivo</p>
                </div>
              </div>
            </div>

            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Planificador de Costes Fijos</p>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Alquiler oficinas</p>
                    <p className="text-sm text-gray-500">Incremento anual: 3%</p>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(4500)}/mes</p>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Salarios base</p>
                    <p className="text-sm text-gray-500">Revisión: Junio</p>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(32000)}/mes</p>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Servicios IT</p>
                    <p className="text-sm text-gray-500">Contrato hasta 2025</p>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(1800)}/mes</p>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Seguros</p>
                    <p className="text-sm text-gray-500">Renovación: Marzo</p>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(950)}/mes</p>
                </div>
              </div>
              <Button className="mt-4 w-full bg-gray-100 text-gray-800 hover:bg-gray-200">
                + Añadir coste fijo
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {activeSection === 'capex' && (
        <div className="p-4">
          <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">Plan de Inversiones (CAPEX)</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-blue bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Total Inversiones</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">{formatCurrency(685000)}</p>
              <p className="text-[#637988] text-base font-normal leading-normal">5 proyectos</p>
            </div>
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-green bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">TIR Media</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">18.4%</p>
              <p className="text-[#078838] text-base font-medium leading-normal">+3.4% vs objetivo</p>
            </div>
            <div className="col-span-1 flex min-w-72 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-yellow bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Payback Medio</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">3.4 años</p>
              <p className="text-[#637988] text-base font-normal leading-normal">Objetivo: 4 años</p>
            </div>
          </div>
          
          <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6 mb-6">
            <p className="text-[#111518] text-base font-medium leading-normal">Pipeline de Proyectos</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="border-b border-[#dce1e5]">
                    <th className="text-left p-2">Proyecto</th>
                    <th className="text-right p-2">Inversión</th>
                    <th className="text-right p-2">TIR %</th>
                    <th className="text-right p-2">Payback</th>
                    <th className="text-center p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {capexProjects.map((project, index) => (
                    <tr key={index} className="border-b border-[#dce1e5]">
                      <td className="p-2">{project.proyecto}</td>
                      <td className="text-right p-2">{formatCurrency(project.inversion)}</td>
                      <td className="text-right p-2">{project.TIR}%</td>
                      <td className="text-right p-2">{project.payback} años</td>
                      <td className="text-center p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getColorForState(project.estado)}`}>
                          {project.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Evaluador de Inversiones</p>
              <div className="bg-gray-50 p-5 rounded-lg mt-3">
                <p className="font-medium mb-4">Nueva inversión:</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Nombre del proyecto</label>
                    <input type="text" className="w-full border border-gray-300 rounded p-2" placeholder="Introduzca nombre..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Inversión (€)</label>
                      <input type="text" className="w-full border border-gray-300 rounded p-2" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Vida útil (años)</label>
                      <input type="text" className="w-full border border-gray-300 rounded p-2" placeholder="5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Flujo anual (€)</label>
                      <input type="text" className="w-full border border-gray-300 rounded p-2" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Tasa descuento (%)</label>
                      <input type="text" className="w-full border border-gray-300 rounded p-2" placeholder="8.5" />
                    </div>
                  </div>
                  <Button className="w-full bg-[#111518]">Calcular VAN/TIR</Button>
                </div>
              </div>
            </div>
            
            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Monitor ROI Post-Inversión</p>
              <div className="space-y-4 mt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">Renovación equipos</h4>
                      <div className="flex justify-between text-sm text-green-600 mb-1">
                        <span>ROI proyectado: 15%</span>
                        <span>ROI actual: 17%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '113%' }}></div>
                      </div>
                      <p className="mt-1 text-xs text-green-600">113% del objetivo</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Ampliación planta</h4>
                      <div className="flex justify-between text-sm text-yellow-600 mb-1">
                        <span>ROI proyectado: 18%</span>
                        <span>ROI actual: 15%</span>
                      </div>
                      <div className="w-full bg-yellow-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '83%' }}></div>
                      </div>
                      <p className="mt-1 text-xs text-yellow-600">83% del objetivo</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 mb-1">Software ERP</h4>
                      <div className="flex justify-between text-sm text-red-600 mb-1">
                        <span>ROI proyectado: 22%</span>
                        <span>ROI actual: 8%</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: '36%' }}></div>
                      </div>
                      <p className="mt-1 text-xs text-red-600">36% del objetivo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeSection === 'capital' || activeSection === 'fiscal') && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-xl font-medium text-gray-700 mb-4">
              {activeSection === 'capital' ? 'Módulo de Capital de Trabajo en desarrollo' : 'Módulo Fiscal y Otros Supuestos en desarrollo'}
            </p>
            <p className="text-gray-500 mb-6">Esta sección estará disponible próximamente</p>
            <Button onClick={() => setActiveSection('ingresos')}>
              Volver a Premisas de Ingresos
            </Button>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-8 right-8 flex gap-2">
        <Button className="bg-pastel-green hover:bg-pastel-green/80">
          <CheckSquare className="mr-2 h-4 w-4" /> Validar
        </Button>
        <Button className="bg-pastel-blue hover:bg-pastel-blue/80">
          <Save className="mr-2 h-4 w-4" /> Guardar
        </Button>
        <Button className="bg-pastel-yellow hover:bg-pastel-yellow/80">
          <Download className="mr-2 h-4 w-4" /> Exportar
        </Button>
      </div>
    </div>
  );
};
