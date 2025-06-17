
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, MapPin, Calendar, Target, TrendingUp, Edit, Save } from 'lucide-react';
import { useState } from 'react';

export const CompanyDescriptionModule = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState({
    nombre: 'TechSolutions S.L.',
    sector: 'Tecnología e Innovación',
    ubicacion: 'Madrid, España',
    añoFundacion: '2018',
    empleados: '85',
    descripcion: 'Empresa especializada en soluciones tecnológicas integrales para pequeñas y medianas empresas. Ofrecemos servicios de consultoría IT, desarrollo de software personalizado y transformación digital.',
    mision: 'Democratizar el acceso a la tecnología avanzada para empresas de todos los tamaños, facilitando su transformación digital y crecimiento sostenible.',
    vision: 'Ser la empresa de referencia en soluciones tecnológicas integrales en el mercado español para 2027.',
    valores: ['Innovación continua', 'Excelencia en el servicio', 'Compromiso con el cliente', 'Responsabilidad social'],
    productos: [
      'Consultoría IT estratégica',
      'Desarrollo de software a medida',
      'Plataformas de gestión empresarial',
      'Servicios de transformación digital'
    ]
  });

  const companyStats = [
    {
      label: 'Empleados',
      value: companyData.empleados,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      label: 'Años en el mercado',
      value: new Date().getFullYear() - parseInt(companyData.añoFundacion),
      icon: Calendar,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50'
    },
    {
      label: 'Productos/Servicios',
      value: companyData.productos.length,
      icon: Target,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50'
    },
    {
      label: 'Crecimiento anual',
      value: '15%',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-8 space-y-8 overflow-auto">
          {/* Header Section */}
          <section className="relative">
            <div className="relative bg-white/90 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-gray-900/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-blue-50/30 to-purple-50/20 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Descripción de la Empresa
                  </h1>
                  <p className="text-gray-700 text-lg font-medium">Información detallada sobre la organización y su contexto empresarial</p>
                </div>
                <Button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-indigo-500/90 backdrop-blur-sm hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/20 text-white border border-white/20 transition-all duration-300 hover:-translate-y-1 rounded-2xl px-6 py-3 font-semibold"
                >
                  {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Guardar' : 'Editar'}
                </Button>
              </div>
            </div>
          </section>

          {/* Stats Cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {companyStats.map((stat, index) => {
                const Icon = stat.icon;
                
                return (
                  <Card 
                    key={index} 
                    className="group relative bg-white/90 backdrop-blur-2xl border border-white/50 hover:border-indigo-200/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50 group-hover:opacity-70 transition-opacity duration-300 rounded-3xl`}></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                    <div className="absolute top-2 left-2 w-16 h-16 bg-white/20 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{stat.label}</h3>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 tracking-tight">
                        {stat.value}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Company Information */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/50 hover:border-indigo-200/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-white/20 to-blue-50/20 opacity-60 group-hover:opacity-80 transition-opacity duration-300 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Información General</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Empresa</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={companyData.nombre}
                        onChange={(e) => setCompanyData({...companyData, nombre: e.target.value})}
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-medium"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold text-lg">{companyData.nombre}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sector</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={companyData.sector}
                        onChange={(e) => setCompanyData({...companyData, sector: e.target.value})}
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-medium"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{companyData.sector}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={companyData.ubicacion}
                          onChange={(e) => setCompanyData({...companyData, ubicacion: e.target.value})}
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-medium"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{companyData.ubicacion}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Año de Fundación</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={companyData.añoFundacion}
                          onChange={(e) => setCompanyData({...companyData, añoFundacion: e.target.value})}
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-medium"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{companyData.añoFundacion}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                    {isEditing ? (
                      <textarea 
                        rows={4}
                        value={companyData.descripcion}
                        onChange={(e) => setCompanyData({...companyData, descripcion: e.target.value})}
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-medium resize-none"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium leading-relaxed">{companyData.descripcion}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Mission, Vision, Values */}
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/50 hover:border-indigo-200/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white/20 to-purple-50/20 opacity-60 group-hover:opacity-80 transition-opacity duration-300 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              
              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Misión</h3>
                  {isEditing ? (
                    <textarea 
                      rows={3}
                      value={companyData.mision}
                      onChange={(e) => setCompanyData({...companyData, mision: e.target.value})}
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-medium resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 font-medium leading-relaxed">{companyData.mision}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Visión</h3>
                  {isEditing ? (
                    <textarea 
                      rows={3}
                      value={companyData.vision}
                      onChange={(e) => setCompanyData({...companyData, vision: e.target.value})}
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-medium resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 font-medium leading-relaxed">{companyData.vision}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Valores</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {companyData.valores.map((valor, index) => (
                      <div key={index} className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-3 backdrop-blur-sm">
                        <span className="text-gray-900 font-medium text-sm">{valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Products/Services */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/50 hover:border-indigo-200/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-white/20 to-indigo-50/20 opacity-60 group-hover:opacity-80 transition-opacity duration-300 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos y Servicios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {companyData.productos.map((producto, index) => (
                    <div key={index} className="bg-gradient-to-br from-white/60 to-indigo-50/40 border border-indigo-100/50 rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{producto}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
