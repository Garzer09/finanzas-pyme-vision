// Validador de plantillas CSV - Verifica que las plantillas corregidas estén disponibles

export interface TemplateValidation {
  filename: string;
  available: boolean;
  hasCorrectSections: boolean;
  error?: string;
}

export async function validateTemplates(): Promise<TemplateValidation[]> {
  const templates = [
    'cuenta-pyg.csv',
    'balance-situacion.csv',
    'estado-flujos.csv',
    'empresa_cualitativa.csv',
    'pool-deuda.csv',
    'pool-deuda-vencimientos.csv',
    'datos-operativos.csv',
    'supuestos-financieros.csv'
  ];

  const results: TemplateValidation[] = [];

  for (const template of templates) {
    try {
      const response = await fetch(`/templates/${template}`);
      
      if (!response.ok) {
        results.push({
          filename: template,
          available: false,
          hasCorrectSections: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        });
        continue;
      }

      const content = await response.text();
      const hasCorrectSections = validateTemplateContent(template, content);

      results.push({
        filename: template,
        available: true,
        hasCorrectSections,
        error: hasCorrectSections ? undefined : 'Missing required sections/categories'
      });

    } catch (error) {
      results.push({
        filename: template,
        available: false,
        hasCorrectSections: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

function validateTemplateContent(filename: string, content: string): boolean {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length < 2) return false;

  switch (filename) {
    case 'balance-situacion.csv':
      // Should have section headers like "ACTIVO NO CORRIENTE", "ACTIVO CORRIENTE", etc.
      const balanceSections = [
        'ACTIVO NO CORRIENTE',
        'ACTIVO CORRIENTE', 
        'PATRIMONIO NETO',
        'PASIVO NO CORRIENTE',
        'PASIVO CORRIENTE'
      ];
      return balanceSections.some(section => content.includes(section));

    case 'estado-flujos.csv':
      // Should have category headers like "ACTIVIDADES DE EXPLOTACIÓN", etc.
      const cashflowCategories = [
        'ACTIVIDADES DE EXPLOTACIÓN',
        'ACTIVIDADES DE INVERSIÓN',
        'ACTIVIDADES DE FINANCIACIÓN'
      ];
      return cashflowCategories.some(category => content.includes(category));

    case 'cuenta-pyg.csv':
      // Should have standard P&G concepts
      const pygConcepts = [
        'Cifra de negocios',
        'Aprovisionamientos',
        'Gastos de personal'
      ];
      return pygConcepts.some(concept => content.includes(concept));

    default:
      // For other templates, just check they have content
      return lines.length > 1;
  }
}

export function logTemplateValidation(results: TemplateValidation[]) {
  console.group('📋 VALIDACIÓN DE PLANTILLAS CSV');
  
  const available = results.filter(r => r.available).length;
  const withCorrectSections = results.filter(r => r.hasCorrectSections).length;
  
  console.log(`✅ Plantillas disponibles: ${available}/${results.length}`);
  console.log(`✅ Con secciones correctas: ${withCorrectSections}/${results.length}`);
  
  results.forEach(result => {
    const status = result.available 
      ? (result.hasCorrectSections ? '✅' : '⚠️') 
      : '❌';
    
    console.log(`${status} ${result.filename}${result.error ? ` - ${result.error}` : ''}`);
  });
  
  console.groupEnd();
}
