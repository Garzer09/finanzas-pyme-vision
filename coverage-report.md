# Cobertura de Seguridad y Datos Reales (Dashboard Financiero)

Resumen del estado tras la implementación inicial de aislamiento por empresa y datos 100% reales desde Supabase.

## Métricas de seguridad
- ✅ RLS activas en tablas: fs_pyg_lines, fs_balance_lines, financial_series_unified, financial_assumptions_normalized, operational_metrics, debt_balances, fs_cashflow_lines, debt_loans, debt_maturities
- ✅ Todas las queries principales usan .eq('company_id', companyId)
- ✅ Validación de acceso en hooks (validateCompanyAccess): useFinancialData, useCashFlowData, useDebtData
- ✅ Test E2E de aislamiento básico: tests/e2e/company-isolation.spec.ts
- ⚠️ Pendiente: pruebas de switching completas entre dos empresas con datos (requiere COMPANY1_ID/COMPANY2_ID)

## Mapeo Pantalla → Tabla/Vista → Hook

| Pantalla | Tabla/Vista Principal | Hook Usado | Test E2E | Status |
|---|---|---|---|---|
| cuenta-pyg | fs_pyg_lines | useFinancialData | company-isolation | EN PROCESO |
| balance-situacion | fs_balance_lines | useFinancialData | company-isolation | EN PROCESO |
| ratios-financieros | fs_pyg_lines + fs_balance_lines | useFinancialData | company-isolation | EN PROCESO |
| flujos-caja | fs_cashflow_lines | useCashFlowData | company-isolation | EN PROCESO |
| analisis-nof | fs_balance_lines | useFinancialData | company-isolation | EN PROCESO |
| punto-muerto | fs_pyg_lines + operational_metrics | useFinancialData (+ops) | company-isolation | EN PROCESO |
| endeudamiento | debt_loans + debt_maturities (+debt_balances histórico) | useDebtData | company-isolation | EN PROCESO |
| servicio-deuda | debt_maturities + debt_loans | useDebtData | company-isolation | EN PROCESO |
| situacion-actual | financial_series_unified | useFinancialData | company-isolation | EN PROCESO |
| supuestos-financieros | financial_assumptions_normalized | useFinancialAssumptionsData | company-isolation | EN PROCESO |
| proyecciones | financial_series_unified (scenario='projection') | useFinancialData | company-isolation | EN PROCESO |
| escenarios | financial_series_unified (multi-scenario) | useFinancialData | company-isolation | EN PROCESO |
| valoracion-eva | combinadas | múltiples | company-isolation | EN PROCESO |

Notas:
- Se eliminaron estimaciones en useCashFlowData; todos los KPIs derivados se calculan solo con datos reales disponibles.
- useDebtData ahora consume debt_loans/debt_maturities y calcula cuotas/vencimientos reales.

## Siguientes pasos propuestos
1. Completar suite de switching: tests/e2e/company-switching.spec.ts (definir COMPANY1_ID/COMPANY2_ID con membresías reales).
2. Añadir asserts específicos por pantalla (indicadores clave presentes) tras cargar datos reales.
3. Considerar vistas SQL para KPIs canónicos (vw_pyg_kpis, vw_balance_kpis) si se requiere estandarizar conceptos.
