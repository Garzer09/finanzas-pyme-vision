# Plantilla Excel - Dashboard Financiero
## Instrucciones de Uso

### 📋 Información General
Esta plantilla está diseñada para facilitar la carga de datos financieros en el sistema de dashboard. Está compuesta por 5 hojas principales que cubren todos los aspectos necesarios para el análisis financiero.

### 📊 Hojas de la Plantilla

#### 1. **Balance de Situación**
- **Objetivo**: Reflejar la situación patrimonial de la empresa
- **Períodos**: Incluir al menos 3 años de datos
- **Validación**: El total de activo debe igualar el total de patrimonio neto + pasivo
- **Campos obligatorios**: Todos los conceptos principales del balance
- **Formato**: Valores en euros, sin decimales para importes grandes

#### 2. **Cuenta de Pérdidas y Ganancias**
- **Objetivo**: Mostrar la evolución de ingresos, gastos y resultados
- **Períodos**: Mismos años que el balance
- **Validación**: Coherencia entre gastos financieros y deuda del balance
- **Campos obligatorios**: Cifra de negocios, gastos principales, resultado del ejercicio
- **Cálculos automáticos**: EBITDA, márgenes principales

#### 3. **Ratios Financieros**
- **Objetivo**: Análisis de liquidez, solvencia, rentabilidad y actividad
- **Cálculo**: Los ratios se calculan automáticamente basándose en balance y PyG
- **Benchmarks**: Se incluyen valores de referencia para interpretación
- **Categorías**: Liquidez, endeudamiento, rentabilidad, actividad, crecimiento

#### 4. **Datos Operativos**
- **Objetivo**: Métricas operacionales y de producción
- **Unidades**: Especificar claramente las unidades de medida
- **Campos clave**: Producción, ventas, empleados, costes unitarios
- **Opcional**: Si la empresa no tiene datos operativos, dejar en blanco

#### 5. **Pool de Deuda**
- **Objetivo**: Detalle completo de la financiación externa
- **Por cada préstamo**: Entidad, importe, saldo, tipo interés, vencimiento
- **Garantías**: Especificar garantías asociadas a cada financiación
- **Vencimientos**: Incluir calendario de vencimientos por años

### ✅ Lista de Verificación Pre-Carga

#### Datos Obligatorios
- [ ] Balance de situación (mínimo 2 años)
- [ ] Cuenta de pérdidas y ganancias (mismos años que balance)
- [ ] Total activo = Total patrimonio + pasivo en balance
- [ ] Cifras en euros (sin símbolos de moneda)
- [ ] Fechas en formato consistente (31/12/YYYY)

#### Datos Recomendados
- [ ] Pool de deuda completo
- [ ] Ratios financieros básicos
- [ ] Datos operativos (si aplica)
- [ ] Mínimo 3 años de histórico

#### Validaciones Automáticas
- [ ] Coherencia entre balance y PyG
- [ ] Suma correcta de subtotales
- [ ] Formatos numéricos válidos
- [ ] Períodos consecutivos

### 🚨 Errores Comunes a Evitar

1. **Formatos incorrectos**
   - No usar puntos o comas como separadores de miles
   - Mantener consistencia en decimales
   - No incluir símbolos de moneda (€, $)

2. **Datos inconsistentes**
   - Gastos financieros no coherentes con deuda
   - Períodos no consecutivos
   - Balances que no cuadran

3. **Campos vacíos críticos**
   - Cifra de negocios
   - Total activo y pasivo
   - Resultado del ejercicio

4. **Unidades incorrectas**
   - Mezclar euros y miles de euros
   - No especificar unidades en datos operativos

### 📈 Proceso de Carga

1. **Completar plantilla** con datos reales de la empresa
2. **Verificar** que todas las validaciones están en verde
3. **Revisar** coherencia entre hojas
4. **Guardar** en formato Excel (.xlsx)
5. **Cargar** en la plataforma
6. **Validar** preview antes de confirmar

### 🆘 Soporte

Si encuentra errores durante la carga:
- Revisar que todos los campos obligatorios están completos
- Verificar formato de fechas y números
- Comprobar que el balance cuadra
- Contactar soporte técnico si persisten los problemas

### 📞 Contacto
- Email: soporte@dashboard-financiero.com
- Teléfono: +34 XXX XXX XXX
- Horario: L-V 9:00-18:00