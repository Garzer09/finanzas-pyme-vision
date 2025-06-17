
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export const EfficiencyModule = () => {
  const rotationsData = [
    { concepto: 'Rotación Existencias', empresa: 8.2, sector: 10.5, unidad: 'veces/año' },
    { concepto: 'Rotación Clientes', empresa: 5.9, sector: 7.2, unidad: 'veces/año' },
    { concepto: 'Rotación Proveedores', empresa: 8.9, sector: 8.1, unidad: 'veces/año' },
    { concepto: 'Rotación Activos', empresa: 1.3, sector: 1.8, unidad: 'veces/año' },
  ];

  const productivityData = [
    { concepto: 'Ventas por Empleado', valor: 125000, benchmark: 150000 },
    { concepto: 'EBITDA por Empleado', valor: 22500, benchmark: 27000 },
    { concepto: 'Gastos Personal/Ventas', valor: 16, benchmark: 14 },
  ];

  const cycleData = [
    { indicador: 'Días Existencias', value: 44, fullMark: 60 },
    { indicador: 'Días Clientes', value: 62, fullMark: 60 },
    { indicador: 'Días Proveedores', value: 41, fullMark: 60 },
    { indicador: 'Ciclo Caja', value: 65, fullMark: 60 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/5 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
          <div className="absolute top-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-gray-900">Rotaciones vs Sector</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-80 relative">
              <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rotationsData}>
                  <defs>
                    <linearGradient id="rotationGradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4682B4" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#87CEEB" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="rotationGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.6}/>
                    </linearGradient>
                    <filter id="rotationShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#4682B4" floodOpacity="0.2"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="concepto" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '16px',
                      color: '#374151',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}
                  />
                  <Bar 
                    dataKey="empresa" 
                    fill="url(#rotationGradient1)" 
                    name="Empresa" 
                    radius={[8, 8, 0, 0]} 
                    filter="url(#rotationShadow)"
                  />
                  <Bar 
                    dataKey="sector" 
                    fill="url(#rotationGradient2)" 
                    name="Sector" 
                    radius={[8, 8, 0, 0]} 
                    filter="url(#rotationShadow)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-light-gray-100/5 via-white/20 to-steel-blue/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
          <div className="absolute bottom-4 right-4 w-32 h-32 bg-light-gray-200/8 rounded-full blur-3xl"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-gray-900">Ciclo Operativo</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-80 relative">
              <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={cycleData}>
                  <defs>
                    <filter id="radarShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4682B4" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="indicador" className="text-sm" />
                  <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                  <Radar
                    name="Días"
                    dataKey="value"
                    stroke="#4682B4"
                    fill="#4682B4"
                    fillOpacity={0.3}
                    strokeWidth={3}
                    filter="url(#radarShadow)"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-steel-blue/10 backdrop-blur-sm p-4 rounded-2xl text-center border border-steel-blue/20 shadow-lg">
                <p className="text-sm text-steel-blue-dark mb-1 font-medium">Ciclo Total</p>
                <p className="text-2xl font-bold text-steel-blue">65 días</p>
              </div>
              <div className="bg-light-gray-100/60 backdrop-blur-sm p-4 rounded-2xl text-center border border-light-gray-200/50 shadow-lg">
                <p className="text-sm text-gray-700 mb-1 font-medium">Objetivo</p>
                <p className="text-2xl font-bold text-gray-800">50 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Productivity Analysis */}
      <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/3 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
        <div className="absolute top-6 right-6 w-32 h-32 bg-steel-blue/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-6 left-6 w-40 h-40 bg-light-gray-200/6 rounded-full blur-3xl"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-gray-900 text-xl">Análisis de Productividad</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-6">
            {productivityData.map((item, index) => (
              <div key={index} className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-gray-900">{item.concepto}</span>
                  <div className="flex space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 font-medium">Empresa</p>
                      <p className="font-bold text-gray-900">
                        {item.concepto.includes('%') || item.concepto.includes('/Ventas') 
                          ? `${item.valor}%` 
                          : formatCurrency(item.valor)
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 font-medium">Benchmark</p>
                      <p className="font-bold text-steel-blue">
                        {item.concepto.includes('%') || item.concepto.includes('/Ventas') 
                          ? `${item.benchmark}%` 
                          : formatCurrency(item.benchmark)
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-light-gray-200/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full ${
                      (item.concepto.includes('/Ventas') ? item.valor <= item.benchmark : item.valor >= item.benchmark)
                        ? 'bg-gradient-to-r from-steel-blue to-steel-blue-light' 
                        : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                    } shadow-sm`}
                    style={{ 
                      width: `${Math.min(
                        item.concepto.includes('/Ventas') 
                          ? (item.benchmark / item.valor) * 100
                          : (item.valor / item.benchmark) * 100, 
                        100
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 p-6 rounded-2xl shadow-lg">
              <h4 className="font-semibold text-yellow-800 mb-3">Oportunidades de Mejora</h4>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• Reducir período medio de cobro en 12 días</li>
                <li>• Optimizar rotación de existencias</li>
                <li>• Mejorar productividad por empleado</li>
              </ul>
            </div>
            <div className="bg-steel-blue/10 backdrop-blur-sm border border-steel-blue/20 p-6 rounded-2xl shadow-lg">
              <h4 className="font-semibold text-steel-blue-dark mb-3">Fortalezas</h4>
              <ul className="text-sm text-steel-blue space-y-2">
                <li>• Gestión eficiente de proveedores</li>
                <li>• Control adecuado de gastos operativos</li>
                <li>• Rotación de activos estable</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
