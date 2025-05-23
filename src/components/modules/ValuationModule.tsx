
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Info, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Formato para valores monetarios
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Datos para EVA
const dataEVA = [
  { 
    año: "Año 0",
    nopat: 225000, 
    capitalEmpleado: 1950000,
    wacc: 0.085,
    cargoCapital: 165750,
    eva: 59250,
    valorMercado: 3100000
  },
  { 
    año: "Año 1",
    nopat: 252000, 
    capitalEmpleado: 2080000,
    wacc: 0.085,
    cargoCapital: 176800,
    eva: 75200,
    valorMercado: 3400000
  },
  { 
    año: "Año 2",
    nopat: 282000, 
    capitalEmpleado: 2205000,
    wacc: 0.085,
    cargoCapital: 187425,
    eva: 94575,
    valorMercado: 3720000
  },
  { 
    año: "Año 3",
    nopat: 315000, 
    capitalEmpleado: 2355000,
    wacc: 0.085,
    cargoCapital: 200175,
    eva: 114825,
    valorMercado: 4100000
  }
];

// Datos para métodos de valoración
const datosValoracion = [
  { metodo: "DCF", valor: 3800000, confianza: 80, color: "#B5D5C5" },
  { metodo: "Múltiplos", valor: 3560000, confianza: 75, color: "#EEE9DA" },
  { metodo: "Valor en libros", valor: 2750000, confianza: 50, color: "#F8CBA6" },
  { metodo: "EVA", valor: 3900000, confianza: 85, color: "#A5D7E8" },
];

