
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Download, FileText, TrendingUp, BarChart as BarChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Datos de proyección
const dataProyeccion = [
  { año: 'Actual', ventas: 2500, ebitda: 450, beneficio: 195 },
  { año: 'Año 1', ventas: 2800, ebitda: 504, beneficio: 228 },
  { año: 'Año 2', ventas: 3136, ebitda: 565, beneficio: 266 },
  { año: 'Año 3', ventas: 3513, ebitda: 632, beneficio: 312 },
];

const dataNOF = [
  { año: 'Actual', clientes: 450, existencias: 350, proveedores: 375, nof: 425 },
  { año: 'Año 1', clientes: 500, existencias: 380, proveedores: 400, nof: 480 },
  { año: 'Año 2', clientes: 560, existencias: 415, proveedores: 440, nof: 535 },
  { año: 'Año 3', clientes: 630, existencias: 450, proveedores: 480, nof: 600 },
];

const dataRatios = [
  { año: 'Actual', roe: 24.4, roa: 9.2, margen: 18.0, deuda: 2.1 },
  { año: 'Año 1', roe: 25.2, roa: 9.8, margen: 18.5, deuda: 1.9 },
  { año: 'Año 2', roe: 26.0, roa: 10.4, margen: 19.0, deuda: 1.7 },
  { año: 'Año 3', roe: 27.2, roa: 11.0, margen: 19.5, deuda: 1.5 },
];

// Formato para valores monetarios
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value * 1000);
};

