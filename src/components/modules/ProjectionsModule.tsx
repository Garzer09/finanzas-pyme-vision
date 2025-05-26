import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar, Target, AlertTriangle } from 'lucide-react';

const projectedPyG = [
  { year: '2024', ingresos: 2500, costes: -1500, ebitda: 450, beneficio: 195 },
  { year: '2025', ingresos: 2750, costes: -1600, ebitda: 520, beneficio: 245 },
  { year: '2026', ingresos: 3000, costes: -1750, ebitda: 580, beneficio: 285 },
  { year: '2027', ingresos: 3300, costes: -1900, ebitda: 650, beneficio: 335 },
];

const projectedMetrics = [
  { year: '2024', roe: 24.4, roa: 9.2, margenEbitda: 18.0, liquidez: 1.5 },
  { year: '2025', roe: 26.8, roa: 10.1, margenEbitda: 18.9, liquidez: 1.6 },
  { year: '2026', roe: 28.5, roa: 11.2, margenEbitda: 19.3, liquidez: 1.7 },
  { year: '2027', roe: 30.1, roa: 12.5, margenEbitda: 19.7, liquidez: 1.8 },
];

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
    <div className="flex flex-col max-w-[960px] flex-1 mx-auto bg-gradient-to-br from-dashboard-green-50 to-dashboard-orange-50 min-h-screen">
      <div className="flex flex-wrap justify-between gap-3 p-6">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-dashboard-green-600 tracking-light text-[32px] font-bold leading-tight">Proyecciones Financieras</p>
          <p className="text-dashboard-green-500 text-sm font-normal leading-normal">Proyecciones a 3 años con análisis de tendencias</p>
        </div>
      </div>

      <Tabs defaultValue="pyg" className="w-full px-6">
        <TabsList className="grid w-full grid-cols-4 bg-dashboard-green-100 rounded-xl p-1">
          <TabsTrigger value="pyg" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">P&G Proyectado</TabsTrigger>
          <TabsTrigger value="balance" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Balance</TabsTrigger>
          <TabsTrigger value="flujos" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Flujos</TabsTrigger>
          <TabsTrigger value="ratios" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Ratios</TabsTrigger>
        </TabsList>

        <TabsContent value="pyg" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-dashboard-green-600 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Proyección de Ingresos y EBITDA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectedPyG}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                      <XAxis dataKey="year" stroke="#4A7C59" />
                      <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value}K`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #B5D5C5',
                          borderRadius: '12px'
                        }}
                      />
                      <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#9DC88D" fill="url(#greenGradient)" />
                      <Area type="monotone" dataKey="ebitda" stackId="2" stroke="#F8CBA6" fill="url(#orangeGradient)" />
                      <defs>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9DC88D" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#9DC88D" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F8CBA6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#F8CBA6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-dashboard-green-600">Cuenta de P&G Proyectada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-dashboard-green-50 border-b border-dashboard-green-100">
                        <th className="text-left p-3 text-dashboard-green-700">Concepto</th>
                        <th className="text-right p-3 text-dashboard-green-700">2024</th>
                        <th className="text-right p-3 text-dashboard-green-700">2025</th>
                        <th className="text-right p-3 text-dashboard-green-700">2026</th>
                        <th className="text-right p-3 text-dashboard-green-700">2027</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-dashboard-green-100">
                        <td className="p-3 font-medium text-dashboard-green-700">Ingresos</td>
                        <td className="text-right p-3 font-mono text-dashboard-green-600">{formatCurrency(2500)}</td>
                        <td className="text-right p-3 font-mono text-dashboard-green-600">{formatCurrency(2750)}</td>
                        <td className="text-right p-3 font-mono text-dashboard-green-600">{formatCurrency(3000)}</td>
                        <td className="text-right p-3 font-mono text-dashboard-green-600">{formatCurrency(3300)}</td>
                      </tr>
                      <tr className="border-b border-dashboard-green-100">
                        <td className="p-3 font-medium text-dashboard-green-700">EBITDA</td>
                        <td className="text-right p-3 font-mono text-dashboard-orange-600">{formatCurrency(450)}</td>
                        <td className="text-right p-3 font-mono text-dashboard-orange-600">{formatCurrency(520)}</td>
                        <td className="text-right p-3 font-mono text-dashboard-orange-600">{formatCurrency(580)}</td>
                        <td className="text-right p-3 font-mono text-dashboard-orange-600">{formatCurrency(650)}</td>
                      </tr>
                      <tr className="border-b border-dashboard-green-100 bg-dashboard-green-50">
                        <td className="p-3 font-bold text-dashboard-green-700">Beneficio Neto</td>
                        <td className="text-right p-3 font-mono font-bold text-dashboard-green-600">{formatCurrency(195)}</td>
                        <td className="text-right p-3 font-mono font-bold text-dashboard-green-600">{formatCurrency(245)}</td>
                        <td className="text-right p-3 font-mono font-bold text-dashboard-green-600">{formatCurrency(285)}</td>
                        <td className="text-right p-3 font-mono font-bold text-dashboard-green-600">{formatCurrency(335)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="balance" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-dashboard-green-600">Proyección del Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { year: '2024', activo: 2125, pasivo: 950, patrimonio: 1175 },
                        { year: '2025', activo: 2350, pasivo: 980, patrimonio: 1370 },
                        { year: '2026', activo: 2600, pasivo: 1020, patrimonio: 1580 },
                        { year: '2027', activo: 2900, pasivo: 1050, patrimonio: 1850 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                      <XAxis dataKey="year" stroke="#4A7C59" />
                      <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value}K`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #B5D5C5',
                          borderRadius: '12px'
                        }}
                      />
                      <Bar dataKey="activo" name="Activo Total" fill="url(#blueGradient)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pasivo" name="Pasivo" fill="url(#redGradient)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="patrimonio" name="Patrimonio" fill="url(#greenGradient)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A5D7E8" />
                          <stop offset="100%" stopColor="#A5D7E8" stopOpacity={0.6} />
                        </linearGradient>
                        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFB5B5" />
                          <stop offset="100%" stopColor="#FFB5B5" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-dashboard-green-600">Evolución de Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={[
                        { year: '2024', activo_fijo: 1200, existencias: 350, clientes: 450, tesoreria: 125 },
                        { year: '2025', activo_fijo: 1250, existencias: 380, clientes: 520, tesoreria: 200 },
                        { year: '2026', activo_fijo: 1320, existencias: 420, clientes: 580, tesoreria: 280 },
                        { year: '2027', activo_fijo: 1400, existencias: 470, clientes: 650, tesoreria: 380 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                      <XAxis dataKey="year" stroke="#4A7C59" />
                      <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value}K`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #B5D5C5',
                          borderRadius: '12px'
                        }}
                      />
                      <Area type="monotone" dataKey="activo_fijo" stackId="1" stroke="#9DC88D" fill="#9DC88D" fillOpacity={0.6} name="Activo Fijo" />
                      <Area type="monotone" dataKey="existencias" stackId="1" stroke="#F8CBA6" fill="#F8CBA6" fillOpacity={0.6} name="Existencias" />
                      <Area type="monotone" dataKey="clientes" stackId="1" stroke="#A5D7E8" fill="#A5D7E8" fillOpacity={0.6} name="Clientes" />
                      <Area type="monotone" dataKey="tesoreria" stackId="1" stroke="#FFB5B5" fill="#FFB5B5" fillOpacity={0.6} name="Tesorería" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flujos" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-dashboard-green-600">Proyección de Flujos de Caja</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { year: '2024', operativo: 350, inversion: -220, financiacion: -90, fcf: 40 },
                        { year: '2025', operativo: 410, inversion: -180, financiacion: -85, fcf: 145 },
                        { year: '2026', operativo: 470, inversion: -240, financiacion: -80, fcf: 150 },
                        { year: '2027', operativo: 540, inversion: -260, financiacion: -75, fcf: 205 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                      <XAxis dataKey="year" stroke="#4A7C59" />
                      <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value}K`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #B5D5C5',
                          borderRadius: '12px'
                        }}
                      />
                      <Bar dataKey="operativo" name="Flujo Operativo" fill="#9DC88D" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="inversion" name="Flujo Inversión" fill="#F8CBA6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="financiacion" name="Flujo Financiación" fill="#A5D7E8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fcf" name="Free Cash Flow" fill="#FFB5B5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-dashboard-green-600">Evolución de Tesorería</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={[
                        { year: '2024', tesoreria: 125, fcf: 40 },
                        { year: '2025', tesoreria: 165, fcf: 145 },
                        { year: '2026', tesoreria: 310, fcf: 150 },
                        { year: '2027', tesoreria: 460, fcf: 205 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                      <XAxis dataKey="year" stroke="#4A7C59" />
                      <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value}K`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #B5D5C5',
                          borderRadius: '12px'
                        }}
                      />
                      <Line type="monotone" dataKey="tesoreria" stroke="#A5D7E8" strokeWidth={3} dot={{ r: 6 }} name="Tesorería" />
                      <Line type="monotone" dataKey="fcf" stroke="#9DC88D" strokeWidth={3} dot={{ r: 6 }} name="Free Cash Flow" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ratios" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-dashboard-green-600">Evolución de Ratios de Rentabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectedMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                      <XAxis dataKey="year" stroke="#4A7C59" />
                      <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value}%`} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, '']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #B5D5C5',
                          borderRadius: '12px'
                        }}
                      />
                      <Line type="monotone" dataKey="roe" stroke="#9DC88D" strokeWidth={3} dot={{ r: 6 }} name="ROE" />
                      <Line type="monotone" dataKey="roa" stroke="#F8CBA6" strokeWidth={3} dot={{ r: 6 }} name="ROA" />
                      <Line type="monotone" dataKey="margenEbitda" stroke="#A5D7E8" strokeWidth={3} dot={{ r: 6 }} name="Margen EBITDA" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-dashboard-green-600">Evolución de Ratios de Liquidez y Solvencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={[
                        { year: '2024', liquidez: 1.5, solvencia: 1.4, endeudamiento: 0.95 },
                        { year: '2025', liquidez: 1.6, solvencia: 1.5, endeudamiento: 0.90 },
                        { year: '2026', liquidez: 1.7, solvencia: 1.6, endeudamiento: 0.85 },
                        { year: '2027', liquidez: 1.8, solvencia: 1.7, endeudamiento: 0.80 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                      <XAxis dataKey="year" stroke="#4A7C59" />
                      <YAxis stroke="#4A7C59" />
                      <Tooltip 
                        formatter={(value) => [`${value}`, '']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #B5D5C5',
                          borderRadius: '12px'
                        }}
                      />
                      <Line type="monotone" dataKey="liquidez" stroke="#9DC88D" strokeWidth={3} dot={{ r: 6 }} name="Liquidez" />
                      <Line type="monotone" dataKey="solvencia" stroke="#F8CBA6" strokeWidth={3} dot={{ r: 6 }} name="Solvencia" />
                      <Line type="monotone" dataKey="endeudamiento" stroke="#A5D7E8" strokeWidth={3} dot={{ r: 6 }} name="Endeudamiento" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