export const ValuationModule = () => {
  return (
    <div className="flex flex-col max-w-[960px] flex-1 mx-auto">
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight">Valoración Económica</p>
          <p className="text-[#637988] text-sm font-normal leading-normal">Análisis del Valor Económico Añadido (EVA) y Métodos de Valoración</p>
        </div>
      </div>
      
      <Tabs defaultValue="introduccion" className="w-full px-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="introduccion">Introducción EVA</TabsTrigger>
          <TabsTrigger value="calculo">Cálculo EVA</TabsTrigger>
          <TabsTrigger value="interpretacion">Interpretación</TabsTrigger>
          <TabsTrigger value="comparativa">Métodos de Valoración</TabsTrigger>
        </TabsList>
        
        <TabsContent value="introduccion" className="pt-6">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">¿Qué es el Valor Económico Añadido (EVA)?</h3>
                <p className="text-base mb-4">
                  El Valor Económico Añadido (EVA) es una medida financiera que calcula el verdadero beneficio económico de una empresa después de considerar el coste de todo el capital empleado, tanto propio como ajeno.
                </p>
                
                <div className="bg-[#f0f3f4] p-6 rounded-lg mb-6">
                  <p className="text-lg font-semibold text-center mb-4">Fórmula EVA</p>
                  <p className="text-xl font-bold text-center">EVA = NOPAT - (Capital Empleado × WACC)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="text-center">
                      <p className="font-medium">NOPAT</p>
                      <p className="text-sm mt-1">Beneficio Operativo después de impuestos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Capital Empleado</p>
                      <p className="text-sm mt-1">Activos - Pasivos sin coste</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">WACC</p>
                      <p className="text-sm mt-1">Coste medio ponderado del capital</p>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-base font-semibold mb-3">Ventajas del EVA como medida de desempeño</h4>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>Considera el coste de oportunidad de los accionistas</li>
                  <li>Vincula resultados con decisiones operativas y financieras</li>
                  <li>Permite evaluar si la empresa está creando o destruyendo valor</li>
                  <li>Facilita la comparación entre unidades de negocio</li>
                  <li>Ayuda a alinear los intereses de la dirección con los de los accionistas</li>
                </ul>
                
                <h4 className="text-base font-semibold mb-3">Decisiones que mejoran el EVA</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#B5D5C5] bg-opacity-10 p-4 rounded-lg">
                    <p className="font-medium mb-2">1. Mejora del NOPAT</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Aumentar ingresos</li>
                      <li>Reducir costes operativos</li>
                      <li>Optimizar impuestos</li>
                    </ul>
                  </div>
                  <div className="bg-[#EEE9DA] bg-opacity-30 p-4 rounded-lg">
                    <p className="font-medium mb-2">2. Optimizar el Capital</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Mejorar rotación de activos</li>
                      <li>Reducir inventarios</li>
                      <li>Gestión eficiente de NOF</li>
                    </ul>
                  </div>
                  <div className="bg-[#A5D7E8] bg-opacity-20 p-4 rounded-lg">
                    <p className="font-medium mb-2">3. Reducir el WACC</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Estructura óptima de capital</li>
                      <li>Negociar mejores condiciones</li>
                      <li>Reducir riesgo operativo</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="calculo" className="pt-6">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Cálculo del EVA (Año 0 - 3)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="text-left p-2">Componente</th>
                        <th className="text-right p-2">Año 0</th>
                        <th className="text-right p-2">Año 1</th>
                        <th className="text-right p-2">Año 2</th>
                        <th className="text-right p-2">Año 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">EBIT</td>
                        <td className="text-right p-2">{formatCurrency(300000)}</td>
                        <td className="text-right p-2">{formatCurrency(336000)}</td>
                        <td className="text-right p-2">{formatCurrency(376000)}</td>
                        <td className="text-right p-2">{formatCurrency(420000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Impuestos sobre EBIT (25%)</td>
                        <td className="text-right p-2">{formatCurrency(-75000)}</td>
                        <td className="text-right p-2">{formatCurrency(-84000)}</td>
                        <td className="text-right p-2">{formatCurrency(-94000)}</td>
                        <td className="text-right p-2">{formatCurrency(-105000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5] font-medium bg-[#f0f3f4]">
                        <td className="p-2">NOPAT</td>
                        <td className="text-right p-2">{formatCurrency(225000)}</td>
                        <td className="text-right p-2">{formatCurrency(252000)}</td>
                        <td className="text-right p-2">{formatCurrency(282000)}</td>
                        <td className="text-right p-2">{formatCurrency(315000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Capital Empleado</td>
                        <td className="text-right p-2">{formatCurrency(1950000)}</td>
                        <td className="text-right p-2">{formatCurrency(2080000)}</td>
                        <td className="text-right p-2">{formatCurrency(2205000)}</td>
                        <td className="text-right p-2">{formatCurrency(2355000)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">WACC (%)</td>
                        <td className="text-right p-2">8.5%</td>
                        <td className="text-right p-2">8.5%</td>
                        <td className="text-right p-2">8.5%</td>
                        <td className="text-right p-2">8.5%</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5]">
                        <td className="p-2">Cargo por Capital</td>
                        <td className="text-right p-2">{formatCurrency(-165750)}</td>
                        <td className="text-right p-2">{formatCurrency(-176800)}</td>
                        <td className="text-right p-2">{formatCurrency(-187425)}</td>
                        <td className="text-right p-2">{formatCurrency(-200175)}</td>
                      </tr>
                      <tr className="border-b border-[#dce1e5] font-medium">
                        <td className="p-2 bg-[#f0f3f4]">EVA</td>
                        <td className="text-right p-2 bg-[#f0f3f4]">{formatCurrency(59250)}</td>
                        <td className="text-right p-2 bg-[#f0f3f4]">{formatCurrency(75200)}</td>
                        <td className="text-right p-2 bg-[#f0f3f4]">{formatCurrency(94575)}</td>
                        <td className="text-right p-2 bg-[#f0f3f4]">{formatCurrency(114825)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Evolución del EVA</h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dataEVA}
                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="año" stroke="#637988" />
                        <YAxis stroke="#637988" />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value)), "EVA"]}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="eva" fill="#B5D5C5" name="EVA" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">CAGR EVA</p>
                      <p className="text-xl font-bold">+24.7%</p>
                      <p className="text-xs text-[#637988] mt-1">Crecimiento anual compuesto</p>
                    </div>
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">EVA acumulado</p>
                      <p className="text-xl font-bold">{formatCurrency(343850)}</p>
                      <p className="text-xs text-[#637988] mt-1">Suma total del periodo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Desglose del EVA - Año 3</h3>
                  <div className="h-[350px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "NOPAT", value: 315000 },
                            { name: "Cargo por Capital", value: -200175 }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value, percent }) => `${name}: ${formatCurrency(Math.abs(Number(value)))}`}
                        >
                          <Cell fill="#B5D5C5" />
                          <Cell fill="#F8CBA6" />
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(Math.abs(Number(value)))]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div className="bg-[#f0f3f4] p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-[#111518] font-medium">EVA / Capital Empleado</p>
                        <p className="text-sm text-[#111518] font-medium">4.9%</p>
                      </div>
                      <div className="w-full bg-[#dce1e5] rounded-full h-2.5">
                        <div className="bg-[#B5D5C5] h-2.5 rounded-full" style={{ width: '57%' }}></div>
                      </div>
                      <p className="mt-1 text-xs text-[#078838]">Rendimiento por encima del coste de capital</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="interpretacion" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">EVA vs. Capital Empleado</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataEVA}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#637988" />
                      <YAxis yAxisId="left" orientation="left" stroke="#B5D5C5" />
                      <YAxis yAxisId="right" orientation="right" stroke="#F8CBA6" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "eva") return [formatCurrency(Number(value)), "EVA"];
                          if (name === "capitalEmpleado") return [formatCurrency(Number(value)), "Capital Empleado"];
                          return [value, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="eva" name="EVA" stroke="#B5D5C5" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="capitalEmpleado" name="Capital Empleado" stroke="#F8CBA6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">EVA vs. Valor de Mercado</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataEVA}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#637988" />
                      <YAxis yAxisId="left" orientation="left" stroke="#B5D5C5" />
                      <YAxis yAxisId="right" orientation="right" stroke="#A5D7E8" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "eva") return [formatCurrency(Number(value)), "EVA"];
                          if (name === "valorMercado") return [formatCurrency(Number(value)), "Valor de Mercado"];
                          return [value, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="eva" name="EVA" stroke="#B5D5C5" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="valorMercado" name="Valor de Mercado" stroke="#A5D7E8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Spread del ROIC</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataEVA.map(item => ({
                        año: item.año,
                        roic: (item.nopat / item.capitalEmpleado) * 100,
                        wacc: item.wacc * 100,
                        spread: ((item.nopat / item.capitalEmpleado) * 100) - (item.wacc * 100)
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#637988" />
                      <YAxis stroke="#637988" />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toFixed(1)}%`]}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="roic" name="ROIC %" stroke="#B5D5C5" strokeWidth={2} />
                      <Line type="monotone" dataKey="wacc" name="WACC %" stroke="#F8CBA6" strokeWidth={2} />
                      <Line type="monotone" dataKey="spread" name="Spread %" stroke="#A5D7E8" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Interpretación de la Creación de Valor</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#B5D5C5] bg-opacity-20 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium">EVA Positivo</p>
                          <p className="text-sm mt-1">La empresa está generando retornos superiores al coste de su capital, creando valor para los accionistas.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#A5D7E8] bg-opacity-20 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-5 w-5 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium">EVA Creciente</p>
                          <p className="text-sm mt-1">El diferencial entre rendimiento y coste de capital está aumentando, mejorando la eficiencia en el uso de recursos.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#EEE9DA] bg-opacity-30 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Correlación con Valor</p>
                          <p className="text-sm mt-1">Existe una relación directa entre el EVA y el valor de mercado de la compañía a medio plazo.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-6 rounded-lg">
                    <h4 className="text-base font-semibold mb-3">Claves de la Creación de Valor</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-2">1. Mejora de la Eficiencia Operativa</h5>
                        <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
                          <li>Incremento sostenido en ventas (+12% anual)</li>
                          <li>Expansión de márgenes operativos (18% a 19.5%)</li>
                          <li>Mejora en productividad de los activos</li>
                        </ul>
                        
                        <h5 className="font-medium mb-2">2. Gestión Eficiente del Capital</h5>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          <li>Optimización del ciclo de caja (-3 días en clientes)</li>
                          <li>Inversiones con alto retorno (TIR &gt; WACC)</li>
                          <li>Desinversión en activos no estratégicos</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">3. Estructura Financiera Óptima</h5>
                        <ul className="list-disc pl-5 text-sm space-y-1 mb-3">
                          <li>Reducción gradual del apalancamiento</li>
                          <li>Mejora en la calificación crediticia</li>
                          <li>Disminución del coste de la deuda</li>
                        </ul>
                        
                        <h5 className="font-medium mb-2">4. Crecimiento Rentable</h5>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          <li>Inversión en segmentos de alta rentabilidad</li>
                          <li>Expansión con disciplina de capital</li>
                          <li>Foco en generación de caja a largo plazo</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="comparativa" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Métodos de Valoración</h3>
                  <Select defaultValue="Todos">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar métodos..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos los métodos</SelectItem>
                      <SelectItem value="DCF">Flujo de Caja (DCF)</SelectItem>
                      <SelectItem value="Múltiplos">Múltiplos</SelectItem>
                      <SelectItem value="EVA">Valoración por EVA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0f3f4] border-b border-[#dce1e5]">
                        <th className="text-left p-2">Método</th>
                        <th className="text-right p-2">Valor</th>
                        <th className="text-center p-2">Confianza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosValoracion.map((item, index) => (
                        <tr key={index} className="border-b border-[#dce1e5]">
                          <td className="p-2">{item.metodo}</td>
                          <td className="text-right p-2">{formatCurrency(item.valor)}</td>
                          <td className="text-center p-2">
                            <div className="w-full bg-[#dce1e5] rounded-full h-2 inline-block" style={{ width: '100px' }}>
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  width: `${item.confianza}%`, 
                                  backgroundColor: item.color 
                                }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs">{item.confianza}%</span>
                          </td>
                        </tr>
                      ))}
                      <tr className="font-medium bg-[#f0f3f4]">
                        <td className="p-2">Valor Medio Ponderado</td>
                        <td className="text-right p-2">{formatCurrency(3700000)}</td>
                        <td className="text-center p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosValoracion}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="metodo" stroke="#637988" />
                      <YAxis stroke="#637988" />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), "Valor"]}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="valor" name="Valor">
                        {datosValoracion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">EVA vs. Métodos Tradicionales</h3>
                <div className="space-y-4">
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Método DCF</h4>
                    <div className="flex flex-col">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-sm">WACC:</p>
                        <p className="text-sm font-medium text-right">8.5%</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-sm">Tasa de crecimiento g:</p>
                        <p className="text-sm font-medium text-right">2.5%</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-sm">Free Cash Flow (Año 3):</p>
                        <p className="text-sm font-medium text-right">{formatCurrency(70000)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-dashed border-[#dce1e5] pt-2 mt-2">
                        <p className="text-sm font-medium">Valor DCF:</p>
                        <p className="text-sm font-medium text-right">{formatCurrency(3800000)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Método Múltiplos</h4>
                    <div className="flex flex-col">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-sm">EV/EBITDA sectorial:</p>
                        <p className="text-sm font-medium text-right">7.9x</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-sm">EBITDA (Año 3):</p>
                        <p className="text-sm font-medium text-right">{formatCurrency(632000)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-sm">Deuda neta:</p>
                        <p className="text-sm font-medium text-right">{formatCurrency(-432000)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-dashed border-[#dce1e5] pt-2 mt-2">
                        <p className="text-sm font-medium">Valor Múltiplos:</p>
                        <p className="text-sm font-medium text-right">{formatCurrency(3560000)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f0f3f4] p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Método EVA</h4>
                    <div className="flex flex-col">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-sm">Capital empleado:</p>
                        <p className="text-sm font-medium text-right">{formatCurrency(2355000)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-sm">MVA (Valor actual EVAs):</p>
                        <p className="text-sm font-medium text-right">{formatCurrency(1545000)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-dashed border-[#dce1e5] pt-2 mt-2">
                        <p className="text-sm font-medium">Valor EVA:</p>
                        <p className="text-sm font-medium text-right">{formatCurrency(3900000)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Recomendaciones para Incrementar el Valor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-[#B5D5C5] bg-opacity-20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">1. Mejora Operativa</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Incrementar ventas en segmentos de mayor margen (+15% objetivo)</li>
                        <li>Eliminar productos con margen de contribución negativo</li>
                        <li>Reducir costes fijos en un 3% mediante digitalización</li>
                        <li>Optimizar capacidad productiva: incrementar utilización al 85%</li>
                      </ul>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-medium">Impacto en valor:</span>
                        <span className="text-xs font-medium text-[#078838]">+15%</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#EEE9DA] bg-opacity-30 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">2. Gestión del Capital</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Reducir ciclo de caja: cobros -5 días, pagos +3 días</li>
                        <li>Revisar niveles óptimos de inventario: -15% objetivo</li>
                        <li>Desinvertir en activos no estratégicos: €300K</li>
                        <li>Optimizar CAPEX con criterio EVA: TIR &gt; WACC+2%</li>
                      </ul>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-medium">Impacto en valor:</span>
                        <span className="text-xs font-medium text-[#078838]">+10%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-[#A5D7E8] bg-opacity-20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">3. Estructura Financiera</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Reducir ratio Deuda/EBITDA a 1.5x</li>
                        <li>Refinanciar deuda actual: objetivo -1.5% en tipo medio</li>
                        <li>Implementar política de dividendos sostenible: 40% payout</li>
                        <li>Optimizar escudo fiscal: deducciones I+D+i</li>
                      </ul>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-medium">Impacto en valor:</span>
                        <span className="text-xs font-medium text-[#078838]">+7%</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#F8CBA6] bg-opacity-20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">4. Crecimiento Estratégico</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Adquisiciones selectivas con criterio EVA</li>
                        <li>Penetración en mercados de mayor crecimiento (+20%)</li>
                        <li>Desarrollar nuevas líneas con margen EBITDA &gt;25%</li>
                        <li>Alianzas estratégicas para reducir capital empleado</li>
                      </ul>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-medium">Impacto en valor:</span>
                        <span className="text-xs font-medium text-[#078838]">+20%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-[#f0f3f4] p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Potencial de creación de valor total</h4>
                    <p className="font-bold text-[#078838]">+35-45%</p>
                  </div>
                  <p className="text-sm mt-2">Plan de implementación a 3 años con monitorización trimestral de drivers de valor.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-4 p-4 mt-6">
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" /> Metodología EVA
        </Button>
        <Button variant="outline" className="gap-2">
          <Info className="h-4 w-4" /> Benchmarking Sectorial
        </Button>
        <Button className="bg-[#B5D5C5] hover:bg-[#B5D5C5]/80 text-black gap-2">
          <Download className="h-4 w-4" /> Exportar Valoración
        </Button>
      </div>
    </div>
  );
};