export const ProjectionsModule = () => {
  return (
    <div className="flex flex-col max-w-[960px] flex-1 mx-auto">
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight">Proyecciones Financieras</p>
          <p className="text-[#637988] text-sm font-normal leading-normal">Previsión para los próximos 3 años</p>
        </div>
      </div>
      
      <Tabs defaultValue="pyg" className="w-full px-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pyg">P&G Proyectado</TabsTrigger>
          <TabsTrigger value="balance">Balance Proyectado</TabsTrigger>
          <TabsTrigger value="flujos">Cash Flow Proyectado</TabsTrigger>
          <TabsTrigger value="ratios">Ratios Proyectados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pyg" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Evolución de Ventas</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataProyeccion}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#637988" />
                      <YAxis stroke="#637988" />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), 'Ventas']}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="ventas" fill="#B5D5C5" name="Ventas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <p className="text-xs text-[#637988] font-medium">CAGR Ventas</p>
                      <p className="text-xl font-bold text-[#111518]">+12.0%</p>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <p className="text-xs text-[#637988] font-medium">Ventas Año 3</p>
                      <p className="text-xl font-bold text-[#111518]">{formatCurrency(3513)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Evolución de Rentabilidad</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataProyeccion}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#637988" />
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
                      <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="#EEE9DA" strokeWidth={2} />
                      <Line type="monotone" dataKey="beneficio" name="Beneficio Neto" stroke="#F8CBA6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <p className="text-xs text-[#637988] font-medium">CAGR EBITDA</p>
                      <p className="text-xl font-bold text-[#111518]">+12.0%</p>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <p className="text-xs text-[#637988] font-medium">CAGR Beneficio</p>
                      <p className="text-xl font-bold text-[#111518]">+17.0%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="balance" className="pt-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Evolución del Balance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="text-left p-2">Partida</th>
                        <th className="text-right p-2">Actual</th>
                        <th className="text-right p-2">Año 1</th>
                        <th className="text-right p-2">Año 2</th>
                        <th className="text-right p-2">Año 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold bg-[#f0f3f4]">
                        <td className="p-2">Total Activo</td>
                        <td className="text-right p-2">{formatCurrency(2125)}</td>
                        <td className="text-right p-2">{formatCurrency(2380)}</td>
                        <td className="text-right p-2">{formatCurrency(2665)}</td>
                        <td className="text-right p-2">{formatCurrency(2985)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Inmovilizado</td>
                        <td className="text-right p-2">{formatCurrency(1200)}</td>
                        <td className="text-right p-2">{formatCurrency(1320)}</td>
                        <td className="text-right p-2">{formatCurrency(1450)}</td>
                        <td className="text-right p-2">{formatCurrency(1595)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Existencias</td>
                        <td className="text-right p-2">{formatCurrency(350)}</td>
                        <td className="text-right p-2">{formatCurrency(380)}</td>
                        <td className="text-right p-2">{formatCurrency(415)}</td>
                        <td className="text-right p-2">{formatCurrency(450)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Clientes</td>
                        <td className="text-right p-2">{formatCurrency(450)}</td>
                        <td className="text-right p-2">{formatCurrency(500)}</td>
                        <td className="text-right p-2">{formatCurrency(560)}</td>
                        <td className="text-right p-2">{formatCurrency(630)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Tesorería</td>
                        <td className="text-right p-2">{formatCurrency(125)}</td>
                        <td className="text-right p-2">{formatCurrency(180)}</td>
                        <td className="text-right p-2">{formatCurrency(240)}</td>
                        <td className="text-right p-2">{formatCurrency(310)}</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Total Pasivo</td>
                        <td className="text-right p-2">{formatCurrency(2125)}</td>
                        <td className="text-right p-2">{formatCurrency(2380)}</td>
                        <td className="text-right p-2">{formatCurrency(2665)}</td>
                        <td className="text-right p-2">{formatCurrency(2985)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Patrimonio Neto</td>
                        <td className="text-right p-2">{formatCurrency(800)}</td>
                        <td className="text-right p-2">{formatCurrency(1028)}</td>
                        <td className="text-right p-2">{formatCurrency(1294)}</td>
                        <td className="text-right p-2">{formatCurrency(1606)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Deuda L/P</td>
                        <td className="text-right p-2">{formatCurrency(750)}</td>
                        <td className="text-right p-2">{formatCurrency(700)}</td>
                        <td className="text-right p-2">{formatCurrency(650)}</td>
                        <td className="text-right p-2">{formatCurrency(600)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Deuda C/P</td>
                        <td className="text-right p-2">{formatCurrency(200)}</td>
                        <td className="text-right p-2">{formatCurrency(212)}</td>
                        <td className="text-right p-2">{formatCurrency(221)}</td>
                        <td className="text-right p-2">{formatCurrency(229)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Proveedores</td>
                        <td className="text-right p-2">{formatCurrency(375)}</td>
                        <td className="text-right p-2">{formatCurrency(400)}</td>
                        <td className="text-right p-2">{formatCurrency(440)}</td>
                        <td className="text-right p-2">{formatCurrency(480)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Evolución de NOF</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataNOF}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#637988" />
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
        
        <TabsContent value="flujos" className="pt-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Proyección de Cash Flow</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="text-left p-2">Flujo</th>
                        <th className="text-right p-2">Actual</th>
                        <th className="text-right p-2">Año 1</th>
                        <th className="text-right p-2">Año 2</th>
                        <th className="text-right p-2">Año 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold bg-[#f0f3f4]">
                        <td className="p-2">Flujo de Operaciones</td>
                        <td className="text-right p-2">{formatCurrency(350)}</td>
                        <td className="text-right p-2">{formatCurrency(392)}</td>
                        <td className="text-right p-2">{formatCurrency(439)}</td>
                        <td className="text-right p-2">{formatCurrency(492)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">EBITDA</td>
                        <td className="text-right p-2">{formatCurrency(450)}</td>
                        <td className="text-right p-2">{formatCurrency(504)}</td>
                        <td className="text-right p-2">{formatCurrency(565)}</td>
                        <td className="text-right p-2">{formatCurrency(632)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Variación NOF</td>
                        <td className="text-right p-2">{formatCurrency(-35)}</td>
                        <td className="text-right p-2">{formatCurrency(-47)}</td>
                        <td className="text-right p-2">{formatCurrency(-55)}</td>
                        <td className="text-right p-2">{formatCurrency(-65)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Impuestos</td>
                        <td className="text-right p-2">{formatCurrency(-65)}</td>
                        <td className="text-right p-2">{formatCurrency(-65)}</td>
                        <td className="text-right p-2">{formatCurrency(-71)}</td>
                        <td className="text-right p-2">{formatCurrency(-75)}</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Flujo de Inversión</td>
                        <td className="text-right p-2">{formatCurrency(-220)}</td>
                        <td className="text-right p-2">{formatCurrency(-240)}</td>
                        <td className="text-right p-2">{formatCurrency(-260)}</td>
                        <td className="text-right p-2">{formatCurrency(-280)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">CAPEX</td>
                        <td className="text-right p-2">{formatCurrency(-220)}</td>
                        <td className="text-right p-2">{formatCurrency(-240)}</td>
                        <td className="text-right p-2">{formatCurrency(-260)}</td>
                        <td className="text-right p-2">{formatCurrency(-280)}</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Flujo de Financiación</td>
                        <td className="text-right p-2">{formatCurrency(-90)}</td>
                        <td className="text-right p-2">{formatCurrency(-97)}</td>
                        <td className="text-right p-2">{formatCurrency(-119)}</td>
                        <td className="text-right p-2">{formatCurrency(-142)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Amortización Deuda</td>
                        <td className="text-right p-2">{formatCurrency(-50)}</td>
                        <td className="text-right p-2">{formatCurrency(-62)}</td>
                        <td className="text-right p-2">{formatCurrency(-91)}</td>
                        <td className="text-right p-2">{formatCurrency(-121)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Intereses</td>
                        <td className="text-right p-2">{formatCurrency(-40)}</td>
                        <td className="text-right p-2">{formatCurrency(-35)}</td>
                        <td className="text-right p-2">{formatCurrency(-28)}</td>
                        <td className="text-right p-2">{formatCurrency(-21)}</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Free Cash Flow</td>
                        <td className="text-right p-2">{formatCurrency(40)}</td>
                        <td className="text-right p-2">{formatCurrency(55)}</td>
                        <td className="text-right p-2">{formatCurrency(60)}</td>
                        <td className="text-right p-2">{formatCurrency(70)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Cash Flow Acumulado</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { año: 'Actual', fcf: 40, acumulado: 40 },
                        { año: 'Año 1', fcf: 55, acumulado: 95 },
                        { año: 'Año 2', fcf: 60, acumulado: 155 },
                        { año: 'Año 3', fcf: 70, acumulado: 225 },
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#637988" />
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
                      <Bar dataKey="fcf" name="FCF Anual" fill="#B5D5C5" />
                      <Line type="monotone" dataKey="acumulado" name="FCF Acumulado" stroke="#F8CBA6" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ratios" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Proyección de Ratios</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="text-left p-2">Ratio</th>
                        <th className="text-right p-2">Actual</th>
                        <th className="text-right p-2">Año 1</th>
                        <th className="text-right p-2">Año 2</th>
                        <th className="text-right p-2">Año 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold bg-[#f0f3f4]">
                        <td className="p-2">Rentabilidad</td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">ROE (%)</td>
                        <td className="text-right p-2">24.4%</td>
                        <td className="text-right p-2">25.2%</td>
                        <td className="text-right p-2">26.0%</td>
                        <td className="text-right p-2">27.2%</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">ROA (%)</td>
                        <td className="text-right p-2">9.2%</td>
                        <td className="text-right p-2">9.8%</td>
                        <td className="text-right p-2">10.4%</td>
                        <td className="text-right p-2">11.0%</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Margen EBITDA (%)</td>
                        <td className="text-right p-2">18.0%</td>
                        <td className="text-right p-2">18.5%</td>
                        <td className="text-right p-2">19.0%</td>
                        <td className="text-right p-2">19.5%</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Operativos</td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Rotación Clientes (días)</td>
                        <td className="text-right p-2">65</td>
                        <td className="text-right p-2">62</td>
                        <td className="text-right p-2">60</td>
                        <td className="text-right p-2">58</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Rotación Existencias (días)</td>
                        <td className="text-right p-2">85</td>
                        <td className="text-right p-2">84</td>
                        <td className="text-right p-2">82</td>
                        <td className="text-right p-2">80</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Rotación Proveedores (días)</td>
                        <td className="text-right p-2">90</td>
                        <td className="text-right p-2">90</td>
                        <td className="text-right p-2">90</td>
                        <td className="text-right p-2">90</td>
                      </tr>
                      
                      <tr className="font-bold bg-[#f0f3f4] mt-4">
                        <td className="p-2">Financieros</td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                        <td className="text-right p-2"></td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Deuda/EBITDA</td>
                        <td className="text-right p-2">2.1x</td>
                        <td className="text-right p-2">1.9x</td>
                        <td className="text-right p-2">1.7x</td>
                        <td className="text-right p-2">1.5x</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="pl-6 p-2">Cobertura de Intereses</td>
                        <td className="text-right p-2">7.5x</td>
                        <td className="text-right p-2">8.5x</td>
                        <td className="text-right p-2">10.0x</td>
                        <td className="text-right p-2">12.0x</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Evolución de Ratios Clave</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataRatios}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#637988" />
                      <YAxis stroke="#637988" />
                      <Tooltip 
                        formatter={(value) => [`${value}${['roe', 'roa', 'margen'].includes(Object.keys(dataRatios[0]).find(key => dataRatios[0][key as keyof typeof dataRatios[0]] === value) as string) ? '%' : 'x'}`]}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="roe" name="ROE" stroke="#B5D5C5" strokeWidth={2} />
                      <Line type="monotone" dataKey="margen" name="Margen EBITDA" stroke="#EEE9DA" strokeWidth={2} />
                      <Line type="monotone" dataKey="deuda" name="Deuda/EBITDA" stroke="#F8CBA6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-4 p-4 mt-6">
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" /> Supuestos Aplicados
        </Button>
        <Button variant="outline" className="gap-2">
          <BarChartIcon className="h-4 w-4" /> Gráficos Adicionales
        </Button>
        <Button className="bg-[#B5D5C5] hover:bg-[#B5D5C5]/80 text-black gap-2">
          <Download className="h-4 w-4" /> Exportar Proyecciones
        </Button>
      </div>
    </div>
  );
};
