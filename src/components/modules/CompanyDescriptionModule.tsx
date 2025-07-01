
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50/30">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-8 space-y-8 overflow-auto">
          {/* Header Section */}
          <section className="relative">
            <div className="modern-card p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel-50/50 via-cadet-50/30 to-steel-50/20"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-steel-500 to-cadet-500"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-cadet-600 bg-clip-text text-transparent">
                    Descripción de la Empresa
                  </h1>
                  <p className="text-slate-700 text-lg font-medium">Información detallada sobre la organización y su contexto empresarial</p>
                </div>
                <Button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-steel hover:shadow-steel rounded-2xl px-6 py-3 font-semibold"
                >
                  {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Guardar' : 'Editar'}
                </Button>
              </div>
            </div>
          </section>

          {/* KPI Cards */}
          <section>
            <div className="responsive-grid">
              <ModernKPICard
                title="Empleados"
                value={companyData.empleados}
                icon={Users}
                variant="success"
                trend="up"
                trendValue="12%"
              />
              <ModernKPICard
                title="Años en el mercado"
                value={new Date().getFullYear() - parseInt(companyData.añoFundacion)}
                icon={Calendar}
                variant="default"
                subtitle="Desde 2018"
              />
              <ModernKPICard
                title="Productos/Servicios"
                value={companyData.productos.length}
                icon={Target}
                variant="warning"
                trend="up"
                trendValue="25%"
              />
              <ModernKPICard
                title="Crecimiento anual"
                value="15%"
                icon={TrendingUp}
                variant="success"
                trend="up"
                trendValue="3.2%"
              />
            </div>
          </section>

          {/* Company Information */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <Card className="modern-card p-8 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-steel-50/30 via-white/20 to-cadet-50/20 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-steel-300/70 to-transparent"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-steel-100">
                    <Building2 className="h-6 w-6 text-steel-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Información General</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de la Empresa</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={companyData.nombre}
                        onChange={(e) => setCompanyData({...companyData, nombre: e.target.value})}
                        className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-steel-500 focus:border-steel-500 shadow-sm font-medium transition-all duration-200"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-lg">{companyData.nombre}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sector</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={companyData.sector}
                        onChange={(e) => setCompanyData({...companyData, sector: e.target.value})}
                        className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-steel-500 focus:border-steel-500 shadow-sm font-medium transition-all duration-200"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{companyData.sector}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Ubicación</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={companyData.ubicacion}
                          onChange={(e) => setCompanyData({...companyData, ubicacion: e.target.value})}
                          className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-steel-500 focus:border-steel-500 shadow-sm font-medium transition-all duration-200"
                        />
                      ) : (
                        <p className="text-slate-900 font-medium">{companyData.ubicacion}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Año de Fundación</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={companyData.añoFundacion}
                          onChange={(e) => setCompanyData({...companyData, añoFundacion: e.target.value})}
                          className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-steel-500 focus:border-steel-500 shadow-sm font-medium transition-all duration-200"
                        />
                      ) : (
                        <p className="text-slate-900 font-medium">{companyData.añoFundacion}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción</label>
                    {isEditing ? (
                      <textarea 
                        rows={4}
                        value={companyData.descripcion}
                        onChange={(e) => setCompanyData({...companyData, descripcion: e.target.value})}
                        className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-steel-500 focus:border-steel-500 shadow-sm font-medium resize-none transition-all duration-200"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium leading-relaxed">{companyData.descripcion}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Mission, Vision, Values */}
            <Card className="modern-card p-8 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cadet-50/30 via-white/20 to-steel-50/20 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cadet-300/70 to-transparent"></div>
              
              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-steel-500"></div>
                    Misión
                  </h3>
                  {isEditing ? (
                    <textarea 
                      rows={3}
                      value={companyData.mision}
                      onChange={(e) => setCompanyData({...companyData, mision: e.target.value})}
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-steel-500 focus:border-steel-500 shadow-sm font-medium resize-none transition-all duration-200"
                    />
                  ) : (
                    <p className="text-slate-700 font-medium leading-relaxed">{companyData.mision}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cadet-500"></div>
                    Visión
                  </h3>
                  {isEditing ? (
                    <textarea 
                      rows={3}
                      value={companyData.vision}
                      onChange={(e) => setCompanyData({...companyData, vision: e.target.value})}
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-steel-500 focus:border-steel-500 shadow-sm font-medium resize-none transition-all duration-200"
                    />
                  ) : (
                    <p className="text-slate-700 font-medium leading-relaxed">{companyData.vision}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success-500"></div>
                    Valores
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {companyData.valores.map((valor, index) => (
                      <div key={index} className="bg-gradient-to-r from-steel-50 to-cadet-50 border border-steel-200/60 rounded-xl p-3 hover:shadow-soft transition-all duration-200 interactive">
                        <span className="text-slate-900 font-medium text-sm">{valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Products/Services */}
          <section>
            <Card className="modern-card p-8 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-steel-50/30 via-white/20 to-cadet-50/20 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-steel-500 to-cadet-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-steel-500 to-cadet-500">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Productos y Servicios</h2>
                </div>
                <div className="responsive-grid">
                  {companyData.productos.map((producto, index) => (
                    <div key={index} className="bg-gradient-to-br from-white/80 to-steel-50/60 border border-steel-200/50 rounded-2xl p-6 hover:shadow-professional hover:scale-105 transition-all duration-300 interactive group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-steel-500 to-cadet-500 group-hover:scale-110 transition-transform duration-200">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 flex-1">{producto}</h3>
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
