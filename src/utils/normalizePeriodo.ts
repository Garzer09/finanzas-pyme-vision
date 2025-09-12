/**
 * Normaliza diferentes formatos de periodo a fecha ISO (fin de mes)
 */
export function normalizePeriodo(value: string, yearFallback?: number): string {
  const cleanValue = value.trim().toLowerCase();
  
  // Format: 2024-01
  const monthYearMatch = cleanValue.match(/^(\d{4})-(\d{1,2})$/);
  if (monthYearMatch) {
    const year = parseInt(monthYearMatch[1]);
    const month = parseInt(monthYearMatch[2]);
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
  }

  // Format: 2024Q1, 2024Q2, etc.
  const quarterMatch = cleanValue.match(/^(\d{4})q(\d)$/);
  if (quarterMatch) {
    const year = parseInt(quarterMatch[1]);
    const quarter = parseInt(quarterMatch[2]);
    const month = quarter * 3; // Q1=3, Q2=6, Q3=9, Q4=12
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
  }

  // Format: enero 2024, febrero 2024, etc.
  const monthNames: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
  };
  
  const textMonthMatch = cleanValue.match(/^(\w+)\s+(\d{4})$/);
  if (textMonthMatch) {
    const monthName = textMonthMatch[1];
    const year = parseInt(textMonthMatch[2]);
    const month = monthNames[monthName];
    if (month) {
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    }
  }

  // Format: 2024-01-15 (cualquier día específico, convertir a fin de mes)
  const specificDateMatch = cleanValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (specificDateMatch) {
    const year = parseInt(specificDateMatch[1]);
    const month = parseInt(specificDateMatch[2]);
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
  }

  // Format: just year (use December)
  const yearOnlyMatch = cleanValue.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[1]);
    return `${year}-12-31`;
  }

  throw new Error(`Formato de periodo no reconocido: ${value}`);
}