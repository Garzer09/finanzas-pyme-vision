import { useState, useCallback } from 'react';

interface YearDetectionResult {
  detectedYears: number[];
  confidence: number;
  yearColumns: string[];
  sampleData: Record<number, string[]>;
}

export const useDataYearDetection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectYearsFromCSV = useCallback((csvContent: string): YearDetectionResult => {
    try {
      setLoading(true);
      setError(null);

      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must have at least headers and one data row');
      }

      // Detect delimiter
      const detectDelimiter = (line: string): string => {
        const delimiters = [',', ';', '\t'];
        let maxCount = 0;
        let detectedDelimiter = ',';
        
        for (const delimiter of delimiters) {
          const count = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
          if (count > maxCount) {
            maxCount = count;
            detectedDelimiter = delimiter;
          }
        }
        return detectedDelimiter;
      };

      const delimiter = detectDelimiter(lines[0]);
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
      
      // Look for year-related columns
      const yearColumns: string[] = [];
      const yearPattern = /(?:año|year|periodo|period)/i;
      const directYearPattern = /^(19|20)\d{2}$/;
      
      headers.forEach(header => {
        if (yearPattern.test(header) || directYearPattern.test(header)) {
          yearColumns.push(header);
        }
      });

      const detectedYears = new Set<number>();
      const sampleData: Record<number, string[]> = {};
      
      // Parse data rows to find years
      for (let i = 1; i < Math.min(lines.length, 50); i++) { // Check first 50 rows
        const row = lines[i].split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
        
        row.forEach((cell, index) => {
          const header = headers[index];
          
          // Look for 4-digit years in the data
          const yearMatch = cell.match(/(?:^|[\s\-\/])(?:19|20)(\d{2})(?:[\s\-\/]|$)/);
          if (yearMatch) {
            const year = parseInt(`20${yearMatch[1]}`) || parseInt(`19${yearMatch[1]}`);
            if (year >= 1990 && year <= new Date().getFullYear() + 5) {
              detectedYears.add(year);
              if (!sampleData[year]) sampleData[year] = [];
              sampleData[year].push(`${header}: ${cell}`);
            }
          }
          
          // Check if cell is just a year
          const directYear = parseInt(cell);
          if (directYear >= 1990 && directYear <= new Date().getFullYear() + 5) {
            detectedYears.add(directYear);
            if (!sampleData[directYear]) sampleData[directYear] = [];
            sampleData[directYear].push(`${header}: ${cell}`);
          }
          
          // Look for date patterns
          const datePatterns = [
            /(\d{4})-\d{2}-\d{2}/, // YYYY-MM-DD
            /\d{2}\/\d{2}\/(\d{4})/, // MM/DD/YYYY
            /\d{2}-\d{2}-(\d{4})/, // DD-MM-YYYY
          ];
          
          datePatterns.forEach(pattern => {
            const match = cell.match(pattern);
            if (match) {
              const year = parseInt(match[1]);
              if (year >= 1990 && year <= new Date().getFullYear() + 5) {
                detectedYears.add(year);
                if (!sampleData[year]) sampleData[year] = [];
                sampleData[year].push(`${header}: ${cell}`);
              }
            }
          });
        });
      }

      const yearsArray = Array.from(detectedYears).sort();
      
      // Calculate confidence based on how many years we found and their consistency
      let confidence = 0;
      if (yearsArray.length > 0) {
        confidence = 0.5; // Base confidence for finding any years
        
        // Increase confidence if we found multiple consecutive years
        if (yearsArray.length > 1) {
          const isConsecutive = yearsArray.every((year, index) => 
            index === 0 || year === yearsArray[index - 1] + 1
          );
          if (isConsecutive) confidence += 0.3;
        }
        
        // Increase confidence if we found year columns
        if (yearColumns.length > 0) confidence += 0.2;
        
        confidence = Math.min(confidence, 1);
      }

      return {
        detectedYears: yearsArray,
        confidence,
        yearColumns,
        sampleData
      };
    } catch (err: any) {
      setError(err.message);
      return {
        detectedYears: [],
        confidence: 0,
        yearColumns: [],
        sampleData: {}
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const detectYearsFromFiles = useCallback((files: Array<{ name: string; content: any[] | string; headers?: string[] }>): YearDetectionResult => {
    try {
      setLoading(true);
      setError(null);

      const allYears = new Set<number>();
      const allSampleData: Record<number, string[]> = {};
      let totalConfidence = 0;
      let fileCount = 0;

      files.forEach(file => {
        let csvContent = '';
        
        if (typeof file.content === 'string') {
          csvContent = file.content;
        } else if (Array.isArray(file.content) && file.headers) {
          // Convert array data back to CSV
          const headers = file.headers.join(',');
          const rows = file.content.map(row => 
            Array.isArray(row) ? row.join(',') : Object.values(row).join(',')
          ).join('\n');
          csvContent = headers + '\n' + rows;
        } else {
          return; // Skip this file
        }

        try {
          const result = detectYearsFromCSV(csvContent);
          result.detectedYears.forEach(year => allYears.add(year));
          
          Object.entries(result.sampleData).forEach(([year, samples]) => {
            const yearNum = parseInt(year);
            if (!allSampleData[yearNum]) allSampleData[yearNum] = [];
            allSampleData[yearNum].push(...samples.map(s => `${file.name}: ${s}`));
          });
          
          totalConfidence += result.confidence;
          fileCount++;
        } catch (err) {
          console.warn(`Could not detect years from file ${file.name}:`, err);
        }
      });

      const avgConfidence = fileCount > 0 ? totalConfidence / fileCount : 0;
      
      return {
        detectedYears: Array.from(allYears).sort(),
        confidence: avgConfidence,
        yearColumns: [], // Not applicable for multi-file detection
        sampleData: allSampleData
      };
    } catch (err: any) {
      setError(err.message);
      return {
        detectedYears: [],
        confidence: 0,
        yearColumns: [],
        sampleData: {}
      };
    } finally {
      setLoading(false);
    }
  }, [detectYearsFromCSV]);

  return {
    detectYearsFromCSV,
    detectYearsFromFiles,
    loading,
    error
  };
};