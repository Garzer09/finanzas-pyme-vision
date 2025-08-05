import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Download, 
  FileSpreadsheet, 
  Copy,
  CreditCard,
  TrendingUp,
  Calendar,
  Info,
  Building2,
  Target,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { useRealDebtData } from '@/hooks/useRealDebtData';
import { MissingDataIndicator } from '@/components/ui/missing-data-indicator';
import { DebtPoolTable } from './debt-pool/DebtPoolTable';
import { DebtPoolCharts } from './debt-pool/DebtPoolCharts';
import { DebtPoolTimeline } from './debt-pool/DebtPoolTimeline';

export const DebtPoolModule = () => {
  // Get companyId from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('companyId');
  
  const {
    debtLoans,
    totalCapitalPendiente,
    tirPromedio,
    debtByEntity,
    debtByType,
    vencimientos,
    riskMetrics,
    isLoading,
    error,
    hasRealData
  } = useRealDebtData(companyId || undefined);

  const [showAddForm, setShowAddForm] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatRatio = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals) + 'x';
  };

  const handleExportPDF = () => {
    console.log('Exporting debt analysis to PDF...');
  };

  const handleExportExcel = () => {
    console.log('Exporting debt data to Excel...');
  };

  const handleDuplicateScenario = () => {
    console.log('Duplicating current scenario...');
  };

  return (
    <TooltipProvider>
      <main className="flex-1 p-6 space-y-6 overflow-auto bg-background">
        {/* Header Section */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Pool Bancario y Detalle del Endeudamiento
              </h1>
              <p className="text-muted-foreground">
                Gestión y análisis detallado de todas las deudas financieras
              </p>
            </div>
          </div>
        </section>

        {/* KPI Header - 3 tarjetas principales */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Capital Pendiente Total - Primaria */}
          <Card className="bg-white border-slate-200 relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#005E8A]" />
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Capital Pendiente Total
                  </CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Suma de todo el capital pendiente de amortizar</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-[#005E8A]">
                  {formatCurrency(totalCapitalPendiente)}
                </p>
                <Badge variant="outline" className="text-xs">
                  {debtLoans.length} instrumentos
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* TIR Promedio */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#005E8A] opacity-70" />
                  <CardTitle className="text-sm font-medium text-slate-700">
                    TIR Promedio
                  </CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Tipo de interés promedio ponderado por capital</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-900">
                  {tirPromedio.toFixed(2)}%
                </p>
                <p className="text-sm text-slate-500">ponderado por capital</p>
              </div>
            </CardContent>
          </Card>

          {/* Cuota Mensual */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#005E8A] opacity-70" />
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Cuota Mensual
                  </CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Suma de todas las cuotas mensuales</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(0)} {/* TODO: Calculate from debt service data */}
                </p>
                <p className="text-sm text-slate-500">compromisos regulares</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Acciones Rápidas */}
        <section className="flex flex-wrap gap-3 justify-end">
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-[#005E8A] hover:bg-[#004a6b] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Deuda
          </Button>
          
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          
          <Button variant="outline" onClick={handleDuplicateScenario}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar Escenario
          </Button>
        </section>

        {/* Main Content - Show data or missing data indicator */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando datos de deuda...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Error: {error}</p>
          </div>
        ) : !hasRealData() ? (
          <MissingDataIndicator
            title="Sin Datos de Pool de Deuda"
            description="No se han encontrado datos del pool bancario. Suba la plantilla 'pool-deuda.csv' para ver el análisis completo del endeudamiento."
            onUploadClick={() => window.location.href = `/admin/carga-plantillas?companyId=${companyId}`}
            size="lg"
            className="mx-auto max-w-2xl"
          />
        ) : (
          <>
            {/* Tabla Pool Bancario */}
            <section>
              <DebtPoolTable 
                debtItems={debtLoans.map(loan => ({
                  id: loan.id,
                  entidad: loan.entity_name,
                  tipo: loan.loan_type,
                  capitalInicial: loan.initial_amount,
                  capitalPendiente: loan.current_balance,
                  tipoInteres: loan.interest_rate,
                  plazoRestante: Math.ceil((new Date(loan.maturity_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)),
                  cuota: 0, // TODO: Calculate from debt service
                  proximoVencimiento: loan.maturity_date,
                  ultimoVencimiento: loan.maturity_date,
                  frecuencia: 'Mensual',
                  garantias: loan.guarantees
                }))}
                onEdit={() => {}} // TODO: Implement edit functionality
                onDelete={() => {}} // TODO: Implement delete functionality
              />
            </section>

            {/* Gráficos de Composición */}
            <section>
              <DebtPoolCharts
                debtByType={debtByType}
              />
            </section>

            {/* Calendario de Vencimientos */}
            <section>
              <DebtPoolTimeline vencimientos={vencimientos.map(v => ({
                id: v.id,
                entidad: `Vencimiento ${v.year}`,
                tipo: 'Vencimiento',
                importe: v.total,
                fecha: `${v.year}-12-31`,
                daysUntil: Math.ceil((new Date(`${v.year}-12-31`).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                urgency: v.urgency as 'alta' | 'media' | 'baja'
              }))} />
            </section>
          </>
        )}

        {/* Métricas de Riesgo */}
        <section>
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#005E8A]" />
                Métricas de Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* DSCR */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#005E8A]" />
                    <span className="text-sm font-medium text-slate-700">DSCR</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          <strong>Fórmula:</strong> EBITDA ÷ Servicio de Deuda
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Benchmark:</strong> &gt; 1.25x (sector)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatRatio(riskMetrics.dscr)}
                  </p>
                  <Badge 
                    variant={riskMetrics.dscr >= 1.25 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {riskMetrics.dscr >= 1.25 ? 'Saludable' : 'Atención'}
                  </Badge>
                </div>

                {/* Net Debt / EBITDA */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#005E8A]" />
                    <span className="text-sm font-medium text-slate-700">Net Debt / EBITDA</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          <strong>Fórmula:</strong> Deuda Neta ÷ EBITDA
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Benchmark:</strong> &lt; 3x (sector)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatRatio(riskMetrics.netDebtEbitda)}
                  </p>
                  <Badge 
                    variant={riskMetrics.netDebtEbitda <= 3 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {riskMetrics.netDebtEbitda <= 3 ? 'Controlado' : 'Elevado'}
                  </Badge>
                </div>

                {/* Cobertura de Intereses */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#005E8A]" />
                    <span className="text-sm font-medium text-slate-700">Cobertura Intereses</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          <strong>Fórmula:</strong> EBITDA ÷ Gastos Financieros
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Benchmark:</strong> &gt; 5x (sector)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatRatio(riskMetrics.interestCoverage)}
                  </p>
                  <Badge 
                    variant={riskMetrics.interestCoverage >= 5 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {riskMetrics.interestCoverage >= 5 ? 'Sólida' : 'Moderada'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </TooltipProvider>
  );
};