interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedData?: any[];
}

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'date';
  validator?: (value: any) => boolean;
  transformer?: (value: any) => any;
}

class CSVValidator {
  private readonly requiredHeaders = ['concepto', 'importe'];
  private readonly periodHeaders = ['periodo', 'mes', 'año', 'anio', 'year'];
  
  validate(csvContent: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const processedData: any[] = [];

    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        errors.push('El CSV debe tener al menos una fila de datos además del header');
        return { isValid: false, errors, warnings };
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Verificar headers mínimos
      const missingHeaders = this.requiredHeaders.filter(required => 
        !headers.some(h => h.includes(required))
      );
      
      if (missingHeaders.length > 0) {
        errors.push(`Headers faltantes: ${missingHeaders.join(', ')}`);
      }

      // Verificar header de periodo
      const hasPeriodHeader = this.periodHeaders.some(period => 
        headers.some(h => h.includes(period))
      );
      
      if (!hasPeriodHeader) {
        errors.push(`Falta header de periodo. Debe incluir uno de: ${this.periodHeaders.join(', ')}`);
      }

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      // Procesar filas de datos
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push(`Fila ${i + 1}: Número incorrecto de columnas (esperadas: ${headers.length}, encontradas: ${values.length})`);
          continue;
        }

        const row: any = {};
        let hasErrors = false;

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          let value = values[j];

          // Transformar comas decimales a puntos
          if (header.includes('importe') || header.includes('amount') || header.includes('valor')) {
            value = value.replace(',', '.');
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              errors.push(`Fila ${i + 1}: '${value}' no es un número válido en columna '${header}'`);
              hasErrors = true;
            } else {
              row[header] = numValue;
            }
          } else {
            row[header] = value;
          }
        }

        if (!hasErrors) {
          processedData.push(row);
        }
      }

      // Verificar que hay datos válidos
      if (processedData.length === 0) {
        errors.push('No se encontraron filas válidas de datos');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        processedData: errors.length === 0 ? processedData : undefined
      };

    } catch (error) {
      errors.push(`Error parseando CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return { isValid: false, errors, warnings };
    }
  }

  validateFile(file: File): Promise<ValidationResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(this.validate(content));
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  }
}

export const csvValidator = new CSVValidator();